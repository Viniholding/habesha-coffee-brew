import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Users, XCircle, Gift } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from "date-fns";

interface MRRDataPoint {
  date: string;
  mrr: number;
}

interface ChurnDataPoint {
  date: string;
  churnRate: number;
  churned: number;
  total: number;
}

interface ProductPopularity {
  name: string;
  count: number;
  revenue: number;
}

const CHART_COLORS = ["hsl(28, 85%, 55%)", "hsl(35, 90%, 60%)", "hsl(20, 70%, 45%)", "hsl(30, 80%, 50%)", "hsl(25, 60%, 40%)"];

export default function SubscriptionAnalytics() {
  const [timeRange, setTimeRange] = useState("6");
  const [mrrTrend, setMrrTrend] = useState<MRRDataPoint[]>([]);
  const [churnTrend, setChurnTrend] = useState<ChurnDataPoint[]>([]);
  const [productPopularity, setProductPopularity] = useState<ProductPopularity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMRR, setCurrentMRR] = useState(0);
  const [mrrGrowth, setMrrGrowth] = useState(0);
  const [avgChurn, setAvgChurn] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const months = parseInt(timeRange);
      const startDate = subMonths(new Date(), months);

      // Fetch all subscriptions with events
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*")
        .gte("created_at", startDate.toISOString());

      const { data: events } = await supabase
        .from("subscription_events")
        .select("*")
        .gte("created_at", startDate.toISOString());

      const { data: referrals } = await supabase
        .from("referrals")
        .select("*")
        .eq("status", "converted");

      setTotalReferrals(referrals?.length || 0);

      // Calculate MRR trend by month
      const monthsInterval = eachMonthOfInterval({
        start: startDate,
        end: new Date(),
      });

      const mrrData: MRRDataPoint[] = monthsInterval.map((month) => {
        const monthEnd = endOfMonth(month);
        const activeAtMonth = subscriptions?.filter((s) => {
          const created = new Date(s.created_at);
          const cancelled = s.cancelled_at ? new Date(s.cancelled_at) : null;
          return created <= monthEnd && (!cancelled || cancelled > monthEnd) && s.status !== "cancelled";
        }) || [];

        // Calculate MRR based on frequency
        const frequencyMultiplier: Record<string, number> = {
          weekly: 4.33,
          biweekly: 2.17,
          every_3_weeks: 1.44,
          every_4_weeks: 1.08,
          monthly: 1,
        };

        const mrr = activeAtMonth.reduce((sum, s) => {
          const multiplier = frequencyMultiplier[s.frequency] || 2;
          return sum + s.price * s.quantity * multiplier;
        }, 0);

        return {
          date: format(month, "MMM yyyy"),
          mrr: Math.round(mrr),
        };
      });

      setMrrTrend(mrrData);
      
      if (mrrData.length > 0) {
        setCurrentMRR(mrrData[mrrData.length - 1].mrr);
        if (mrrData.length > 1) {
          const prevMRR = mrrData[mrrData.length - 2].mrr;
          const growth = prevMRR > 0 ? ((mrrData[mrrData.length - 1].mrr - prevMRR) / prevMRR) * 100 : 0;
          setMrrGrowth(growth);
        }
      }

      // Calculate churn rate by month
      const churnData: ChurnDataPoint[] = monthsInterval.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const cancelledInMonth = events?.filter((e) => {
          const eventDate = new Date(e.created_at);
          return e.event_type === "cancelled" && eventDate >= monthStart && eventDate <= monthEnd;
        }).length || 0;

        const activeAtStart = subscriptions?.filter((s) => {
          const created = new Date(s.created_at);
          return created < monthStart;
        }).length || 1;

        const churnRate = (cancelledInMonth / Math.max(activeAtStart, 1)) * 100;

        return {
          date: format(month, "MMM yyyy"),
          churnRate: Math.round(churnRate * 10) / 10,
          churned: cancelledInMonth,
          total: activeAtStart,
        };
      });

      setChurnTrend(churnData);
      setAvgChurn(churnData.reduce((sum, d) => sum + d.churnRate, 0) / churnData.length || 0);

      // Calculate product popularity
      const productCounts: Record<string, { count: number; revenue: number }> = {};
      subscriptions?.forEach((s) => {
        if (!productCounts[s.product_name]) {
          productCounts[s.product_name] = { count: 0, revenue: 0 };
        }
        productCounts[s.product_name].count += 1;
        productCounts[s.product_name].revenue += s.price * s.quantity;
      });

      const popularityData = Object.entries(productCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count);

      setProductPopularity(popularityData);
    } catch (error) {
      console.error("Error fetching subscription analytics:", error);
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

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Subscription Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentMRR.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {mrrGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={mrrGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {mrrGrowth >= 0 ? "+" : ""}{mrrGrowth.toFixed(1)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Churn Rate</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgChurn.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly average</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Product</CardTitle>
            <RefreshCw className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{productPopularity[0]?.name || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {productPopularity[0]?.count || 0} subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Referral Conversions</CardTitle>
            <Gift className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReferrals}</div>
            <p className="text-xs text-muted-foreground mt-1">Successful referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* MRR Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              MRR Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mrrTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 15%, 25%)" />
                  <XAxis dataKey="date" stroke="hsl(30, 20%, 65%)" fontSize={12} />
                  <YAxis stroke="hsl(30, 20%, 65%)" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(20, 18%, 12%)",
                      border: "1px solid hsl(25, 15%, 25%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "MRR"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    stroke="hsl(142, 70%, 45%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(142, 70%, 45%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Churn Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Churn Rate Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(25, 15%, 25%)" />
                  <XAxis dataKey="date" stroke="hsl(30, 20%, 65%)" fontSize={12} />
                  <YAxis stroke="hsl(30, 20%, 65%)" fontSize={12} tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(20, 18%, 12%)",
                      border: "1px solid hsl(25, 15%, 25%)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "churnRate") return [`${value}%`, "Churn Rate"];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="churnRate" fill="hsl(0, 70%, 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Popularity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Product Popularity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productPopularity}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="name"
                  >
                    {productPopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(20, 18%, 12%)",
                      border: "1px solid hsl(25, 15%, 25%)",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium mb-2">Subscription Breakdown</h4>
              {productPopularity.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm font-medium truncate max-w-[150px]">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{product.count} subs</p>
                    <p className="text-xs text-muted-foreground">${product.revenue.toFixed(0)} rev</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
