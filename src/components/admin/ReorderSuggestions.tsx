import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, AlertTriangle, TrendingUp, RefreshCw, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ProductWithSuggestion {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  reorder_point: number | null;
  current_velocity: number;
  suggested_reorder_point: number;
  days_until_stockout: number;
  suggested_order_qty: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export const ReorderSuggestions = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<ProductWithSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    calculateSuggestions();
  }, []);

  const calculateSuggestions = async () => {
    setLoading(true);
    try {
      // Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, reorder_point, avg_daily_sales')
        .eq('in_stock', true);

      if (productsError) throw productsError;

      // Calculate velocity from order history for each product
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Aggregate sales by product
      const salesByProduct: Record<string, number> = {};
      (orderItems || []).forEach(item => {
        if (item.product_id) {
          salesByProduct[item.product_id] = (salesByProduct[item.product_id] || 0) + item.quantity;
        }
      });

      // Calculate suggestions for each product
      const productSuggestions: ProductWithSuggestion[] = (products || []).map(product => {
        const totalSold = salesByProduct[product.id] || 0;
        const dailyVelocity = totalSold / 30;
        
        // Lead time assumption: 7 days
        const leadTime = 7;
        // Safety stock: 3 days worth
        const safetyDays = 3;
        
        // Suggested reorder point = (daily velocity × lead time) + safety stock
        const suggestedReorderPoint = Math.ceil(dailyVelocity * (leadTime + safetyDays));
        
        // Days until stockout
        const daysUntilStockout = dailyVelocity > 0 
          ? Math.floor(product.stock_quantity / dailyVelocity)
          : 999;
        
        // Suggested order quantity = 30 days of stock
        const suggestedOrderQty = Math.ceil(dailyVelocity * 30);
        
        // Determine urgency
        let urgency: ProductWithSuggestion['urgency'];
        if (product.stock_quantity <= 0 || daysUntilStockout <= 3) {
          urgency = 'critical';
        } else if (daysUntilStockout <= 7) {
          urgency = 'high';
        } else if (daysUntilStockout <= 14) {
          urgency = 'medium';
        } else {
          urgency = 'low';
        }

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock_quantity: product.stock_quantity,
          reorder_point: product.reorder_point,
          current_velocity: dailyVelocity,
          suggested_reorder_point: suggestedReorderPoint,
          days_until_stockout: daysUntilStockout,
          suggested_order_qty: suggestedOrderQty,
          urgency,
        };
      });

      // Sort by urgency and days until stockout
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      productSuggestions.sort((a, b) => {
        const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        return a.days_until_stockout - b.days_until_stockout;
      });

      // Only show products that need attention (not low urgency unless reorder point needs update)
      const filtered = productSuggestions.filter(p => 
        p.urgency !== 'low' || 
        (p.reorder_point !== null && Math.abs(p.reorder_point - p.suggested_reorder_point) > 5)
      );

      setSuggestions(filtered.slice(0, 10)); // Top 10
    } catch (error) {
      console.error('Error calculating suggestions:', error);
      toast.error('Failed to calculate reorder suggestions');
    } finally {
      setLoading(false);
    }
  };

  const applyReorderPoint = async (product: ProductWithSuggestion) => {
    setUpdating(product.id);
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          reorder_point: product.suggested_reorder_point,
          avg_daily_sales: product.current_velocity,
        })
        .eq('id', product.id);

      if (error) throw error;

      toast.success(`Reorder point updated for ${product.name}`);
      
      // Update local state
      setSuggestions(prev => prev.map(p => 
        p.id === product.id 
          ? { ...p, reorder_point: product.suggested_reorder_point }
          : p
      ));
    } catch (error) {
      toast.error('Failed to update reorder point');
    } finally {
      setUpdating(null);
    }
  };

  const getUrgencyBadge = (urgency: ProductWithSuggestion['urgency']) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-amber-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Reorder Suggestions
            </CardTitle>
            <CardDescription>AI-calculated reorder points based on sales velocity</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={calculateSuggestions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalculate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">All products have healthy stock levels!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Velocity</TableHead>
                  <TableHead className="text-right">Days Left</TableHead>
                  <TableHead className="text-right">Current ROP</TableHead>
                  <TableHead className="text-right">Suggested ROP</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.sku && (
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getUrgencyBadge(product.urgency)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {product.stock_quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.current_velocity.toFixed(1)}/day
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={product.days_until_stockout <= 7 ? 'text-destructive font-bold' : ''}>
                        {product.days_until_stockout > 100 ? '100+' : product.days_until_stockout}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {product.reorder_point ?? '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-primary">
                      {product.suggested_reorder_point}
                    </TableCell>
                    <TableCell>
                      {product.reorder_point !== product.suggested_reorder_point && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => applyReorderPoint(product)}
                          disabled={updating === product.id}
                        >
                          {updating === product.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => navigate('/commandcenter/inventory')}>
            Go to Inventory <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReorderSuggestions;
