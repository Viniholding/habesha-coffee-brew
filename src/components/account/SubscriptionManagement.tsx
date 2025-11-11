import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, DollarSign, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Subscription {
  id: string;
  status: string;
  frequency: string;
  quantity: number;
  product_name: string;
  product_id: string;
  next_delivery_date: string | null;
  price: number;
  created_at: string;
}

interface SubscriptionManagementProps {
  userId: string;
}

const SubscriptionManagement = ({ userId }: SubscriptionManagementProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, [userId]);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: newStatus })
        .eq("id", subscriptionId);

      if (error) throw error;
      
      toast.success(`Subscription ${newStatus === "active" ? "resumed" : "paused"} successfully`);
      fetchSubscriptions();
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription");
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", subscriptionId);

      if (error) throw error;
      
      toast.success("Subscription cancelled successfully");
      fetchSubscriptions();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary/10 text-primary border-primary/20";
      case "paused":
        return "bg-muted text-muted-foreground border-border";
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Manage your coffee subscriptions and delivery preferences
          </CardDescription>
        </CardHeader>
      </Card>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No active subscriptions</p>
              <Button>Start a Subscription</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        subscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{subscription.product_name}</h3>
                      <Badge variant="outline" className={getStatusColor(subscription.status)}>
                        {subscription.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subscription.frequency.charAt(0).toUpperCase() + subscription.frequency.slice(1)} delivery
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {subscription.price}
                    </p>
                    <p className="text-sm text-muted-foreground">per delivery</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>Quantity: {subscription.quantity}</span>
                  </div>
                  {subscription.next_delivery_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Next: {format(new Date(subscription.next_delivery_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                {subscription.status === "active" || subscription.status === "paused" ? (
                  <div className="flex gap-2 pt-2">
                    {subscription.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSubscriptionStatus(subscription.id, "paused")}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateSubscriptionStatus(subscription.id, "active")}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelSubscription(subscription.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default SubscriptionManagement;
