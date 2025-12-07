import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, DollarSign, Clock, Filter, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface AbandonedCart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  email: string | null;
  cart_value: number;
  items: any[];
  last_step: string;
  last_activity_at: string;
  created_at: string;
  recovered_at: string | null;
}

const STEP_LABELS: Record<string, string> = {
  'cart_viewed': 'Viewed Cart',
  'checkout_started': 'Started Checkout',
  'shipping_entered': 'Entered Shipping',
  'payment_entered': 'Entered Payment',
  'completed': 'Completed',
};

const AbandonedCarts = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'abandoned' | 'high_value'>('abandoned');
  const [minValue, setMinValue] = useState('');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    try {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      setCarts((data || []).map(cart => ({
        ...cart,
        items: Array.isArray(cart.items) ? cart.items : [],
      })));
    } catch (error) {
      console.error('Error fetching carts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCarts = carts.filter(cart => {
    if (filter === 'abandoned' && cart.recovered_at) return false;
    if (filter === 'high_value' && cart.cart_value < (parseFloat(minValue) || 100)) return false;
    if (minValue && cart.cart_value < parseFloat(minValue)) return false;
    return true;
  });

  const stats = {
    total: carts.length,
    abandoned: carts.filter(c => !c.recovered_at).length,
    totalValue: carts.filter(c => !c.recovered_at).reduce((sum, c) => sum + c.cart_value, 0),
    avgValue: carts.length > 0 ? carts.reduce((sum, c) => sum + c.cart_value, 0) / carts.length : 0,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Abandoned Carts</h1>
          <p className="text-muted-foreground mt-2">Track and recover abandoned shopping carts</p>
        </div>
        <Button onClick={fetchCarts} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Total Carts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Abandoned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.abandoned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Lost Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${stats.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Avg Cart Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carts</SelectItem>
                  <SelectItem value="abandoned">Abandoned Only</SelectItem>
                  <SelectItem value="high_value">High Value</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Min Value:</span>
              <Input
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                placeholder="$0"
                className="w-[100px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Cart Value</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Last Step</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCarts.map((cart) => (
                <TableRow key={cart.id}>
                  <TableCell>
                    <div>
                      {cart.email || 'Guest'}
                      {cart.session_id && !cart.email && (
                        <div className="text-xs text-muted-foreground">
                          Session: {cart.session_id.substring(0, 12)}...
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${cart.cart_value.toFixed(2)}</TableCell>
                  <TableCell>{(cart.items as any[])?.length || 0} items</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {STEP_LABELS[cart.last_step] || cart.last_step}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(cart.last_activity_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {cart.recovered_at ? (
                      <Badge className="bg-green-500">Recovered</Badge>
                    ) : (
                      <Badge variant="destructive">Abandoned</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCart(cart);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredCarts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No carts found matching your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cart Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cart Details</DialogTitle>
          </DialogHeader>
          
          {selectedCart && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Customer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{selectedCart.email || 'Guest User'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Cart Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">${selectedCart.cart_value.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cart Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedCart.items as any[])?.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.product_name || item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>${(item.price || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(selectedCart.created_at), 'PPpp')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Activity:</span>
                      <span>{format(new Date(selectedCart.last_activity_at), 'PPpp')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Step:</span>
                      <Badge variant="outline">{STEP_LABELS[selectedCart.last_step] || selectedCart.last_step}</Badge>
                    </div>
                    {selectedCart.recovered_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recovered:</span>
                        <span className="text-green-500">{format(new Date(selectedCart.recovered_at), 'PPpp')}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbandonedCarts;
