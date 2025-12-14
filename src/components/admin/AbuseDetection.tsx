import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, Shield, Ban, Search, RefreshCw, Eye, 
  XCircle, CheckCircle, TrendingUp, Users, DollarSign, Link2, ShieldOff, ShieldCheck, Mail,
  Download, Bell, Zap, Network
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logAdminAction } from '@/lib/auditLog';
import AccountRelationshipGraph from './AccountRelationshipGraph';

interface AccountRestriction {
  id: string;
  user_id: string;
  is_promotional_restricted: boolean;
  restriction_reason: string | null;
  restricted_at: string | null;
  abuse_score: number;
  early_cancellations: number;
  discount_reversals: number;
  coupon_rejections: number;
  pause_cycles: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    email: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  crossAccountFlags?: CrossAccountFlag[];
  clusterRiskScore?: number;
}

interface CrossAccountFlag {
  type: 'shared_payment' | 'shared_address';
  linkedUserId: string;
  linkedUserEmail?: string;
  isRestricted: boolean;
}

interface CouponAuditLog {
  id: string;
  user_id: string;
  promotion_id: string | null;
  coupon_code: string;
  action: string;
  reason_code: string | null;
  discount_amount: number | null;
  created_at: string;
  profile?: {
    email: string;
  };
}

interface AbuseStats {
  totalRestricted: number;
  highRiskAccounts: number;
  totalReversals: number;
  totalRejections: number;
  crossAccountFlags: number;
}

interface FraudCluster {
  primaryUserId: string;
  primaryEmail: string;
  linkedUserIds: string[];
  linkedEmails: string[];
  totalRiskScore: number;
  clusterRiskScore: number;
  anyRestricted: boolean;
}

const ABUSE_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  AUTO_RESTRICT: 100,
  CLUSTER_ALERT: 150,
};

// Weighted scoring for fraud risk
const RISK_WEIGHTS = {
  baseScore: 1,
  sharedPaymentMethod: 25,
  sharedAddress: 15,
  linkedToRestricted: 35,
  multipleLinks: 10,
};

