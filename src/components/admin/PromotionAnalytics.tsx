import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Tag, TrendingUp, DollarSign, Users, Percent, 
  ArrowUpRight, BarChart3, Download 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";

interface PromotionWithStats {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  current_uses: number;
  max_uses: number | null;
  is_active: boolean;
  applies_to: string;
  created_at: string;
  total_discount_given: number;
  estimated_revenue: number;
  conversion_rate: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const PromotionAnalytics = () => {
  // Fetch promotions
  const { data: promotions, isLoading: loadingPromos } = useQuery({
    queryKey: ["promotion-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("current_uses", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch promotion usage data
  const { data: usageData, isLoading: loadingUsage } = useQuery({
    queryKey: ["promotion-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotion_uses")
        .select("*, promotions(code, discount_type, discount_value)")
        .order("used_at", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate analytics
  const analytics = promotions?.map(promo => {
    const promoUses = usageData?.filter(u => u.promotion_id === promo.id) || [];
    const totalDiscountGiven = promoUses.reduce((sum, u) => sum + (u.discount_applied || 0), 0);
    
    // Estimate revenue (assuming average order value of $40 for subscriptions)
    const avgOrderValue = 40;
    const estimatedRevenue = promo.current_uses * avgOrderValue;
    
    // Conversion rate (uses / max_uses if limited, otherwise use a baseline)
    const conversionRate = promo.max_uses 
      ? (promo.current_uses / promo.max_uses) * 100 
      : Math.min((promo.current_uses / 100) * 100, 100);

    return {
      ...promo,
      total_discount_given: totalDiscountGiven,
      estimated_revenue: estimatedRevenue,
      conversion_rate: conversionRate,
    } as PromotionWithStats;
  }) || [];

  // Summary stats
  const totalPromotions = promotions?.length || 0;
  const activePromotions = promotions?.filter(p => p.is_active).length || 0;
  const totalUses = promotions?.reduce((sum, p) => sum + p.current_uses, 0) || 0;
  const totalDiscountGiven = analytics.reduce((sum, p) => sum + p.total_discount_given, 0);
  const estimatedTotalRevenue = analytics.reduce((sum, p) => sum + p.estimated_revenue, 0);

  // Chart data for usage by promotion
  const usageChartData = analytics
    .filter(p => p.current_uses > 0)
    .slice(0, 5)
    .map(p => ({
      name: p.code,
      uses: p.current_uses,
      discount: p.total_discount_given,
    }));

  // Pie chart data for promotion type distribution
  const typeDistribution = [
    { name: 'Percentage', value: promotions?.filter(p => p.discount_type === 'percentage').length || 0 },
    { name: 'Fixed Amount', value: promotions?.filter(p => p.discount_type === 'fixed_amount').length || 0 },
  ].filter(d => d.value > 0);

  // Applies to distribution
  const appliesDistribution = [
    { name: 'All Orders', value: promotions?.filter(p => p.applies_to === 'all').length || 0 },
    { name: 'Subscriptions', value: promotions?.filter(p => p.applies_to === 'subscription').length || 0 },
    { name: 'One-Time', value: promotions?.filter(p => p.applies_to === 'one_time').length || 0 },
  ].filter(d => d.value > 0);

  const isLoading = loadingPromos || loadingUsage;

  // CSV Export function
  const exportToCSV = () => {
    const headers = ["Code", "Description", "Discount Type", "Discount Value", "Redemptions", "Max Uses", "Total Discounts Given", "Est. Revenue", "Conversion Rate", "Status", "Created At"];
    
    const rows = analytics.map(promo => [
      promo.code,
      promo.description || "",
      promo.discount_type,
      promo.discount_value,
      promo.current_uses,
      promo.max_uses || "Unlimited",
      promo.total_discount_given.toFixed(2),
      promo.estimated_revenue.toFixed(2),
      `${promo.conversion_rate.toFixed(1)}%`,
      promo.is_active ? "Active" : "Inactive",
      format(new Date(promo.created_at), "yyyy-MM-dd")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `promotion-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Promotion data exported successfully");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Promotions</p>
                <p className="text-3xl font-bold">{totalPromotions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activePromotions} active
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Tag className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Redemptions</p>
                <p className="text-3xl font-bold">{totalUses}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Active usage
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Discounts Given</p>
                <p className="text-3xl font-bold">${totalDiscountGiven.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all promotions
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <Percent className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Est. Revenue Generated</p>
                <p className="text-3xl font-bold">${estimatedTotalRevenue.toFixed(0)}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  From promo users
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Promotions by Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={usageChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="uses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No promotion usage data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution Pie Charts */}
        <Card>
          <CardHeader>
            <CardTitle>Promotion Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground text-center mb-2">By Type</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {typeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {typeDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                      />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-center mb-2">By Target</p>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={appliesDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {appliesDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 flex-wrap">
                  {appliesDistribution.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} 
                      />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Promotion Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Total Discounts</TableHead>
                <TableHead>Est. Revenue</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div>
                      <span className="font-mono font-bold">{promo.code}</span>
                      {promo.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {promo.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {promo.discount_type === "percentage" 
                      ? `${promo.discount_value}%` 
                      : `$${promo.discount_value}`}
                  </TableCell>
                  <TableCell>
                    {promo.current_uses}
                    {promo.max_uses && (
                      <span className="text-muted-foreground"> / {promo.max_uses}</span>
                    )}
                  </TableCell>
                  <TableCell>${promo.total_discount_given.toFixed(2)}</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    ${promo.estimated_revenue.toFixed(0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${Math.min(promo.conversion_rate, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {promo.conversion_rate.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.is_active ? "default" : "secondary"}>
                      {promo.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionAnalytics;
