import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Eye, Package, Truck, CheckCircle, Clock, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ShippingTrackingForm } from './ShippingTrackingForm';
import { shippingStatusOptions, getCarrierName } from '@/lib/carriers';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  user_id: string;
  carrier: string | null;
  carrier_code: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery_date: string | null;
  shipped_at: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-500/20 text-yellow-600' },
  { value: 'processing', label: 'Processing', icon: RefreshCw, color: 'bg-blue-500/20 text-blue-600' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-500/20 text-purple-600' },
  { value: 'in_transit', label: 'In Transit', icon: Truck, color: 'bg-indigo-500/20 text-indigo-600' },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-cyan-500/20 text-cyan-600' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-500/20 text-green-600' },
  { value: 'failed', label: 'Failed', icon: XCircle, color: 'bg-red-500/20 text-red-600' },
  { value: 'returned', label: 'Returned', icon: RefreshCw, color: 'bg-orange-500/20 text-orange-600' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500/20 text-red-600' },
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
  const [savingTracking, setSavingTracking] = useState(false);

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
      setOrders((data || []) as Order[]);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.tracking_number?.toLowerCase().includes(query) ||
        order.carrier?.toLowerCase().includes(query)
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
      const updateData: Partial<Order> = { status: newStatus };
      
      // Auto-set shipped_at when marking as shipped
      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order status updated');
      fetchOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus, ...updateData } : null);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveTracking = async (orderId: string, data: Partial<Order>) => {
    setSavingTracking(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update(data)
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Tracking information saved');
      fetchOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, ...data } : null);
      }
    } catch (error) {
      toast.error('Failed to save tracking info');
    } finally {
      setSavingTracking(false);
    }
  };

  const handleMarkAsShipped = async (orderId: string, trackingData: Partial<Order>) => {
    setSavingTracking(true);
    try {
      const updateData = {
        ...trackingData,
        status: 'shipped',
        shipped_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Order marked as shipped');
      fetchOrders();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, ...updateData } : null);
      }
    } catch (error) {
      toast.error('Failed to mark as shipped');
    } finally {
      setSavingTracking(false);
    }
  };

  const handleSendShippingEmail = async (order: Order) => {
    try {
      // Call edge function to send shipping email
      const { error } = await supabase.functions.invoke('send-subscription-email', {
        body: {
          type: 'shipping_confirmation',
          orderId: order.id,
          trackingNumber: order.tracking_number,
          trackingUrl: order.tracking_url,
          carrier: order.carrier,
        }
      });

      if (error) throw error;
      toast.success('Shipping confirmation email sent');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send shipping email');
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

  const getTrackingIndicator = (order: Order) => {
    if (order.tracking_number) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {order.tracking_number.slice(0, 12)}...
          </Badge>
          {order.tracking_url && (
            <a href={order.tracking_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
            </a>
          )}
        </div>
      );
    }
    return <span className="text-muted-foreground text-sm">—</span>;
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => ['shipped', 'in_transit', 'out_for_delivery'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    needsTracking: orders.filter(o => ['processing', 'pending'].includes(o.status) && !o.tracking_number).length,
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
      <div className="grid gap-4 md:grid-cols-6">
        <Card className="bg-gradient-to-br from-muted to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{orderStats.processing}</div>
            <p className="text-xs text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">{orderStats.shipped}</div>
            <p className="text-xs text-muted-foreground">In Transit</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-card">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-card border-orange-500/30">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{orderStats.needsTracking}</div>
            <p className="text-xs text-muted-foreground">Needs Tracking</p>
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
                placeholder="Search by order #, tracking #, or carrier..."
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
                <TableHead>Carrier</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-sm">
                    {order.carrier ? getCarrierName(order.carrier) : '—'}
                  </TableCell>
                  <TableCell>{getTrackingIndicator(order)}</TableCell>
                  <TableCell>${parseFloat(order.total.toString()).toFixed(2)}</TableCell>
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="shipping">Shipping & Tracking</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-4">
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
                  {selectedOrder.shipped_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Shipped At</p>
                      <p className="font-medium">{format(new Date(selectedOrder.shipped_at), 'PPP p')}</p>
                    </div>
                  )}
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
              </TabsContent>

              <TabsContent value="shipping" className="mt-4">
                <ShippingTrackingForm
                  initialData={{
                    carrier: selectedOrder.carrier,
                    carrier_code: selectedOrder.carrier_code,
                    tracking_number: selectedOrder.tracking_number,
                    tracking_url: selectedOrder.tracking_url,
                    shipped_at: selectedOrder.shipped_at,
                    estimated_delivery_date: selectedOrder.estimated_delivery_date,
                    status: selectedOrder.status,
                  }}
                  onSave={(data) => handleSaveTracking(selectedOrder.id, data)}
                  onMarkAsShipped={() => handleMarkAsShipped(selectedOrder.id, {
                    carrier: selectedOrder.carrier,
                    tracking_number: selectedOrder.tracking_number,
                    tracking_url: selectedOrder.tracking_url,
                  })}
                  onSendShippingEmail={() => handleSendShippingEmail(selectedOrder)}
                  loading={savingTracking}
                />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};