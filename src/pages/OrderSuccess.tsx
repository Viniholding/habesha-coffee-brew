import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Package,
  Truck,
  Calendar,
  Coffee,
  RefreshCw,
  Pause,
  SkipForward,
  Home,
  Mail,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { CoffeeBeanLoading } from "@/components/ui/CoffeeBeanSpinner";
import { motion } from "framer-motion";
import { frequencyOptions } from "@/lib/subscriptionProducts";

interface OrderDetails {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  estimated_delivery_date: string | null;
}

interface SubscriptionDetails {
  id: string;
  product_name: string;
  frequency: string;
  quantity: number;
  next_delivery_date: string | null;
  status: string;
  grind: string | null;
  bag_size: string | null;
}

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const orderId = searchParams.get("order");
  const subscriptionId = searchParams.get("subscription");

  useEffect(() => {
    fetchDetails();
  }, [orderId, subscriptionId]);

  const fetchDetails = async () => {
    try {
      // Fetch order if provided
      if (orderId) {
        const { data: orderData } = await supabase
          .from("orders")
          .select("id, order_number, total, status, created_at, estimated_delivery_date")
          .eq("id", orderId)
          .single();

        if (orderData) setOrder(orderData);
      }

      // Fetch subscription if provided
      if (subscriptionId) {
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("id, product_name, frequency, quantity, next_delivery_date, status, grind, bag_size")
          .eq("id", subscriptionId)
          .single();

        if (subData) setSubscription(subData);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipDelivery = async () => {
    if (!subscription) return;
    setActionLoading("skip");

    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: {
          action: "skip",
          subscriptionId: subscription.id,
        },
      });

      if (error) throw error;
      toast.success("Next delivery skipped!");
      fetchDetails();
    } catch (error) {
      console.error("Error skipping delivery:", error);
      toast.error("Failed to skip delivery");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseSubscription = async () => {
    if (!subscription) return;
    setActionLoading("pause");

    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: {
          action: "pause",
          subscriptionId: subscription.id,
        },
      });

      if (error) throw error;
      toast.success("Subscription paused");
      fetchDetails();
    } catch (error) {
      console.error("Error pausing subscription:", error);
      toast.error("Failed to pause subscription");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeFrequency = async (newFrequency: string) => {
    if (!subscription) return;
    setActionLoading("frequency");

    try {
      const { data, error } = await supabase.functions.invoke("manage-subscription", {
        body: {
          action: "update",
          subscriptionId: subscription.id,
          frequency: newFrequency,
        },
      });

      if (error) throw error;
      toast.success("Delivery frequency updated!");
      fetchDetails();
    } catch (error) {
      console.error("Error changing frequency:", error);
      toast.error("Failed to change frequency");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <CoffeeBeanLoading message="Loading your order..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your order. We'll send you an email confirmation shortly.
            </p>
          </motion.div>

          {/* Order Details */}
          {order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Order Details
                    </CardTitle>
                    <Badge variant="secondary">{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Number</p>
                      <p className="font-mono font-medium">{order.order_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {order.estimated_delivery_date && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                        <p className="font-medium flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          {new Date(order.estimated_delivery_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    A confirmation email has been sent with tracking information.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Subscription Management */}
          {subscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="mb-6 border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-primary" />
                      Subscription Created
                    </CardTitle>
                    <Badge className="bg-primary">{subscription.status}</Badge>
                  </div>
                  <CardDescription>
                    Manage your subscription right from here
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Subscription Info */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Product</p>
                      <p className="font-medium flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-primary" />
                        {subscription.product_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-medium">{subscription.quantity} bag(s)</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grind</p>
                      <p className="font-medium">{subscription.grind || "Whole Bean"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium">{subscription.bag_size || "12oz"}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Next Delivery */}
                  {subscription.next_delivery_date && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Next Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(subscription.next_delivery_date).toLocaleDateString(
                              "en-US",
                              { weekday: "long", month: "long", day: "numeric" }
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSkipDelivery}
                        disabled={actionLoading === "skip"}
                      >
                        <SkipForward className="h-4 w-4 mr-1" />
                        Skip
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Quick Actions</h4>

                    {/* Change Frequency */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Delivery Frequency</span>
                      </div>
                      <Select
                        value={subscription.frequency}
                        onValueChange={handleChangeFrequency}
                        disabled={actionLoading === "frequency"}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencyOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Pause Subscription */}
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handlePauseSubscription}
                      disabled={actionLoading === "pause"}
                    >
                      <Pause className="h-4 w-4" />
                      Pause Subscription
                    </Button>
                  </div>

                  <div className="text-xs text-center text-muted-foreground">
                    You can manage all subscription settings from your account page.
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button onClick={() => navigate("/")} className="gap-2">
              <Home className="h-4 w-4" />
              Continue Shopping
            </Button>
            {subscription && (
              <Button
                variant="outline"
                onClick={() => navigate("/account?tab=subscriptions")}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Manage Subscriptions
              </Button>
            )}
            {order && (
              <Button
                variant="outline"
                onClick={() => navigate("/account?tab=orders")}
                className="gap-2"
              >
                <Package className="h-4 w-4" />
                View All Orders
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OrderSuccess;
