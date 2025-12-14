import { useState, useEffect } from 'react';
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
  XCircle, CheckCircle, TrendingUp, Users, DollarSign 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
}

const ABUSE_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  AUTO_RESTRICT: 100,
};

const AbuseDetection = () => {
  const [restrictions, setRestrictions] = useState<AccountRestriction[]>([]);
  const [couponLogs, setCouponLogs] = useState<CouponAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AbuseStats>({ totalRestricted: 0, highRiskAccounts: 0, totalReversals: 0, totalRejections: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<AccountRestriction | null>(null);
  const [restrictDialogOpen, setRestrictDialogOpen] = useState(false);
  const [restrictionNotes, setRestrictionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch account restrictions with profile info
      const { data: restrictionsData, error: restrictionsError } = await supabase
        .from('account_restrictions')
        .select('*')
        .order('abuse_score', { ascending: false });

      if (restrictionsError) throw restrictionsError;

      // Fetch profile emails for each restriction
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

      const enrichedRestrictions = restrictionsData?.map(r => ({
        ...r,
        profile: profilesMap[r.user_id],
      })) || [];

      setRestrictions(enrichedRestrictions);

      // Calculate stats
      const restricted = enrichedRestrictions.filter(r => r.is_promotional_restricted).length;
      const highRisk = enrichedRestrictions.filter(r => r.abuse_score >= ABUSE_THRESHOLDS.HIGH).length;
      const totalReversals = enrichedRestrictions.reduce((sum, r) => sum + r.discount_reversals, 0);
      const totalRejections = enrichedRestrictions.reduce((sum, r) => sum + r.coupon_rejections, 0);

      setStats({
        totalRestricted: restricted,
        highRiskAccounts: highRisk,
        totalReversals,
        totalRejections,
      });

      // Fetch recent coupon audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('coupon_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Enrich logs with profile emails
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

  const handleCreateRestrictionRecord = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('account_restrictions')
        .upsert({
          user_id: userId,
          abuse_score: 0,
          early_cancellations: 0,
          discount_reversals: 0,
          coupon_rejections: 0,
          pause_cycles: 0,
        }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Account tracking record created');
      fetchData();
    } catch (error) {
      console.error('Error creating restriction record:', error);
      toast.error('Failed to create tracking record');
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
      (riskFilter === 'restricted' && r.is_promotional_restricted);
    
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Abuse Detection & Prevention
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor suspicious account activity and manage promotional restrictions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <TabsTrigger value="coupon-logs">Coupon Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {/* Filters */}
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
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Accounts Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Early Cancellations</TableHead>
                    <TableHead>Reversals</TableHead>
                    <TableHead>Rejections</TableHead>
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
                        <TableCell>{restriction.early_cancellations}</TableCell>
                        <TableCell>{restriction.discount_reversals}</TableCell>
                        <TableCell>{restriction.coupon_rejections}</TableCell>
                        <TableCell>
                          {restriction.is_promotional_restricted ? (
                            <Badge variant="destructive">Restricted</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAccount(restriction);
                              setRestrictionNotes(restriction.notes || '');
                              setRestrictDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupon-logs" className="space-y-4">
          {/* Coupon Logs Table */}
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

      {/* Manage Restriction Dialog */}
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
                  <p className="text-sm text-muted-foreground">Status</p>
                  {selectedAccount.is_promotional_restricted ? (
                    <Badge variant="destructive">Restricted</Badge>
                  ) : (
                    <Badge variant="outline">Active</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Early Cancellations</p>
                  <p className="font-medium">{selectedAccount.early_cancellations}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Discount Reversals</p>
                  <p className="font-medium">{selectedAccount.discount_reversals}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coupon Rejections</p>
                  <p className="font-medium">{selectedAccount.coupon_rejections}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pause Cycles</p>
                  <p className="font-medium">{selectedAccount.pause_cycles}</p>
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
