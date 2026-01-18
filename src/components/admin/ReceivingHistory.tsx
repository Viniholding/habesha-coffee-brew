import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Package, Search, History, RefreshCw, Download } from 'lucide-react';

interface ReceivingLogEntry {
  id: string;
  purchase_order_id: string;
  purchase_order_item_id: string;
  product_id: string | null;
  product_name: string;
  quantity_received: number;
  received_by: string;
  received_at: string;
  notes: string | null;
  created_at: string;
}

interface ReceivingLogWithRelations extends ReceivingLogEntry {
  purchase_orders?: {
    order_number: string;
    suppliers?: {
      name: string;
    };
  };
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export default function ReceivingHistory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['receiving-history', dateFilter],
    queryFn: async () => {
      // Fetch receiving logs with purchase order info
      const { data: logsData, error } = await supabase
        .from('purchase_order_receiving_log')
        .select(`
          *,
          purchase_orders(order_number, suppliers(name))
        `)
        .order('received_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Failed to fetch receiving logs:', error);
        return [];
      }

      // Fetch profile info for receivers
      const receiverIds = [...new Set((logsData || []).map(log => log.received_by))];
      let profilesMap: Record<string, { first_name: string | null; last_name: string | null; email: string }> = {};
      
      if (receiverIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', receiverIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { first_name: p.first_name, last_name: p.last_name, email: p.email };
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      // Combine data
      return (logsData || []).map(log => ({
        ...log,
        profiles: profilesMap[log.received_by] || null,
      })) as ReceivingLogWithRelations[];
    },
  });

  const getDateFilteredLogs = () => {
    const now = new Date();
    return logs.filter(log => {
      const logDate = new Date(log.received_at);
      
      switch (dateFilter) {
        case 'today':
          return logDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return logDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return logDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  const filteredLogs = getDateFilteredLogs().filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.product_name.toLowerCase().includes(query) ||
      log.purchase_orders?.order_number?.toLowerCase().includes(query) ||
      log.purchase_orders?.suppliers?.name?.toLowerCase().includes(query) ||
      log.profiles?.email?.toLowerCase().includes(query)
    );
  });

  const getReceiverName = (log: ReceivingLogWithRelations) => {
    if (log.profiles) {
      if (log.profiles.first_name || log.profiles.last_name) {
        return `${log.profiles.first_name || ''} ${log.profiles.last_name || ''}`.trim();
      }
      return log.profiles.email;
    }
    return 'Unknown';
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Date', 'Time', 'PO Number', 'Supplier', 'Product', 'Qty Received', 'Received By', 'Notes'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.received_at), 'yyyy-MM-dd'),
      format(new Date(log.received_at), 'HH:mm:ss'),
      log.purchase_orders?.order_number || '',
      log.purchase_orders?.suppliers?.name || '',
      log.product_name,
      log.quantity_received,
      getReceiverName(log),
      log.notes || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `receiving-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Group logs by date for summary
  const logsByDate = filteredLogs.reduce((acc, log) => {
    const date = format(new Date(log.received_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { count: 0, totalQty: 0 };
    }
    acc[date].count++;
    acc[date].totalQty += log.quantity_received;
    return acc;
  }, {} as Record<string, { count: number; totalQty: number }>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Receiving History
          </h2>
          <p className="text-muted-foreground">Audit log of all items received from purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{filteredLogs.length}</div>
            <p className="text-sm text-muted-foreground">Total Receiving Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              +{filteredLogs.reduce((sum, log) => sum + log.quantity_received, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Units Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{Object.keys(logsByDate).length}</div>
            <p className="text-sm text-muted-foreground">Days with Activity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, order, supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No receiving records found</p>
              <p className="text-sm mt-1">Records will appear here when items are received from purchase orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty Received</TableHead>
                    <TableHead>Received By</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {format(new Date(log.received_at), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.received_at), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.purchase_orders?.order_number || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.purchase_orders?.suppliers?.name || '-'}</TableCell>
                      <TableCell className="font-medium">{log.product_name}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-green-500 text-white">
                          +{log.quantity_received}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{getReceiverName(log)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {log.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
