import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Package,
  AlertTriangle,
  Crown,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  todayRevenue: number;
  weekRevenue: number;
  lastWeekRevenue: number;
  activeSubscriptions: number;
  todayOrders: number;
  lowStockProducts: { name: string; stock_quantity: number }[];
  topProducts: { name: string; total_sold: number; revenue: number }[];
  vipCustomers: { id: string; name: string; email: string; lifetime_value: number }[];
  vipCustomerCount: number;
  newCustomers: number;
  pendingOrders: number;
}

const EnhancedDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    weekRevenue: 0,
    lastWeekRevenue: 0,
    activeSubscriptions: 0,
    todayOrders: 0,
    lowStockProducts: [],
    topProducts: [],
    vipCustomers: [],
    vipCustomerCount: 0,
    newCustomers: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const lastWeekStart = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Today's orders and revenue
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', todayStart);

      // This week's revenue
      const { data: weekOrders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', weekStart);

      // Last week's revenue (for comparison)
      const { data: lastWeekOrders } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', lastWeekStart)
        .lt('created_at', weekStart);

      // Active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Low stock products
      const { data: lowStock } = await supabase
        .from('products')
        .select('name, stock_quantity, low_stock_threshold')
        .eq('in_stock', true)
        .order('stock_quantity');

      const lowStockProducts = (lowStock || [])
        .filter(p => p.stock_quantity <= p.low_stock_threshold)
        .slice(0, 5);

      // Top products (from order_items)
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity, total_price')
        .gte('created_at', monthStart);

      const productStats: Record<string, { total_sold: number; revenue: number }> = {};
      (orderItems || []).forEach(item => {
        if (!productStats[item.product_name]) {
          productStats[item.product_name] = { total_sold: 0, revenue: 0 };
        }
        productStats[item.product_name].total_sold += item.quantity;
        productStats[item.product_name].revenue += item.total_price;
      });

      const topProducts = Object.entries(productStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // VIP customers - fetch full details
      const { data: vipCustomerData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, lifetime_value')
        .eq('is_vip', true)
        .order('lifetime_value', { ascending: false })
        .limit(5);

      const vipCustomers = (vipCustomerData || []).map(c => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
        email: c.email,
        lifetime_value: c.lifetime_value || 0,
      }));

      const { count: vipCustomerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_vip', true);

      // New customers this month
      const { count: newCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      // Pending orders
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'processing']);

      setStats({
        todayRevenue: (todayOrders || []).reduce((sum, o) => sum + (o.total || 0), 0),
        weekRevenue: (weekOrders || []).reduce((sum, o) => sum + (o.total || 0), 0),
        lastWeekRevenue: (lastWeekOrders || []).reduce((sum, o) => sum + (o.total || 0), 0),
        activeSubscriptions: activeSubscriptions || 0,
        todayOrders: (todayOrders || []).length,
        lowStockProducts,
        topProducts,
        vipCustomers,
        vipCustomerCount: vipCustomerCount || 0,
        newCustomers: newCustomers || 0,
        pendingOrders: pendingOrders || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const weekChange = stats.lastWeekRevenue > 0
    ? ((stats.weekRevenue - stats.lastWeekRevenue) / stats.lastWeekRevenue * 100).toFixed(1)
    : '0';
  const isPositiveChange = Number(weekChange) >= 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mission Control</h1>
        <p className="text-muted-foreground mt-1">Your business at a glance</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayOrders} orders today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 7 Days</CardTitle>
            {isPositiveChange ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.weekRevenue.toFixed(2)}</div>
            <p className={`text-xs ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveChange ? '+' : ''}{weekChange}% vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">Recurring revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vipCustomerCount}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => navigate('/admin/customers')}
            >
              View VIPs <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => navigate('/admin/orders')}
            >
              View orders <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCustomers}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className={stats.lowStockProducts.length > 0 ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.lowStockProducts.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockProducts.length}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => navigate('/admin/inventory')}
            >
              View inventory <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Products */}
        {stats.lowStockProducts.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>Products that need restocking soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.lowStockProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{product.name}</span>
                    <Badge variant="destructive">
                      {product.stock_quantity} left
                    </Badge>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/admin/inventory')}
              >
                Manage Inventory
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Products
            </CardTitle>
            <CardDescription>Best sellers this month by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sales data yet
                </p>
              ) : (
                stats.topProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.total_sold} sold
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-primary">
                      ${product.revenue.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* VIP Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Top VIP Customers
            </CardTitle>
            <CardDescription>Highest lifetime value customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.vipCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No VIP customers yet
                </p>
              ) : (
                stats.vipCustomers.map((customer, i) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <Crown className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      ${customer.lifetime_value.toFixed(2)} LTV
                    </Badge>
                  </div>
                ))
              )}
            </div>
            {stats.vipCustomerCount > 5 && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/admin/customers')}
              >
                View All {stats.vipCustomerCount} VIP Customers
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
