import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Eye, Package, Truck, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  user_id: string;
  carrier: string | null;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'processing', label: 'Processing', icon: RefreshCw, color: 'bg-blue-500/20 text-blue-500' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-500/20 text-purple-500' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-500/20 text-green-500' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500/20 text-red-500' },
];

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);

    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (!error) {
      setOrderItems(data || []);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated');
      fetchOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateTracking = async (orderId: string, carrier: string, trackingNumber: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ carrier, tracking_number: trackingNumber })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Tracking info updated');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update tracking');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find(s => s.value === status);
    if (!statusConfig) return <Badge>{status}</Badge>;
    
    const Icon = statusConfig.icon;
    return (
      <Badge className={`${statusConfig.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-muted to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{orderStats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{orderStats.processing}</div>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-500">{orderStats.shipped}</div>
            <p className="text-xs text-muted-foreground">Shipped</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{orderStats.delivered}</div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order # or tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>${parseFloat(order.total.toString()).toFixed(2)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {order.tracking_number || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleUpdateStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{format(new Date(selectedOrder.created_at), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium text-lg">${parseFloat(selectedOrder.total.toString()).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carrier</p>
                  <p className="font-medium">{selectedOrder.carrier || '—'}</p>
                </div>
              </div>

              {/* Tracking Update */}
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Update Tracking</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleUpdateTracking(
                      selectedOrder.id,
                      formData.get('carrier') as string,
                      formData.get('tracking') as string
                    );
                  }}
                  className="flex gap-2"
                >
                  <Input
                    name="carrier"
                    placeholder="Carrier (e.g., UPS)"
                    defaultValue={selectedOrder.carrier || ''}
                    className="flex-1"
                  />
                  <Input
                    name="tracking"
                    placeholder="Tracking number"
                    defaultValue={selectedOrder.tracking_number || ''}
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    <Truck className="h-4 w-4 mr-1" />
                    Update
                  </Button>
                </form>
              </div>

              {/* Order Items */}
              <div>
                <p className="text-sm font-medium mb-2">Order Items</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${parseFloat(item.unit_price.toString()).toFixed(2)}</TableCell>
                        <TableCell>${parseFloat(item.total_price.toString()).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
