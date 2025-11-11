import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

interface OrderHistoryProps {
  userId: string;
}

const OrderHistory = ({ userId }: OrderHistoryProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [reportingIssue, setReportingIssue] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [userId]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    // Generate invoice content
    const invoiceContent = `
COFFEE HABESHA - INVOICE

Order Number: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleDateString()}
Status: ${order.status.toUpperCase()}

ITEMS:
${order.order_items.map(item => 
  `${item.product_name} x${item.quantity} - $${(item.unit_price * item.quantity).toFixed(2)}`
).join('\n')}

TOTAL: $${order.total.toFixed(2)}

Thank you for your order!
    `;

    // Create and download file
    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${order.order_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Invoice downloaded");
  };

  const handleReportIssue = async () => {
    if (!selectedOrder || !issueType || !issueDescription) {
      toast.error("Please fill in all fields");
      return;
    }

    setReportingIssue(true);
    try {
      const { error } = await supabase.from("order_issues").insert({
        order_id: selectedOrder.id,
        user_id: userId,
        issue_type: issueType,
        description: issueDescription,
      });

      if (error) throw error;

      toast.success("Issue reported successfully. We'll contact you soon.");
      setIssueType("");
      setIssueDescription("");
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error reporting issue:", error);
      toast.error("Failed to report issue");
    } finally {
      setReportingIssue(false);
    }
  };

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
    <Card>
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>View and manage your past orders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No orders yet</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Order #{order.order_number}</h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <div className="space-y-1">
                      {order.order_items.map((item, idx) => (
                        <p key={idx} className="text-sm">
                          {item.product_name} x{item.quantity}
                        </p>
                      ))}
                    </div>
                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(order)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Invoice
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Report Issue
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Report an Issue</DialogTitle>
                          <DialogDescription>
                            Order #{order.order_number}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Issue Type</Label>
                            <Select value={issueType} onValueChange={setIssueType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select issue type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="damaged">Damaged Item</SelectItem>
                                <SelectItem value="missing">Missing Item</SelectItem>
                                <SelectItem value="wrong_item">Wrong Item</SelectItem>
                                <SelectItem value="late_delivery">Late Delivery</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={issueDescription}
                              onChange={(e) => setIssueDescription(e.target.value)}
                              placeholder="Please describe the issue..."
                              rows={4}
                            />
                          </div>
                          <Button
                            onClick={handleReportIssue}
                            disabled={reportingIssue}
                            className="w-full"
                          >
                            {reportingIssue ? "Submitting..." : "Submit Report"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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

export default OrderHistory;
