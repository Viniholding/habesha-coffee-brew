import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Calendar, ArrowRight, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface PendingPO {
  id: string;
  order_number: string;
  status: string;
  expected_delivery_date: string | null;
  total_amount: number;
  supplier_name: string | null;
}

const PendingPurchaseOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PendingPO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, order_number, status, expected_delivery_date, total_amount, suppliers(name)')
        .in('status', ['submitted', 'confirmed', 'shipped', 'partially_received'])
        .order('expected_delivery_date', { ascending: true, nullsFirst: false })
        .limit(5);

      if (error) throw error;

      setOrders((data || []).map(order => ({
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        expected_delivery_date: order.expected_delivery_date,
        total_amount: order.total_amount || 0,
        supplier_name: order.suppliers?.name || null,
      })));
    } catch (error) {
      console.error('Error fetching pending POs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      submitted: 'bg-blue-500',
      confirmed: 'bg-yellow-500',
      shipped: 'bg-purple-500',
      partially_received: 'bg-orange-500',
    };
    const labels: Record<string, string> = {
      submitted: 'Submitted',
      confirmed: 'Confirmed',
      shipped: 'Shipped',
      partially_received: 'Partial',
    };
    return (
      <Badge className={`${colors[status] || 'bg-gray-500'} text-white text-xs`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getDeliveryStatus = (date: string | null) => {
    if (!date) return null;
    
    const deliveryDate = new Date(date);
    const today = new Date();
    const threeDaysFromNow = addDays(today, 3);

    if (isBefore(deliveryDate, today)) {
      return <span className="text-destructive text-xs font-medium">Overdue</span>;
    } else if (isBefore(deliveryDate, threeDaysFromNow)) {
      return <span className="text-orange-500 text-xs font-medium">Due Soon</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Pending Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Pending Purchase Orders
        </CardTitle>
        <CardDescription>
          Orders awaiting delivery or confirmation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending purchase orders
          </p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate('/commandcenter/purchase-orders')}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.supplier_name || 'Unknown supplier'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    {order.expected_delivery_date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(order.expected_delivery_date), 'MMM d')}
                        {getDeliveryStatus(order.expected_delivery_date)}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-sm">
                    ${order.total_amount.toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {orders.length > 0 && (
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => navigate('/commandcenter/purchase-orders')}
          >
            View All Orders <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingPurchaseOrders;
