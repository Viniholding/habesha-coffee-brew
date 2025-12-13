import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Search, Filter, Eye, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_email?: string;
}

const ACTION_TYPES = [
  'admin_user_created',
  'admin_role_updated',
  'admin_activated',
  'admin_deactivated',
  'product_updated',
  'order_updated',
  'subscription_updated',
  'promotion_created',
  'promotion_updated',
  'settings_updated',
];

export default function AdminAuditLog() {
  const { isOwner, isManager, isLoading: roleLoading } = useAdminRole();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [adminEmails, setAdminEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (actionFilter !== 'all') {
        query = query.eq('action_type', actionFilter);
      }

      // Date filter
      const now = new Date();
      let startDate: Date;
      switch (dateFilter) {
        case '24hours':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      query = query.gte('created_at', startDate.toISOString());

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);

      // Fetch admin emails
      const adminIds = [...new Set((data || []).map(log => log.admin_user_id))];
      const emailMap: Record<string, string> = {};
      
      for (const id of adminIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', id)
          .single();
        
        if (profile) {
          emailMap[id] = profile.email;
        }
      }
      
      setAdminEmails(emailMap);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action_type.toLowerCase().includes(search) ||
      log.entity_type?.toLowerCase().includes(search) ||
      log.entity_id?.toLowerCase().includes(search) ||
      adminEmails[log.admin_user_id]?.toLowerCase().includes(search)
    );
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('created')) return 'default';
    if (action.includes('updated')) return 'secondary';
    if (action.includes('deleted') || action.includes('deactivated')) return 'destructive';
    return 'outline';
  };

  const formatActionType = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isOwner && !isManager) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground text-center">
            Only owners and managers can view audit logs.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Audit Log
        </h1>
        <p className="text-muted-foreground">View all admin actions and system changes</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search actions, users, entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_TYPES.map(action => (
                  <SelectItem key={action} value={action}>
                    {formatActionType(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 hours</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {filteredLogs.length} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{adminEmails[log.admin_user_id] || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action_type)}>
                        {formatActionType(log.action_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.entity_type && (
                        <span className="text-sm text-muted-foreground">
                          {log.entity_type}
                          {log.entity_id && (
                            <span className="ml-1 font-mono text-xs">
                              #{log.entity_id.slice(0, 8)}
                            </span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Timestamp:</span>
                                <p>{format(new Date(log.created_at), 'PPpp')}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Admin:</span>
                                <p>{adminEmails[log.admin_user_id] || log.admin_user_id}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Action:</span>
                                <p>{formatActionType(log.action_type)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">IP Address:</span>
                                <p>{log.ip_address || 'N/A'}</p>
                              </div>
                            </div>
                            
                            {log.old_values && (
                              <div>
                                <span className="text-sm text-muted-foreground">Previous Values:</span>
                                <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            {log.new_values && (
                              <div>
                                <span className="text-sm text-muted-foreground">New Values:</span>
                                <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-auto">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
