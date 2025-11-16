import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import { getTrackingSteps } from "@/components/orders/trackingSteps";
import { getCarrierTrackingUrl, getCarrierName } from "@/lib/carriers";

interface Order {
  id: string;
  order_number: string;
  status: string;
  tracking_number: string | null;
  carrier: string | null;
  estimated_delivery_date: string | null;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
  }>;
}

interface OrderTrackingProps {
  userId: string;
}

const OrderTracking = ({ userId }: OrderTrackingProps) => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveOrders();
  }, [userId]);

  const fetchActiveOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            product_name,
            quantity
          )
        `
        )
        .eq("user_id", userId)
        .in("status", ["processing", "shipped"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActiveOrders(data || []);
    } catch (error) {
      console.error("Error fetching active orders:", error);
    } finally {
      setLoading(false);
    }
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
    <Card>
      <CardHeader>
        <CardTitle>Order Tracking</CardTitle>
        <CardDescription>Track your active orders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No active orders to track</p>
          </div>
        ) : (
          activeOrders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Order #{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items.map((item, idx) => (
                          <span key={idx}>
                            {item.product_name} x{item.quantity}
                            {idx < order.order_items.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </p>
                    </div>
                    <Badge>{order.status}</Badge>
                  </div>

                  {order.tracking_number && (
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">
                            {getCarrierName(order.carrier)} Tracking
                          </p>
                          <p className="text-sm text-muted-foreground font-mono">
                            {order.tracking_number}
                          </p>
                        </div>
                        {getCarrierTrackingUrl(order.carrier, order.tracking_number) && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={getCarrierTrackingUrl(order.carrier, order.tracking_number)!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              Track Package
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {order.estimated_delivery_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>
                        Estimated Delivery:{" "}
                        {new Date(
                          order.estimated_delivery_date
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
                    <div className="relative flex justify-between">
                      {getTrackingSteps(order.status).map((step, idx) => {
                        const Icon = step.icon;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col items-center gap-2"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                step.completed
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-xs text-center max-w-20">
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTracking;
