import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, CreditCard, Trash2, Star } from "lucide-react";
import { paymentMethodSchema } from "@/lib/validation";
import { logger } from "@/lib/logger";

interface PaymentMethod {
  id: string;
  payment_type: string;
  card_last_four: string | null;
  card_brand: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
}

interface PaymentMethodsProps {
  userId: string;
}

const PaymentMethods = ({ userId }: PaymentMethodsProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    payment_type: "card",
    card_last_four: "",
    card_brand: "",
    card_exp_month: "",
    card_exp_year: "",
    is_default: false,
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, [userId]);

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      logger.error("Error fetching payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate payment method data
    const validation = paymentMethodSchema.safeParse({
      payment_type: formData.payment_type,
      card_last_four: formData.card_last_four || undefined,
      card_brand: formData.card_brand || undefined,
      card_exp_month: formData.card_exp_month ? parseInt(formData.card_exp_month) : undefined,
      card_exp_year: formData.card_exp_year ? parseInt(formData.card_exp_year) : undefined,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    try {
      const { error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: userId,
          payment_type: validation.data.payment_type,
          card_last_four: validation.data.card_last_four || null,
          card_brand: validation.data.card_brand || null,
          card_exp_month: validation.data.card_exp_month || null,
          card_exp_year: validation.data.card_exp_year || null,
          is_default: formData.is_default,
        });

      if (error) throw error;
      toast.success("Payment method added successfully");
      setDialogOpen(false);
      resetForm();
      fetchPaymentMethods();
    } catch (error) {
      logger.error("Error adding payment method:", error);
      toast.error("Failed to add payment method");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Payment method deleted");
      fetchPaymentMethods();
    } catch (error) {
      logger.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", userId);

      // Then set the selected one as default
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
      toast.success("Default payment method updated");
      fetchPaymentMethods();
    } catch (error) {
      logger.error("Error setting default:", error);
      toast.error("Failed to set default payment method");
    }
  };

  const resetForm = () => {
    setFormData({
      payment_type: "card",
      card_last_four: "",
      card_brand: "",
      card_exp_month: "",
      card_exp_year: "",
      is_default: false,
    });
  };

  const getCardBrandIcon = (brand: string | null) => {
    // You could replace this with actual brand logos
    return brand?.toUpperCase() || "CARD";
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your saved payment methods</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Note: This is a demo. In production, use a secure payment processor like Stripe.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, payment_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.payment_type === "card" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="card_brand">Card Brand</Label>
                      <Select
                        value={formData.card_brand}
                        onValueChange={(value) =>
                          setFormData({ ...formData, card_brand: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visa">Visa</SelectItem>
                          <SelectItem value="mastercard">Mastercard</SelectItem>
                          <SelectItem value="amex">American Express</SelectItem>
                          <SelectItem value="discover">Discover</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card_last_four">Last 4 Digits</Label>
                      <Input
                        id="card_last_four"
                        maxLength={4}
                        placeholder="1234"
                        value={formData.card_last_four}
                        onChange={(e) =>
                          setFormData({ ...formData, card_last_four: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="exp_month">Exp. Month</Label>
                        <Input
                          id="exp_month"
                          type="number"
                          min="1"
                          max="12"
                          placeholder="MM"
                          value={formData.card_exp_month}
                          onChange={(e) =>
                            setFormData({ ...formData, card_exp_month: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="exp_year">Exp. Year</Label>
                        <Input
                          id="exp_year"
                          type="number"
                          min={new Date().getFullYear()}
                          placeholder="YYYY"
                          value={formData.card_exp_year}
                          onChange={(e) =>
                            setFormData({ ...formData, card_exp_year: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full">
                  Add Payment Method
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No payment methods saved yet</p>
          </div>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-md flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {getCardBrandIcon(method.card_brand)} ••••{" "}
                          {method.card_last_four}
                        </p>
                        {method.is_default && (
                          <Badge className="bg-primary">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      {method.card_exp_month && method.card_exp_year && (
                        <p className="text-sm text-muted-foreground">
                          Expires {method.card_exp_month}/{method.card_exp_year}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!method.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default PaymentMethods;
