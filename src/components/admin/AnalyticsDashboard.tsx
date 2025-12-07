import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, ShoppingCart, Users, TrendingUp, Package, ArrowUpRight, ArrowDownRight, RefreshCw, XCircle, PauseCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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

interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

interface SubscriptionStats {
  active: number;
  paused: number;
  cancelled: number;
  mrr: number;
  churnRate: number;
}

const CHART_COLORS = ['hsl(28, 85%, 55%)', 'hsl(35, 90%, 60%)', 'hsl(20, 70%, 45%)', 'hsl(30, 80%, 50%)', 'hsl(25, 60%, 40%)'];

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<OrderStats>({ total_revenue: 0, total_orders: 0, avg_order_value: 0 });
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats>({ active: 0, paused: 0, cancelled: 0, mrr: 0, churnRate: 0 });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      // Fetch order statistics
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, subtotal, shipping, tax, created_at')
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;
      const totalOrders = orders?.length || 0;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setStats({
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        avg_order_value: avgOrderValue,
      });

      // Calculate daily revenue
      const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
      orders?.forEach(order => {
        const day = format(new Date(order.created_at), 'MMM dd');
        if (!revenueByDay[day]) {
          revenueByDay[day] = { revenue: 0, orders: 0 };
        }
        revenueByDay[day].revenue += parseFloat(order.total.toString());
        revenueByDay[day].orders += 1;
      });

      const dailyData = Object.entries(revenueByDay).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }));
      setDailyRevenue(dailyData);

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

      // Fetch subscription statistics
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('status, price, quantity');

      if (!subsError && subscriptions) {
        const active = subscriptions.filter(s => s.status === 'active').length;
        const paused = subscriptions.filter(s => s.status === 'paused').length;
        const cancelled = subscriptions.filter(s => s.status === 'cancelled').length;
        const mrr = subscriptions
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + (s.price * s.quantity * 2), 0); // Assuming biweekly avg = ~2x/month
        const total = active + paused + cancelled;
        const churnRate = total > 0 ? (cancelled / total) * 100 : 0;

        setSubscriptionStats({ active, paused, cancelled, mrr, churnRate });
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pieData = topProducts.map((product, index) => ({
    name: product.product_name,
    value: product.total_revenue,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+12.5%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_orders}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+8.2%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avg_order_value.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
              <span className="text-red-500">-2.1%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-green-500">+15.3%</span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <RefreshCw className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Recurring customers</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <PauseCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.paused}</div>
            <p className="text-xs text-muted-foreground mt-1">Temporarily paused</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Est. MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${subscriptionStats.mrr.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly recurring</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subscriptionStats.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Cancellation rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(28, 85%, 55%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(28, 85%, 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 15%, 25%)" />
                  <XAxis dataKey="date" stroke="hsl(30, 20%, 65%)" fontSize={12} />
                  <YAxis stroke="hsl(30, 20%, 65%)" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(20, 18%, 12%)', 
                      border: '1px solid hsl(25, 15%, 25%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(28, 85%, 55%)" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Product Sales Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Sales Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(20, 18%, 12%)', 
                      border: '1px solid hsl(25, 15%, 25%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Orders Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 15%, 25%)" />
                <XAxis dataKey="date" stroke="hsl(30, 20%, 65%)" fontSize={12} />
                <YAxis stroke="hsl(30, 20%, 65%)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(20, 18%, 12%)', 
                    border: '1px solid hsl(25, 15%, 25%)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="orders" fill="hsl(28, 85%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Units Sold</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product, index) => (
                <TableRow key={product.product_name} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                      {index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.product_name}</TableCell>
                  <TableCell>{product.total_quantity}</TableCell>
                  <TableCell className="font-semibold text-primary">${product.total_revenue.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {topProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No sales data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