const AbuseDetection = () => {
  const [restrictions, setRestrictions] = useState<AccountRestriction[]>([]);
  const [couponLogs, setCouponLogs] = useState<CouponAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AbuseStats>({ totalRestricted: 0, highRiskAccounts: 0, totalReversals: 0, totalRejections: 0, crossAccountFlags: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<AccountRestriction | null>(null);
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false);
  const [restrictionNotes, setRestrictionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [fraudClusters, setFraudClusters] = useState<FraudCluster[]>([]);
  const [bulkRestrictLoading, setBulkRestrictLoading] = useState<string | null>(null);

  // Calculate cluster risk score with weighted algorithm
  const calculateClusterRiskScore = useCallback((
    restriction: AccountRestriction,
    allRestrictions: AccountRestriction[]
  ): number => {
    let score = restriction.abuse_score * RISK_WEIGHTS.baseScore;
    
    if (restriction.crossAccountFlags) {
      restriction.crossAccountFlags.forEach(flag => {
        if (flag.type === 'shared_payment') {
          score += RISK_WEIGHTS.sharedPaymentMethod;
        } else if (flag.type === 'shared_address') {
          score += RISK_WEIGHTS.sharedAddress;
        }
        
        if (flag.isRestricted) {
          score += RISK_WEIGHTS.linkedToRestricted;
        }
      });
      
      if (restriction.crossAccountFlags.length > 1) {
        score += RISK_WEIGHTS.multipleLinks * (restriction.crossAccountFlags.length - 1);
      }
    }
    
    return score;
  }, []);

  // Build fraud clusters
  const buildFraudClusters = useCallback((
    restrictionsData: AccountRestriction[],
    profilesMap: Record<string, any>
  ): FraudCluster[] => {
    const clusters: FraudCluster[] = [];
    const processedUsers = new Set<string>();

    restrictionsData.forEach(restriction => {
      if (processedUsers.has(restriction.user_id)) return;
      if (!restriction.crossAccountFlags || restriction.crossAccountFlags.length === 0) return;

      const linkedUserIds = restriction.crossAccountFlags.map(f => f.linkedUserId);
      const linkedEmails = linkedUserIds.map(id => profilesMap[id]?.email || 'Unknown');
      
      // Calculate cluster risk
      const clusterMembers = [restriction, ...restrictionsData.filter(r => linkedUserIds.includes(r.user_id))];
      const totalRiskScore = clusterMembers.reduce((sum, r) => sum + r.abuse_score, 0);
      const clusterRiskScore = clusterMembers.reduce((sum, r) => 
        sum + calculateClusterRiskScore(r, restrictionsData), 0
      );
      
      const anyRestricted = clusterMembers.some(r => r.is_promotional_restricted);

      clusters.push({
        primaryUserId: restriction.user_id,
        primaryEmail: profilesMap[restriction.user_id]?.email || 'Unknown',
        linkedUserIds,
        linkedEmails,
        totalRiskScore,
        clusterRiskScore,
        anyRestricted,
      });

      linkedUserIds.forEach(id => processedUsers.add(id));
      processedUsers.add(restriction.user_id);
    });

    return clusters.sort((a, b) => b.clusterRiskScore - a.clusterRiskScore);
  }, [calculateClusterRiskScore]);

  // Real-time subscription for abuse score changes
  useEffect(() => {
    fetchData();

    // Subscribe to real-time changes on account_restrictions
    const channel = supabase
      .channel('abuse-alerts')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'account_restrictions',
        },
        async (payload) => {
          const newData = payload.new as any;
          const oldData = payload.old as any;
          
          // Check if score crossed high-risk threshold
          if (newData.abuse_score >= ABUSE_THRESHOLDS.HIGH && oldData.abuse_score < ABUSE_THRESHOLDS.HIGH) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', newData.user_id)
              .single();
            
            toast.warning(`🚨 High-Risk Alert: ${profile?.email || 'Unknown'} crossed threshold (Score: ${newData.abuse_score})`, {
              duration: 10000,
              action: {
                label: 'View',
                onClick: () => setSearchTerm(profile?.email || ''),
              },
            });

            // Trigger email notification
            await supabase.functions.invoke('send-abuse-notification', {
              body: {
                type: 'account_restricted',
                userId: newData.user_id,
                abuseScore: newData.abuse_score,
                reason: 'Abuse score crossed high-risk threshold',
              },
            });
          }

          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cross-account detection function
  const detectCrossAccountAbuse = async (
    userIds: string[], 
    restrictionsData: any[]
  ): Promise<Record<string, CrossAccountFlag[]>> => {
    if (userIds.length === 0) return {};

    const flags: Record<string, CrossAccountFlag[]> = {};
    const restrictedUserIds = new Set(
      restrictionsData.filter(r => r.is_promotional_restricted).map(r => r.user_id)
    );

    try {
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('user_id, card_last_four, card_brand')
        .in('user_id', userIds);

      if (paymentMethods) {
        const cardMap: Record<string, string[]> = {};
        paymentMethods.forEach(pm => {
          if (pm.card_last_four && pm.card_brand) {
            const key = `${pm.card_brand}-${pm.card_last_four}`;
            if (!cardMap[key]) cardMap[key] = [];
            cardMap[key].push(pm.user_id);
          }
        });

        Object.entries(cardMap).forEach(([_, users]) => {
          if (users.length > 1) {
            users.forEach(userId => {
              const linkedUsers = users.filter(u => u !== userId);
              linkedUsers.forEach(linkedUserId => {
                if (!flags[userId]) flags[userId] = [];
                flags[userId].push({
                  type: 'shared_payment',
                  linkedUserId,
                  isRestricted: restrictedUserIds.has(linkedUserId),
                });
              });
            });
          }
        });
      }

      const { data: addresses } = await supabase
        .from('addresses')
        .select('user_id, address_line1, postal_code')
        .in('user_id', userIds);

      if (addresses) {
        const addressMap: Record<string, string[]> = {};
        addresses.forEach(addr => {
          if (addr.address_line1 && addr.postal_code) {
            const key = `${addr.address_line1.toLowerCase().trim()}-${addr.postal_code}`;
            if (!addressMap[key]) addressMap[key] = [];
            if (!addressMap[key].includes(addr.user_id)) {
              addressMap[key].push(addr.user_id);
            }
          }
        });

        Object.entries(addressMap).forEach(([_, users]) => {
          if (users.length > 1) {
            users.forEach(userId => {
              const linkedUsers = users.filter(u => u !== userId);
              linkedUsers.forEach(linkedUserId => {
                if (!flags[userId]) flags[userId] = [];
                const exists = flags[userId].some(
                  f => f.type === 'shared_address' && f.linkedUserId === linkedUserId
                );
                if (!exists) {
                  flags[userId].push({
                    type: 'shared_address',
                    linkedUserId,
                    isRestricted: restrictedUserIds.has(linkedUserId),
                  });
                }
              });
            });
          }
        });
      }
    } catch (error) {
      console.error('Error detecting cross-account abuse:', error);
    }

    return flags;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: restrictionsData, error: restrictionsError } = await supabase
        .from('account_restrictions')
        .select('*')
        .order('abuse_score', { ascending: false });

      if (restrictionsError) throw restrictionsError;

      const userIds = restrictionsData?.map(r => r.user_id) || [];
      let profilesMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, first_name, last_name')
          .in('id', userIds);
        
        profiles?.forEach(p => {
          profilesMap[p.id] = p;
        });
      }

      const crossAccountFlags = await detectCrossAccountAbuse(userIds, restrictionsData || []);

      const enrichedRestrictions = restrictionsData?.map(r => {
        const enriched = {
          ...r,
          profile: profilesMap[r.user_id],
          crossAccountFlags: crossAccountFlags[r.user_id] || [],
        };
        return {
          ...enriched,
          clusterRiskScore: calculateClusterRiskScore(enriched as AccountRestriction, restrictionsData as any[]),
        };
      }) || [];

      setRestrictions(enrichedRestrictions);

      // Build fraud clusters
      const clusters = buildFraudClusters(enrichedRestrictions as AccountRestriction[], profilesMap);
      setFraudClusters(clusters);

      // Check for high-risk clusters and alert
      const highRiskClusters = clusters.filter(c => c.clusterRiskScore >= ABUSE_THRESHOLDS.CLUSTER_ALERT);
      if (highRiskClusters.length > 0) {
        toast.warning(`⚠️ ${highRiskClusters.length} high-risk fraud cluster(s) detected`, {
          duration: 8000,
        });
      }

      const restricted = enrichedRestrictions.filter(r => r.is_promotional_restricted).length;
      const highRisk = enrichedRestrictions.filter(r => r.abuse_score >= ABUSE_THRESHOLDS.HIGH).length;
      const totalReversals = enrichedRestrictions.reduce((sum, r) => sum + r.discount_reversals, 0);
      const totalRejections = enrichedRestrictions.reduce((sum, r) => sum + r.coupon_rejections, 0);
      const totalCrossFlags = enrichedRestrictions.filter(r => (r.crossAccountFlags?.length || 0) > 0).length;

      setStats({
        totalRestricted: restricted,
        highRiskAccounts: highRisk,
        totalReversals,
        totalRejections,
        crossAccountFlags: totalCrossFlags,
      });

      const { data: logsData, error: logsError } = await supabase
        .from('coupon_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      const logUserIds = [...new Set(logsData?.map(l => l.user_id) || [])];
      let logProfilesMap: Record<string, any> = {};
      
      if (logUserIds.length > 0) {
        const { data: logProfiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', logUserIds);
        
        logProfiles?.forEach(p => {
          logProfilesMap[p.id] = p;
        });
      }

      const enrichedLogs = logsData?.map(l => ({
        ...l,
        profile: logProfilesMap[l.user_id],
      })) || [];

      setCouponLogs(enrichedLogs);
    } catch (error) {
      console.error('Error fetching abuse data:', error);
      toast.error('Failed to load abuse detection data');
    } finally {
      setLoading(false);
    }
  };

  // Export restrictions to CSV
  const exportRestrictionsCSV = () => {
    const headers = ['Email', 'Name', 'Abuse Score', 'Cluster Risk', 'Early Cancellations', 'Discount Reversals', 'Coupon Rejections', 'Pause Cycles', 'Status', 'Cross-Account Links', 'Restricted At', 'Reason'];
    const rows = filteredRestrictions.map(r => [
      r.profile?.email || '',
      r.profile?.full_name || `${r.profile?.first_name || ''} ${r.profile?.last_name || ''}`.trim(),
      r.abuse_score,
      r.clusterRiskScore || 0,
      r.early_cancellations,
      r.discount_reversals,
      r.coupon_rejections,
      r.pause_cycles,
      r.is_promotional_restricted ? 'Restricted' : 'Active',
      r.crossAccountFlags?.length || 0,
      r.restricted_at ? format(new Date(r.restricted_at), 'yyyy-MM-dd HH:mm') : '',
      r.restriction_reason || '',
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    downloadCSV(csv, 'account-restrictions.csv');
  };

  // Export coupon logs to CSV
  const exportCouponLogsCSV = () => {
    const headers = ['Date', 'Email', 'Coupon Code', 'Action', 'Reason', 'Discount Amount'];
    const rows = filteredLogs.map(l => [
      format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
      l.profile?.email || '',
      l.coupon_code,
      l.action,
      l.reason_code || '',
      l.discount_amount || '',
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    downloadCSV(csv, 'coupon-audit-log.csv');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  // Bulk restrict entire fraud cluster
  const bulkRestrictCluster = async (cluster: FraudCluster) => {
    setBulkRestrictLoading(cluster.primaryUserId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const allUserIds = [cluster.primaryUserId, ...cluster.linkedUserIds];

      const { error } = await supabase
        .from('account_restrictions')
        .update({
          is_promotional_restricted: true,
          restriction_reason: 'Bulk restriction - Fraud cluster detected',
          restricted_at: new Date().toISOString(),
          restricted_by: user?.id,
        })
        .in('user_id', allUserIds);

      if (error) throw error;

      await logAdminAction({
        actionType: 'account_restricted',
        entityType: 'fraud_cluster',
        entityId: cluster.primaryUserId,
        newValues: { 
          affectedAccounts: allUserIds.length, 
          clusterRiskScore: cluster.clusterRiskScore,
          reason: 'Bulk cluster restriction' 
        },
      });

      // Send alert email
      await supabase.functions.invoke('send-abuse-notification', {
        body: {
          type: 'cross_account_detected',
          userId: cluster.primaryUserId,
          abuseScore: cluster.totalRiskScore,
          crossAccountLinks: cluster.linkedUserIds.map((id, i) => ({
            userId: id,
            email: cluster.linkedEmails[i],
            type: 'shared_payment',
            isRestricted: true,
          })),
        },
      });

      toast.success(`Restricted ${allUserIds.length} accounts in fraud cluster`);
      fetchData();
    } catch (error) {
      console.error('Error bulk restricting cluster:', error);
      toast.error('Failed to restrict cluster');
    } finally {
      setBulkRestrictLoading(null);
    }
  };

  const getAbuseScoreBadge = (score: number) => {
    if (score >= ABUSE_THRESHOLDS.HIGH) {
      return <Badge variant="destructive">High Risk ({score})</Badge>;
    } else if (score >= ABUSE_THRESHOLDS.MEDIUM) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Medium Risk ({score})</Badge>;
    } else if (score >= ABUSE_THRESHOLDS.LOW) {
      return <Badge variant="secondary">Low Risk ({score})</Badge>;
    }
    return <Badge variant="outline">Clean ({score})</Badge>;
  };

  const getClusterRiskBadge = (score: number) => {
    if (score >= ABUSE_THRESHOLDS.CLUSTER_ALERT) {
      return <Badge variant="destructive"><Zap className="h-3 w-3 mr-1" />Critical ({score})</Badge>;
    } else if (score >= ABUSE_THRESHOLDS.AUTO_RESTRICT) {
      return <Badge className="bg-orange-500 hover:bg-orange-600"><AlertTriangle className="h-3 w-3 mr-1" />High ({score})</Badge>;
    } else if (score >= ABUSE_THRESHOLDS.MEDIUM) {
      return <Badge variant="secondary">Medium ({score})</Badge>;
    }
    return <Badge variant="outline">Low ({score})</Badge>;
  };

  const getActionBadge = (action: string) => {
    if (action === 'applied') {
      return <Badge className="bg-green-600">Applied</Badge>;
    }
    return <Badge variant="destructive">Rejected</Badge>;
  };

  const getReasonBadge = (reason: string | null) => {
    const reasons: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'success': { label: 'Success', variant: 'default' },
      'invalid_code': { label: 'Invalid Code', variant: 'destructive' },
      'expired': { label: 'Expired', variant: 'secondary' },
      'max_uses_exceeded': { label: 'Max Uses', variant: 'destructive' },
      'not_subscription_eligible': { label: 'Not Eligible', variant: 'secondary' },
      'already_used': { label: 'Already Used', variant: 'destructive' },
      'account_restricted': { label: 'Account Restricted', variant: 'destructive' },
    };
    
    const config = reasons[reason || ''] || { label: reason || 'Unknown', variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleRestrict = async (restrict: boolean) => {
    if (!selectedAccount) return;
    
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        is_promotional_restricted: restrict,
        restriction_reason: restrict ? restrictionNotes || 'Manual restriction by admin' : null,
        restricted_at: restrict ? new Date().toISOString() : null,
        restricted_by: restrict ? user?.id : null,
        notes: restrictionNotes || selectedAccount.notes,
      };

      const { error } = await supabase
        .from('account_restrictions')
        .update(updateData)
        .eq('id', selectedAccount.id);

      if (error) throw error;

      await logAdminAction({
        actionType: restrict ? 'account_restricted' : 'account_unrestricted',
        entityType: 'account_restrictions',
        entityId: selectedAccount.user_id,
        oldValues: { is_promotional_restricted: selectedAccount.is_promotional_restricted },
        newValues: { is_promotional_restricted: restrict, reason: updateData.restriction_reason },
      });

      toast.success(restrict ? 'Account promotional access restricted' : 'Account restrictions removed');
      setRestrictDialogOpen(false);
      setRestrictionNotes('');
      setSelectedAccount(null);
      fetchData();
    } catch (error) {
      console.error('Error updating restriction:', error);
      toast.error('Failed to update account restriction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickToggleRestriction = async (restriction: AccountRestriction, restrict: boolean) => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        is_promotional_restricted: restrict,
        restriction_reason: restrict ? 'Quick restriction by admin' : null,
        restricted_at: restrict ? new Date().toISOString() : null,
        restricted_by: restrict ? user?.id : null,
      };

      const { error } = await supabase
        .from('account_restrictions')
        .update(updateData)
        .eq('id', restriction.id);

      if (error) throw error;

      await logAdminAction({
        actionType: restrict ? 'account_restricted' : 'account_unrestricted',
        entityType: 'account_restrictions',
        entityId: restriction.user_id,
        oldValues: { is_promotional_restricted: restriction.is_promotional_restricted },
        newValues: { is_promotional_restricted: restrict },
      });

      toast.success(restrict ? 'Account restricted' : 'Restriction lifted');
      fetchData();
    } catch (error) {
      console.error('Error toggling restriction:', error);
      toast.error('Failed to update restriction');
    } finally {
      setActionLoading(false);
    }
  };

  const sendCrossAccountAlert = async (restriction: AccountRestriction) => {
    if (!restriction.crossAccountFlags || restriction.crossAccountFlags.length === 0) {
      toast.error('No cross-account links to report');
      return;
    }

    setActionLoading(true);
    try {
      const linkedUserIds = restriction.crossAccountFlags.map(f => f.linkedUserId);
      const { data: linkedProfiles } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', linkedUserIds);

      const crossAccountLinks = restriction.crossAccountFlags.map(flag => ({
        userId: flag.linkedUserId,
        email: linkedProfiles?.find(p => p.id === flag.linkedUserId)?.email || 'Unknown',
        type: flag.type,
        isRestricted: flag.isRestricted,
      }));

      const { error } = await supabase.functions.invoke('send-abuse-notification', {
        body: {
          type: 'cross_account_detected',
          userId: restriction.user_id,
          abuseScore: restriction.abuse_score,
          crossAccountLinks,
        },
      });

      if (error) throw error;
      toast.success('Cross-account fraud alert sent to admin');
    } catch (error) {
      console.error('Error sending cross-account alert:', error);
      toast.error('Failed to send alert');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRestrictions = restrictions.filter(r => {
    const matchesSearch = !searchTerm || 
      r.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = riskFilter === 'all' ||
      (riskFilter === 'high' && r.abuse_score >= ABUSE_THRESHOLDS.HIGH) ||
      (riskFilter === 'medium' && r.abuse_score >= ABUSE_THRESHOLDS.MEDIUM && r.abuse_score < ABUSE_THRESHOLDS.HIGH) ||
      (riskFilter === 'low' && r.abuse_score >= ABUSE_THRESHOLDS.LOW && r.abuse_score < ABUSE_THRESHOLDS.MEDIUM) ||
      (riskFilter === 'restricted' && r.is_promotional_restricted) ||
      (riskFilter === 'cross-account' && (r.crossAccountFlags?.length || 0) > 0);
    
    return matchesSearch && matchesRisk;
  });

  const filteredLogs = couponLogs.filter(log => {
    return !searchTerm || 
      log.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.coupon_code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Abuse Detection & Prevention
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor suspicious account activity and manage promotional restrictions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportRestrictionsCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export Restrictions
          </Button>
          <Button variant="outline" size="sm" onClick={exportCouponLogsCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <Ban className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restricted Accounts</p>
                <p className="text-2xl font-bold">{stats.totalRestricted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Risk Accounts</p>
                <p className="text-2xl font-bold">{stats.highRiskAccounts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/10">
                <Network className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fraud Clusters</p>
                <p className="text-2xl font-bold">{fraudClusters.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Discount Reversals</p>
                <p className="text-2xl font-bold">{stats.totalReversals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-muted">
                <XCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coupon Rejections</p>
                <p className="text-2xl font-bold">{stats.totalRejections}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList>
          <TabsTrigger value="accounts">Account Risk Tracking</TabsTrigger>
          <TabsTrigger value="clusters">Fraud Clusters ({fraudClusters.length})</TabsTrigger>
          <TabsTrigger value="graph">Relationship Graph</TabsTrigger>
          <TabsTrigger value="coupon-logs">Coupon Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="cross-account">Cross-Account Flags</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Cluster Risk</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead>Early Cancel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRestrictions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No accounts with abuse tracking found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRestrictions.map((restriction) => (
                      <TableRow key={restriction.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{restriction.profile?.email || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              {restriction.profile?.full_name || 
                               `${restriction.profile?.first_name || ''} ${restriction.profile?.last_name || ''}`.trim() || 
                               'No name'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getAbuseScoreBadge(restriction.abuse_score)}</TableCell>
                        <TableCell>{getClusterRiskBadge(restriction.clusterRiskScore || 0)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {restriction.crossAccountFlags?.map((flag, i) => (
                              <Badge 
                                key={i} 
                                variant={flag.isRestricted ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                <Link2 className="h-3 w-3 mr-1" />
                                {flag.type === 'shared_payment' ? 'Payment' : 'Address'}
                              </Badge>
                            ))}
                            {(!restriction.crossAccountFlags || restriction.crossAccountFlags.length === 0) && (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{restriction.early_cancellations}</TableCell>
                        <TableCell>
                          {restriction.is_promotional_restricted ? (
                            <Badge variant="destructive">Restricted</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(restriction.crossAccountFlags?.length || 0) > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => sendCrossAccountAlert(restriction)}
                                disabled={actionLoading}
                                title="Send Cross-Account Alert"
                              >
                                <Mail className="h-4 w-4 text-purple-600" />
                              </Button>
                            )}
                            {restriction.is_promotional_restricted ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickToggleRestriction(restriction, false)}
                                disabled={actionLoading}
                                title="Lift Restriction"
                              >
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickToggleRestriction(restriction, true)}
                                disabled={actionLoading}
                                title="Restrict Account"
                              >
                                <ShieldOff className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAccount(restriction);
                                setRestrictionNotes(restriction.notes || '');
                                setRestrictDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Detected Fraud Clusters
              </CardTitle>
              <CardDescription>
                Groups of accounts linked by shared payment methods or addresses. Higher cluster risk scores indicate more suspicious patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fraudClusters.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No fraud clusters detected</p>
              ) : (
                <div className="space-y-4">
                  {fraudClusters.map((cluster, idx) => (
                    <div key={cluster.primaryUserId} className={`p-4 rounded-lg border ${cluster.clusterRiskScore >= ABUSE_THRESHOLDS.CLUSTER_ALERT ? 'border-destructive bg-destructive/5' : 'border-border'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{cluster.primaryEmail}</h4>
                            {getClusterRiskBadge(cluster.clusterRiskScore)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {cluster.linkedUserIds.length} linked account(s) • Total risk: {cluster.totalRiskScore}
                          </p>
                        </div>
                        <Button
                          variant={cluster.anyRestricted ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => bulkRestrictCluster(cluster)}
                          disabled={bulkRestrictLoading === cluster.primaryUserId || cluster.anyRestricted}
                        >
                          {bulkRestrictLoading === cluster.primaryUserId ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          {cluster.anyRestricted ? 'Partially Restricted' : 'Restrict Cluster'}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cluster.linkedEmails.map((email, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Link2 className="h-3 w-3 mr-1" />
                            {email}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graph" className="space-y-4">
          <AccountRelationshipGraph 
            accounts={restrictions.map(r => ({
              id: r.id,
              userId: r.user_id,
              email: r.profile?.email || 'Unknown',
              isRestricted: r.is_promotional_restricted,
              abuseScore: r.abuse_score,
              crossAccountFlags: r.crossAccountFlags || [],
            }))}
          />
        </TabsContent>

        <TabsContent value="coupon-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Coupon Activity</CardTitle>
              <CardDescription>
                Track all coupon applications and rejections with reason codes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Coupon Code</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No coupon activity logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{log.profile?.email || 'Unknown'}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {log.coupon_code}
                          </code>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>{getReasonBadge(log.reason_code)}</TableCell>
                        <TableCell>
                          {log.discount_amount ? `$${log.discount_amount.toFixed(2)}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={restrictDialogOpen} onOpenChange={setRestrictDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Account Restrictions</DialogTitle>
            <DialogDescription>
              {selectedAccount?.profile?.email || 'Unknown account'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Abuse Score</p>
                  <p className="font-bold text-lg">{selectedAccount.abuse_score}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cluster Risk</p>
                  <p className="font-bold text-lg">{selectedAccount.clusterRiskScore || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {selectedAccount.is_promotional_restricted ? (
                    <Badge variant="destructive">Restricted</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cross-Account Links</p>
                  <p className="font-medium">{selectedAccount.crossAccountFlags?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Early Cancellations</p>
                  <p className="font-medium">{selectedAccount.early_cancellations}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discount Reversals</p>
                  <p className="font-medium">{selectedAccount.discount_reversals}</p>
                </div>
              </div>

              {selectedAccount.restriction_reason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Restriction Reason</p>
                  <p className="text-sm">{selectedAccount.restriction_reason}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={restrictionNotes}
                  onChange={(e) => setRestrictionNotes(e.target.value)}
                  placeholder="Add notes about this account..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestrictDialogOpen(false)}>
              Cancel
            </Button>
            {selectedAccount?.is_promotional_restricted ? (
              <Button
                onClick={() => handleRestrict(false)}
                disabled={actionLoading}
              >
                {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Remove Restriction
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => handleRestrict(true)}
                disabled={actionLoading}
              >
                {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
                Restrict Account
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbuseDetection;
