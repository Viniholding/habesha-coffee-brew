import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar, Package, Search, Filter, Loader2, Edit, Eye, Pause, Play, X, RefreshCw, DollarSign, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { logAdminAction } from "@/lib/auditLog";

interface Subscription {
  id: string;
  user_id: string;
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
  discount_percent?: number;
  profiles?: { email: string; first_name: string | null; last_name: string | null } | null;
}

interface SubscriptionEvent {
  id: string;
  event_type: string;
  event_data: any;
  created_at: string;
}

const AdminSubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    active: 0,
    paused: 0,
    cancelled: 0,
    mrr: 0,
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubscriptions((data || []) as Subscription[]);

      // Calculate stats
      const active = data?.filter(s => s.status === "active").length || 0;
      const paused = data?.filter(s => s.status === "paused").length || 0;
      const cancelled = data?.filter(s => s.status === "cancelled").length || 0;
      const mrr = data?.filter(s => s.status === "active").reduce((sum, s) => sum + (s.price * s.quantity), 0) || 0;

      setStats({ active, paused, cancelled, mrr });
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionEvents = async (subscriptionId: string) => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_events")
        .select("*")
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setEventsLoading(false);
    }
  };

  const openDetailDialog = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDetailDialogOpen(true);
    fetchSubscriptionEvents(subscription.id);
  };

  const handleAdminAction = async (subscription: Subscription, action: string) => {
    setActionLoading(`${subscription.id}-${action}`);
    try {
      // For admin, we update directly in the database
      let updateData: any = {};

      switch (action) {
        case "pause":
          updateData = { status: "paused", paused_at: new Date().toISOString() };
          break;
        case "resume":
          updateData = { status: "active", paused_at: null };
          break;
        case "cancel":
          updateData = { status: "cancelled", cancelled_at: new Date().toISOString() };
          break;
      }

      const { error } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", subscription.id);

      if (error) throw error;

      // Log the event
      await supabase.from("subscription_events").insert({
        subscription_id: subscription.id,
        event_type: action === "pause" ? "paused" : action === "resume" ? "resumed" : "cancelled",
      });

      await logAdminAction({
        actionType: 'subscription_updated',
        entityType: 'subscription',
        entityId: subscription.id,
        oldValues: { status: subscription.status },
        newValues: updateData,
      });

      toast.success(`Subscription ${action}ed successfully`);
      fetchSubscriptions();
    } catch (error: any) {
      console.error(`Error ${action}ing subscription:`, error);
      toast.error(error.message || `Failed to ${action} subscription`);
    } finally {
      setActionLoading(null);
    }
  };

  const updateSubscriptionDiscount = async (subscriptionId: string, discountPercent: number) => {
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ discount_percent: discountPercent })
        .eq("id", subscriptionId);

      if (error) throw error;

      await logAdminAction({
        actionType: 'subscription_updated',
        entityType: 'subscription',
        entityId: subscriptionId,
        newValues: { discount_percent: discountPercent },
      });

      toast.success("Discount updated");
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.message || "Failed to update discount");
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${sub.profiles?.first_name} ${sub.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-primary/10 text-primary";
      case "paused": return "bg-muted text-muted-foreground";
      case "cancelled": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-lg">
                <Pause className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.paused}</p>
                <p className="text-sm text-muted-foreground">Paused</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
                <p className="text-sm text-muted-foreground">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${stats.mrr.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Est. MRR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Manage customer subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchSubscriptions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Delivery</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No subscriptions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {sub.profiles?.first_name} {sub.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{sub.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sub.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {sub.quantity}x {sub.bag_size || "12oz"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(sub.status)}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{sub.frequency}</TableCell>
                      <TableCell>
                        {sub.next_delivery_date 
                          ? format(new Date(sub.next_delivery_date), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        ${sub.price}
                        {sub.discount_percent && sub.discount_percent > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            -{sub.discount_percent}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailDialog(sub)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {sub.status === "active" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAdminAction(sub, "pause")}
                              disabled={actionLoading === `${sub.id}-pause`}
                            >
                              {actionLoading === `${sub.id}-pause` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Pause className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {sub.status === "paused" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAdminAction(sub, "resume")}
                              disabled={actionLoading === `${sub.id}-resume`}
                            >
                              {actionLoading === `${sub.id}-resume` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              View and manage subscription for {selectedSubscription?.profiles?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-6">
              {/* Subscription Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedSubscription.product_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedSubscription.status)}>
                    {selectedSubscription.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Frequency</Label>
                  <p className="capitalize">{selectedSubscription.frequency}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p>{selectedSubscription.quantity} bags</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Grind</Label>
                  <p className="capitalize">{selectedSubscription.grind?.replace(/_/g, " ") || "Whole Bean"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bag Size</Label>
                  <p>{selectedSubscription.bag_size || "12oz"}</p>
                </div>
              </div>

              <Separator />

              {/* Admin Actions */}
              <div>
                <Label className="text-muted-foreground mb-2 block">Admin Actions</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSubscription.status !== "cancelled" && (
                    <>
                      {selectedSubscription.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdminAction(selectedSubscription, "pause")}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdminAction(selectedSubscription, "resume")}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleAdminAction(selectedSubscription, "cancel")}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Event History */}
              <div>
                <Label className="text-muted-foreground mb-2 block">Event History</Label>
                {eventsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : events.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No events recorded</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {events.map((event) => (
                      <div key={event.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <Badge variant="outline" className="capitalize">{event.event_type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(event.created_at), "MMM d, yyyy h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptionManagement;
