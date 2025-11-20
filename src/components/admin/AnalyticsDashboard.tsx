import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';

interface OrderStats {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
}

interface ProductSales {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<OrderStats>({ total_revenue: 0, total_orders: 0, avg_order_value: 0 });
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch order statistics
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, subtotal, shipping, tax');

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        avg_order_value: avgOrderValue,
      });

      // Fetch top selling products
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_name, quantity, total_price');

      if (itemsError) throw itemsError;

      // Aggregate product sales
      const productSales = orderItems?.reduce((acc: Record<string, ProductSales>, item) => {
        if (!acc[item.product_name]) {
          acc[item.product_name] = {
            product_name: item.product_name,
            total_quantity: 0,
            total_revenue: 0,
          };
        }
        acc[item.product_name].total_quantity += item.quantity;
        acc[item.product_name].total_revenue += parseFloat(item.total_price.toString());
        return acc;
      }, {});

      const sortedProducts = Object.values(productSales || {})
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      setTopProducts(sortedProducts);

      // Fetch customer count
      const { count, error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (profilesError) throw profilesError;
      setCustomerCount(count || 0);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avg_order_value.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Units Sold</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product) => (
                <TableRow key={product.product_name}>
                  <TableCell className="font-medium">{product.product_name}</TableCell>
                  <TableCell>{product.total_quantity}</TableCell>
                  <TableCell>${product.total_revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
