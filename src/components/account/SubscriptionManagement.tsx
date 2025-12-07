import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Package, DollarSign, Pause, Play, X, SkipForward, Edit, Loader2, ExternalLink, CalendarClock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import SubscriptionDetailDialog from "./SubscriptionDetailDialog";
import SubscriptionAddons from "./SubscriptionAddons";
import PauseScheduleDialog from "./PauseScheduleDialog";
import EditResumeDialog from "./EditResumeDialog";
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
  grind?: string;
  bag_size?: string;
  stripe_subscription_id?: string;
  resume_at?: string | null;
}

interface SubscriptionManagementProps {
  userId: string;
}

const SubscriptionManagement = ({ userId }: SubscriptionManagementProps) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [subscriptionToPause, setSubscriptionToPause] = useState<Subscription | null>(null);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [editResumeDialogOpen, setEditResumeDialogOpen] = useState(false);
  const [subscriptionToEditResume, setSubscriptionToEditResume] = useState<Subscription | null>(null);

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

  const handleAction = async (subscriptionId: string, stripeSubId: string | undefined, action: string, resumeAt?: string | null) => {
    if (!stripeSubId) {
      toast.error("Subscription not linked to payment system");
      return;
    }

    setActionLoading(`${subscriptionId}-${action}`);
    try {
      const { error } = await supabase.functions.invoke("manage-subscription", {
        body: { action, subscriptionId: stripeSubId, resumeAt },
      });

      if (error) throw error;

      const message = action === "pause" && resumeAt
        ? `Subscription paused until ${format(new Date(resumeAt), "MMM d, yyyy")}`
        : action === "pause" ? "Subscription paused" 
        : action === "resume" ? "Subscription resumed"
        : action === "cancel" ? "Subscription cancelled"
        : action === "skip" ? "Next delivery skipped" 
        : "Action completed";
        
      toast.success(message);
      fetchSubscriptions();
    } catch (error: any) {
      console.error(`Error ${action}ing subscription:`, error);
      toast.error(error.message || `Failed to ${action} subscription`);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePauseWithSchedule = async (resumeDate: Date | null) => {
    if (!subscriptionToPause) return;
    setPauseLoading(true);
    try {
      await handleAction(
        subscriptionToPause.id,
        subscriptionToPause.stripe_subscription_id,
        "pause",
        resumeDate?.toISOString() || null
      );
    } finally {
      setPauseLoading(false);
      setSubscriptionToPause(null);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Error opening customer portal:", error);
      toast.error(error.message || "Failed to open billing portal");
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

  const formatGrind = (grind?: string) => {
    if (!grind) return "Whole Bean";
    return grind.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Subscriptions</CardTitle>
            <CardDescription>
              Manage your coffee subscriptions and delivery preferences
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openCustomerPortal}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Billing Portal
            </Button>
            <Button variant="hero" size="sm" asChild>
              <Link to="/subscribe">New Subscription</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No active subscriptions</p>
              <Button asChild>
                <Link to="/subscribe">Start a Subscription</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        subscriptions.map((subscription) => (
          <Card key={subscription.id} className="overflow-hidden">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{subscription.product_name}</h3>
                      <Badge variant="outline" className={getStatusColor(subscription.status)}>
                        {subscription.status}
                      </Badge>
                      {subscription.status === "paused" && subscription.resume_at && (
                        <button
                          onClick={() => {
                            setSubscriptionToEditResume(subscription);
                            setEditResumeDialogOpen(true);
                          }}
                          className="flex items-center gap-1 hover:opacity-80"
                        >
                          <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer">
                            <CalendarClock className="h-3 w-3" />
                            Resumes {format(new Date(subscription.resume_at), "MMM d")}
                            <Pencil className="h-3 w-3 ml-1" />
                          </Badge>
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatGrind(subscription.grind)} • {subscription.bag_size || "12oz"} • {subscription.frequency.charAt(0).toUpperCase() + subscription.frequency.slice(1)} delivery
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>Qty: {subscription.quantity}</span>
                  </div>
                  {subscription.next_delivery_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Next: {format(new Date(subscription.next_delivery_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                {subscription.status === "active" && (
                  <SubscriptionAddons
                    subscriptionId={subscription.id}
                    nextDeliveryDate={subscription.next_delivery_date}
                  />
                )}

                {(subscription.status === "active" || subscription.status === "paused") && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        setDetailDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>

                    {subscription.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSubscriptionToPause(subscription);
                          setPauseDialogOpen(true);
                        }}
                        disabled={actionLoading === `${subscription.id}-pause`}
                      >
                        {actionLoading === `${subscription.id}-pause` ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4 mr-2" />
                        )}
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(subscription.id, subscription.stripe_subscription_id, "resume")}
                        disabled={actionLoading === `${subscription.id}-resume`}
                      >
                        {actionLoading === `${subscription.id}-resume` ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Resume Now
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(subscription.id, subscription.stripe_subscription_id, "skip")}
                      disabled={actionLoading === `${subscription.id}-skip`}
                    >
                      {actionLoading === `${subscription.id}-skip` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <SkipForward className="h-4 w-4 mr-2" />
                      )}
                      Skip Next
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleAction(subscription.id, subscription.stripe_subscription_id, "cancel")}
                      disabled={actionLoading === `${subscription.id}-cancel`}
                    >
                      {actionLoading === `${subscription.id}-cancel` ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <SubscriptionDetailDialog
        subscription={selectedSubscription}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onUpdate={fetchSubscriptions}
      />

      <PauseScheduleDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        onConfirm={handlePauseWithSchedule}
        loading={pauseLoading}
      />

      {subscriptionToEditResume && (
        <EditResumeDialog
          open={editResumeDialogOpen}
          onOpenChange={setEditResumeDialogOpen}
          subscriptionId={subscriptionToEditResume.id}
          currentResumeAt={subscriptionToEditResume.resume_at || null}
          onUpdate={fetchSubscriptions}
        />
      )}
    </div>
  );
};

export default SubscriptionManagement;
