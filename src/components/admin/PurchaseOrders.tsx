import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Send, Package, CheckCircle, Clock, Search, Eye, FileText, PackageCheck } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { format } from 'date-fns';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
}

interface Product {
  id: string;
  name: string;
  cost_price: number | null;
  stock_quantity: number;
  reorder_point: number | null;
}

interface PurchaseOrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  received_quantity: number;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string | null;
  status: string;
  notes: string | null;
  expected_delivery_date: string | null;
  total_amount: number;
  created_at: string;
  submitted_at: string | null;
  received_at: string | null;
  suppliers?: Supplier;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-500' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-yellow-500' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-500' },
  { value: 'partially_received', label: 'Partial', color: 'bg-orange-500' },
  { value: 'received', label: 'Received', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([]);
  const [receiveItems, setReceiveItems] = useState<Array<{ id: string; quantity: number; maxQty: number }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const { isReadOnly } = useAdminRole();

  // Form state
  const [formSupplierId, setFormSupplierId] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');
  const [formExpectedDate, setFormExpectedDate] = useState('');
  const [formItems, setFormItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [ordersResult, suppliersResult, productsResult] = await Promise.all([
      supabase
        .from('purchase_orders')
        .select('*, suppliers(id, name, email)')
        .order('created_at', { ascending: false }),
      supabase.from('suppliers').select('id, name, email').eq('is_active', true).order('name'),
      supabase.from('products').select('id, name, cost_price, stock_quantity, reorder_point').order('name'),
    ]);

    if (ordersResult.error) {
      toast.error('Failed to fetch purchase orders');
      console.error(ordersResult.error);
    } else {
      setOrders(ordersResult.data || []);
    }

    setSuppliers(suppliersResult.data || []);
    setProducts(productsResult.data || []);
    setLoading(false);
  };

  const fetchOrderItems = async (orderId: string) => {
    const { data, error } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('purchase_order_id', orderId)
      .order('created_at');

    if (error) {
      console.error(error);
      return [];
    }
    return data || [];
  };

  const handleOpenDialog = async (order?: PurchaseOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormSupplierId(order.supplier_id || '');
      setFormNotes(order.notes || '');
      setFormExpectedDate(order.expected_delivery_date || '');
      const items = await fetchOrderItems(order.id);
      setFormItems(items.map(item => ({
        productId: item.product_id || '',
        quantity: item.quantity,
        unitCost: item.unit_cost,
      })));
    } else {
      setEditingOrder(null);
      setFormSupplierId('');
      setFormNotes('');
      setFormExpectedDate('');
      setFormItems([{ productId: '', quantity: 1, unitCost: 0 }]);
    }
    setDialogOpen(true);
  };

  const handleViewDetails = async (order: PurchaseOrder) => {
    setSelectedOrder(order);
    const items = await fetchOrderItems(order.id);
    setOrderItems(items);
    setDetailDialogOpen(true);
  };

  const handleOpenReceiveDialog = async (order: PurchaseOrder) => {
    setSelectedOrder(order);
    const items = await fetchOrderItems(order.id);
    setOrderItems(items);
    setReceiveItems(items.map(item => ({
      id: item.id,
      quantity: 0,
      maxQty: item.quantity - (item.received_quantity || 0),
    })));
    setReceiveDialogOpen(true);
  };

  const handleReceiveItems = async () => {
    if (!selectedOrder) return;
    
    setSaving(true);
    let totalReceived = 0;
    let totalOrdered = 0;

    const { data: userData } = await supabase.auth.getUser();
    const receiverId = userData.user?.id;
    
    const itemsReceivedForNotification: Array<{ productName: string; quantityReceived: number }> = [];

    for (const receiveItem of receiveItems) {
      if (receiveItem.quantity > 0) {
        const orderItem = orderItems.find(i => i.id === receiveItem.id);
        if (orderItem) {
          const newReceivedQty = (orderItem.received_quantity || 0) + receiveItem.quantity;
          
          // Update item received quantity
          await supabase
            .from('purchase_order_items')
            .update({ received_quantity: newReceivedQty })
            .eq('id', receiveItem.id);

          // Update product stock
          if (orderItem.product_id) {
            const product = products.find(p => p.id === orderItem.product_id);
            if (product) {
              await supabase
                .from('products')
                .update({ stock_quantity: product.stock_quantity + receiveItem.quantity })
                .eq('id', orderItem.product_id);
            }
          }

          // Log to receiving history
          if (receiverId) {
            await supabase
              .from('purchase_order_receiving_log')
              .insert({
                purchase_order_id: selectedOrder.id,
                purchase_order_item_id: orderItem.id,
                product_id: orderItem.product_id,
                product_name: orderItem.product_name,
                quantity_received: receiveItem.quantity,
                received_by: receiverId,
              });
          }

          itemsReceivedForNotification.push({
            productName: orderItem.product_name,
            quantityReceived: receiveItem.quantity,
          });
        }
      }
    }

    // Check if fully or partially received
    const updatedItems = await fetchOrderItems(selectedOrder.id);
    for (const item of updatedItems) {
      totalReceived += item.received_quantity || 0;
      totalOrdered += item.quantity;
    }

    const isFullyReceived = totalReceived >= totalOrdered;
    const newStatus = isFullyReceived ? 'received' : 'partially_received';

    const updates: Record<string, unknown> = { status: newStatus };
    if (isFullyReceived) {
      updates.received_at = new Date().toISOString();
    }

    await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', selectedOrder.id);

    // Send notification email
    if (itemsReceivedForNotification.length > 0) {
      try {
        await supabase.functions.invoke('send-po-notification', {
          body: {
            type: 'items_received',
            purchaseOrderId: selectedOrder.id,
            itemsReceived: itemsReceivedForNotification,
          },
        });
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }

    toast.success(isFullyReceived ? 'Order fully received!' : 'Items received, order partially fulfilled');
    setReceiveDialogOpen(false);
    fetchData();
    setSaving(false);
  };

  const getReceiveProgress = (items: PurchaseOrderItem[]) => {
    const totalOrdered = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalReceived = items.reduce((sum, i) => sum + (i.received_quantity || 0), 0);
    return totalOrdered > 0 ? (totalReceived / totalOrdered) * 100 : 0;
  };

  const addItemRow = () => {
    setFormItems([...formItems, { productId: '', quantity: 1, unitCost: 0 }]);
  };

  const removeItemRow = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, field: string, value: string | number) => {
    const updated = [...formItems];
    if (field === 'productId') {
      updated[index].productId = value as string;
      const product = products.find(p => p.id === value);
      if (product?.cost_price) {
        updated[index].unitCost = product.cost_price;
      }
    } else if (field === 'quantity') {
      updated[index].quantity = parseInt(value as string) || 1;
    } else if (field === 'unitCost') {
      updated[index].unitCost = parseFloat(value as string) || 0;
    }
    setFormItems(updated);
  };

  const calculateTotal = () => {
    return formItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  };

  const handleSave = async () => {
    if (!formSupplierId) {
      toast.error('Please select a supplier');
      return;
    }
    if (formItems.length === 0 || !formItems.some(i => i.productId)) {
      toast.error('Please add at least one product');
      return;
    }

    setSaving(true);
    const totalAmount = calculateTotal();

    if (editingOrder) {
      // Update existing order
      const { error: orderError } = await supabase
        .from('purchase_orders')
        .update({
          supplier_id: formSupplierId,
          notes: formNotes || null,
          expected_delivery_date: formExpectedDate || null,
          total_amount: totalAmount,
        })
        .eq('id', editingOrder.id);

      if (orderError) {
        toast.error('Failed to update order');
        console.error(orderError);
        setSaving(false);
        return;
      }

      // Delete old items and insert new
      await supabase.from('purchase_order_items').delete().eq('purchase_order_id', editingOrder.id);
      
      const itemsToInsert = formItems
        .filter(item => item.productId)
        .map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            purchase_order_id: editingOrder.id,
            product_id: item.productId,
            product_name: product?.name || 'Unknown Product',
            quantity: item.quantity,
            unit_cost: item.unitCost,
            total_cost: item.quantity * item.unitCost,
          };
        });

      if (itemsToInsert.length > 0) {
        await supabase.from('purchase_order_items').insert(itemsToInsert);
      }

      toast.success('Purchase order updated');
    } else {
      // Create new order
      const { data: poData, error: poError } = await supabase.rpc('generate_po_number');
      
      if (poError) {
        console.error(poError);
        toast.error('Failed to generate order number');
        setSaving(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const { data: newOrder, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: poData,
          supplier_id: formSupplierId,
          notes: formNotes || null,
          expected_delivery_date: formExpectedDate || null,
          total_amount: totalAmount,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (orderError || !newOrder) {
        toast.error('Failed to create order');
        console.error(orderError);
        setSaving(false);
        return;
      }

      const itemsToInsert = formItems
        .filter(item => item.productId)
        .map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            purchase_order_id: newOrder.id,
            product_id: item.productId,
            product_name: product?.name || 'Unknown Product',
            quantity: item.quantity,
            unit_cost: item.unitCost,
            total_cost: item.quantity * item.unitCost,
          };
        });

      if (itemsToInsert.length > 0) {
        await supabase.from('purchase_order_items').insert(itemsToInsert);
      }

      toast.success('Purchase order created');
    }

    setDialogOpen(false);
    fetchData();
    setSaving(false);
  };

  const handleUpdateStatus = async (order: PurchaseOrder, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === 'submitted' && !order.submitted_at) {
      updates.submitted_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', order.id);

    if (error) {
      toast.error('Failed to update status');
      console.error(error);
    } else {
      toast.success(`Order marked as ${newStatus}`);
      fetchData();
    }
  };

  const handleDelete = async (order: PurchaseOrder) => {
    if (order.status !== 'draft') {
      toast.error('Only draft orders can be deleted');
      return;
    }
    if (!confirm(`Delete order ${order.order_number}?`)) return;

    const { error } = await supabase.from('purchase_orders').delete().eq('id', order.id);

    if (error) {
      toast.error('Failed to delete order');
      console.error(error);
    } else {
      toast.success('Order deleted');
      fetchData();
    }
  };

  const handleSendToSupplier = async (order: PurchaseOrder) => {
    const supplier = suppliers.find(s => s.id === order.supplier_id);
    if (!supplier?.email) {
      toast.error('Supplier has no email address');
      return;
    }

    const items = await fetchOrderItems(order.id);
    const itemsList = items.map(i => `- ${i.product_name}: ${i.quantity} units @ $${i.unit_cost.toFixed(2)}`).join('\n');
    
    const subject = encodeURIComponent(`Purchase Order ${order.order_number}`);
    const body = encodeURIComponent(
      `Dear ${supplier.name},\n\n` +
      `Please find our purchase order below:\n\n` +
      `Order Number: ${order.order_number}\n` +
      `Expected Delivery: ${order.expected_delivery_date || 'TBD'}\n\n` +
      `Items:\n${itemsList}\n\n` +
      `Total: $${order.total_amount.toFixed(2)}\n\n` +
      `${order.notes ? `Notes: ${order.notes}\n\n` : ''}` +
      `Please confirm receipt and expected delivery date.\n\n` +
      `Best regards`
    );
    
    window.open(`mailto:${supplier.email}?subject=${subject}&body=${body}`);
    
    // Update status to submitted
    if (order.status === 'draft') {
      await handleUpdateStatus(order, 'submitted');
    }
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={`${option?.color || 'bg-gray-500'} text-white`}>
        {option?.label || status}
      </Badge>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.suppliers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Purchase Orders</h2>
          <p className="text-muted-foreground">Create and track orders to suppliers</p>
        </div>
        {!isReadOnly && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== 'all' ? 'No orders found matching your filters' : 'No purchase orders yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.suppliers?.name || 'Unknown'}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {order.expected_delivery_date 
                        ? format(new Date(order.expected_delivery_date), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === 'draft' && !isReadOnly && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleOpenDialog(order)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleSendToSupplier(order)}>
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(order)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {order.status === 'submitted' && !isReadOnly && (
                          <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order, 'confirmed')}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {order.status === 'confirmed' && !isReadOnly && (
                          <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(order, 'shipped')}>
                            <Package className="h-4 w-4" />
                          </Button>
                        )}
                        {(order.status === 'shipped' || order.status === 'partially_received') && !isReadOnly && (
                          <Button variant="outline" size="sm" onClick={() => handleOpenReceiveDialog(order)} title="Receive Items">
                            <PackageCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle>
            <DialogDescription>
              {editingOrder ? `Editing ${editingOrder.order_number}` : 'Create a new order to send to a supplier'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Supplier *</Label>
              <Select value={formSupplierId} onValueChange={setFormSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Expected Delivery Date</Label>
              <Input
                type="date"
                value={formExpectedDate}
                onChange={(e) => setFormExpectedDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {formItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Select value={item.productId} onValueChange={(v) => updateItemRow(index, 'productId', v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock_quantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItemRow(index, 'quantity', e.target.value)}
                      className="w-20"
                      placeholder="Qty"
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.unitCost}
                      onChange={(e) => updateItemRow(index, 'unitCost', e.target.value)}
                      className="w-24"
                      placeholder="Cost"
                    />
                    <span className="text-sm w-20 text-right">
                      ${(item.quantity * item.unitCost).toFixed(2)}
                    </span>
                    {formItems.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItemRow(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-right font-semibold">
                Total: ${calculateTotal().toFixed(2)}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Additional notes for the supplier"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingOrder ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Purchase Order Details</DialogTitle>
            <DialogDescription>{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Supplier</Label>
                  <p className="font-medium">{selectedOrder.suppliers?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p>{format(new Date(selectedOrder.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Expected Delivery</Label>
                  <p>{selectedOrder.expected_delivery_date 
                    ? format(new Date(selectedOrder.expected_delivery_date), 'MMM d, yyyy')
                    : '-'}</p>
                </div>
              </div>

              {(selectedOrder.status === 'shipped' || selectedOrder.status === 'partially_received' || selectedOrder.status === 'received') && (
                <div>
                  <Label className="text-muted-foreground">Receiving Progress</Label>
                  <Progress value={getReceiveProgress(orderItems)} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {orderItems.reduce((sum, i) => sum + (i.received_quantity || 0), 0)} of {orderItems.reduce((sum, i) => sum + i.quantity, 0)} items received
                  </p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <span className={item.received_quantity >= item.quantity ? 'text-green-600' : item.received_quantity > 0 ? 'text-orange-500' : ''}>
                            {item.received_quantity || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">${item.unit_cost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.total_cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} className="font-semibold text-right">Total</TableCell>
                      <TableCell className="font-semibold text-right">${selectedOrder.total_amount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receive Items Dialog */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receive Items</DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number} - Enter quantities received for each item
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="mb-4">
                <Label className="text-muted-foreground">Current Progress</Label>
                <Progress value={getReceiveProgress(orderItems)} className="mt-2" />
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Ordered</TableHead>
                    <TableHead className="text-right">Already Received</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Receive Now</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems.map((item, index) => {
                    const remaining = item.quantity - (item.received_quantity || 0);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.received_quantity || 0}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={remaining === 0 ? 'secondary' : 'outline'}>
                            {remaining}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={receiveItems[index]?.quantity || 0}
                            onChange={(e) => {
                              const val = Math.min(parseInt(e.target.value) || 0, remaining);
                              setReceiveItems(prev => prev.map((ri, i) => 
                                i === index ? { ...ri, quantity: val } : ri
                              ));
                            }}
                            className="w-20 ml-auto"
                            disabled={remaining === 0}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setReceiveItems(orderItems.map(item => ({
                      id: item.id,
                      quantity: item.quantity - (item.received_quantity || 0),
                      maxQty: item.quantity - (item.received_quantity || 0),
                    })));
                  }}
                >
                  Receive All Remaining
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleReceiveItems} 
              disabled={saving || !receiveItems.some(i => i.quantity > 0)}
            >
              {saving ? 'Saving...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
