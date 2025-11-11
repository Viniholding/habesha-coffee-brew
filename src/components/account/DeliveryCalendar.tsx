import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Package } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  status: string;
}

interface DeliveryCalendarProps {
  userId: string;
}

const DeliveryCalendar = ({ userId }: DeliveryCalendarProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, estimated_delivery_date, delivered_at, status")
        .eq("user_id", userId)
        .not("estimated_delivery_date", "is", null);

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrdersForDate = (date: Date | undefined) => {
    if (!date) return [];
    
    const dateStr = format(date, "yyyy-MM-dd");
    return orders.filter((order) => {
      const deliveryDate = order.estimated_delivery_date 
        ? format(new Date(order.estimated_delivery_date), "yyyy-MM-dd")
        : null;
      return deliveryDate === dateStr;
    });
  };

  const getDeliveryDates = (): Date[] => {
    return orders
      .filter((order) => order.estimated_delivery_date)
      .map((order) => new Date(order.estimated_delivery_date!));
  };

  const selectedDateOrders = getOrdersForDate(selectedDate);
  const deliveryDates = getDeliveryDates();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      processing: "bg-blue-500",
      shipped: "bg-purple-500",
      delivered: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Delivery Calendar</CardTitle>
          <CardDescription>
            View your scheduled deliveries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border pointer-events-auto"
            modifiers={{
              delivery: deliveryDates,
            }}
            modifiersStyles={{
              delivery: {
                fontWeight: "bold",
                textDecoration: "underline",
                textDecorationColor: "hsl(var(--primary))",
              },
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </CardTitle>
          <CardDescription>
            Deliveries scheduled for this day
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No deliveries scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Order #{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Expected delivery
                        </p>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryCalendar;
