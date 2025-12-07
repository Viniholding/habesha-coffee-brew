import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, startOfDay } from 'date-fns';

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
}

const ConversionFunnel = () => {
  const [steps, setSteps] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchFunnelData();
  }, [dateRange]);

  const fetchFunnelData = async () => {
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));

      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('event_type, session_id')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Count unique sessions for each step
      const stepCounts = {
        product_view: new Set<string>(),
        add_to_cart: new Set<string>(),
        begin_checkout: new Set<string>(),
        checkout_step: new Set<string>(),
        purchase: new Set<string>(),
      };

      events?.forEach(event => {
        if (event.session_id && event.event_type in stepCounts) {
          stepCounts[event.event_type as keyof typeof stepCounts].add(event.session_id);
        }
      });

      const counts = {
        product_view: stepCounts.product_view.size,
        add_to_cart: stepCounts.add_to_cart.size,
        begin_checkout: stepCounts.begin_checkout.size,
        checkout_step: stepCounts.checkout_step.size,
        purchase: stepCounts.purchase.size,
      };

      const topOfFunnel = counts.product_view || 1;

      const funnelSteps: FunnelStep[] = [
        {
          name: 'Product Views',
          count: counts.product_view,
          percentage: 100,
          dropoff: 0,
        },
        {
          name: 'Add to Cart',
          count: counts.add_to_cart,
          percentage: (counts.add_to_cart / topOfFunnel) * 100,
          dropoff: counts.product_view > 0 
            ? ((counts.product_view - counts.add_to_cart) / counts.product_view) * 100 
            : 0,
        },
        {
          name: 'Begin Checkout',
          count: counts.begin_checkout,
          percentage: (counts.begin_checkout / topOfFunnel) * 100,
          dropoff: counts.add_to_cart > 0 
            ? ((counts.add_to_cart - counts.begin_checkout) / counts.add_to_cart) * 100 
            : 0,
        },
        {
          name: 'Complete Checkout',
          count: counts.checkout_step,
          percentage: (counts.checkout_step / topOfFunnel) * 100,
          dropoff: counts.begin_checkout > 0 
            ? ((counts.begin_checkout - counts.checkout_step) / counts.begin_checkout) * 100 
            : 0,
        },
        {
          name: 'Purchase',
          count: counts.purchase,
          percentage: (counts.purchase / topOfFunnel) * 100,
          dropoff: counts.checkout_step > 0 
            ? ((counts.checkout_step - counts.purchase) / counts.checkout_step) * 100 
            : 0,
        },
      ];

      setSteps(funnelSteps);
    } catch (error) {
      console.error('Error fetching funnel data:', error);
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

  const overallConversion = steps.length > 0 && steps[0].count > 0
    ? (steps[steps.length - 1].count / steps[0].count) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Conversion Funnel</CardTitle>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.name} className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{step.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">{step.count}</span>
                  <span className="text-sm text-muted-foreground">
                    {step.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${step.percentage}%` }}
                />
              </div>
              {index > 0 && step.dropoff > 0 && (
                <div className="absolute -top-1 right-0 text-xs text-destructive">
                  ↓ {step.dropoff.toFixed(1)}% dropoff
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Overall Conversion Rate</span>
            <span className="text-2xl font-bold text-primary">
              {overallConversion.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversionFunnel;
