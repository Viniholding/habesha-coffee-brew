import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Area, ComposedChart } from 'recharts';
import { TrendingDown, Calendar } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  reorder_point: number | null;
  avg_daily_sales: number | null;
}

interface ForecastData {
  date: string;
  projected: number;
  reorderPoint: number;
}

export const StockForecastChart = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatedVelocity, setCalculatedVelocity] = useState<number>(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      calculateForecast(selectedProductId);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, reorder_point, avg_daily_sales')
        .gt('stock_quantity', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      if (data && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateForecast = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Calculate sales velocity from order history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('quantity, created_at')
      .eq('product_id', productId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const totalSold = (orderItems || []).reduce((sum, item) => sum + item.quantity, 0);
    const avgDailySales = totalSold / 30;
    setCalculatedVelocity(avgDailySales);

    // Use calculated velocity or stored avg_daily_sales
    const dailyVelocity = avgDailySales > 0 ? avgDailySales : (product.avg_daily_sales || 0.5);
    const reorderPoint = product.reorder_point || Math.ceil(dailyVelocity * 7); // Default 7 days buffer

    // Generate 30-day forecast
    const forecast: ForecastData[] = [];
    let currentStock = product.stock_quantity;
    const today = new Date();

    for (let i = 0; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        projected: Math.max(0, Math.round(currentStock * 10) / 10),
        reorderPoint,
      });

      currentStock -= dailyVelocity;
    }

    setForecastData(forecast);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const stockoutDay = forecastData.findIndex(d => d.projected <= 0);
  const reorderDay = forecastData.findIndex(d => d.projected <= (selectedProduct?.reorder_point || 0));

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
              <TrendingDown className="h-5 w-5" />
              Stock Forecast
            </CardTitle>
            <CardDescription>30-day projected stock levels</CardDescription>
          </div>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {selectedProduct && (
          <div className="space-y-4">
            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Current Stock</p>
                <p className="text-lg font-bold">{selectedProduct.stock_quantity}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Daily Velocity</p>
                <p className="text-lg font-bold">{calculatedVelocity.toFixed(1)}/day</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Reorder Point</p>
                <p className="text-lg font-bold">{selectedProduct.reorder_point || 'Not set'}</p>
              </div>
              <div className={`rounded-lg p-3 ${stockoutDay > 0 && stockoutDay <= 14 ? 'bg-destructive/10' : 'bg-muted'}`}>
                <p className="text-xs text-muted-foreground">Est. Stockout</p>
                <p className={`text-lg font-bold ${stockoutDay > 0 && stockoutDay <= 14 ? 'text-destructive' : ''}`}>
                  {stockoutDay > 0 ? `${stockoutDay} days` : stockoutDay === 0 ? 'Today!' : '30+ days'}
                </p>
              </div>
            </div>

            {/* Alert for upcoming stockout */}
            {reorderDay > 0 && reorderDay <= 7 && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Calendar className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  Stock will reach reorder point in <strong>{reorderDay} days</strong>. Consider reordering soon.
                </span>
              </div>
            )}

            {/* Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <ReferenceLine 
                    y={selectedProduct.reorder_point || 0} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    label={{ value: 'Reorder Point', position: 'right', fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    name="Projected Stock"
                    fill="hsl(var(--primary) / 0.2)"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockForecastChart;
