import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { getTrackingSteps } from "@/components/orders/trackingSteps";

interface OrderItem {
  product_name: string;
  quantity: number;
}

interface PublicOrder {
  id: string;
  order_number: string;
  status: string;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
  created_at: string;
  email: string;
  order_items: OrderItem[];
}

const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

const CustomerOrderTracking = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setSearched(false);

    if (!orderNumber.trim() || !email.trim()) {
      setError("Please enter both your order number and email.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: supabaseError } = await supabase
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
        .eq("order_number", orderNumber.trim())
        .ilike("email", email.trim()) // case-insensitive match
        .single();

      if (supabaseError) {
        console.error(supabaseError);
        setError("We couldn't find an order with that number and email.");
        return;
      }

      setOrder(data as PublicOrder);
    } catch (err) {
      console.error("Error fetching order:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Track Your Order</CardTitle>
        <CardDescription>
          Enter your order number and email to see the latest status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="order-number" className="text-sm font-medium">
                Order Number
              </label>
              <Input
                id="order-number"
                placeholder="e.g. 123456"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Searching..." : "Track order"}
          </Button>
        </form>

        {/* Messages */}
        {searched && !order && !loading && !error && (
          <p className="text-sm text-muted-foreground">
            No order found. Please check your details and try again.
          </p>
        )}

        {/* Result */}
        {order && (
          <div className="pt-4 border-t space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Order #{order.order_number}</h3>
                <p className="text-xs text-muted-foreground">
                  Placed on{" "}
                  {new Date(order.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.order_items.map((item, idx) => (
                    <span key={idx}>
                      {item.product_name} x{item.quantity}
                      {idx < order.order_items.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </div>
              <Badge>{formatStatus(order.status)}</Badge>
            </div>

            {order.tracking_number && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Tracking Number</p>
                <p className="text-sm text-muted-foreground">
                  {order.tracking_number}
                </p>
              </div>
            )}

            {order.estimated_delivery_date && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>
                  Estimated Delivery:{" "}
                  {new Date(
                    order.estimated_delivery_date
                  ).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
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
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerOrderTracking;
