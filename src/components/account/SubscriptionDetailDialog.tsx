import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { grindOptions, bagSizeOptions, frequencyOptions } from "@/lib/subscriptionProducts";

interface Subscription {
  id: string;
  status: string;
  frequency: string;
  quantity: number;
  product_name: string;
  grind?: string;
  bag_size?: string;
  stripe_subscription_id?: string;
}

interface SubscriptionDetailDialogProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const SubscriptionDetailDialog = ({
  subscription,
  open,
  onOpenChange,
  onUpdate,
}: SubscriptionDetailDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [frequency, setFrequency] = useState(subscription?.frequency || "biweekly");
  const [quantity, setQuantity] = useState(subscription?.quantity || 1);
  const [grind, setGrind] = useState(subscription?.grind || "whole_bean");
  const [bagSize, setBagSize] = useState(subscription?.bag_size || "12oz");

  const handleSave = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      // Update local database
      const { error: dbError } = await supabase
        .from("subscriptions")
        .update({
          frequency,
          quantity,
          grind,
          bag_size: bagSize,
        })
        .eq("id", subscription.id);

      if (dbError) throw dbError;

      // Update Stripe if quantity changed
      if (quantity !== subscription.quantity && subscription.stripe_subscription_id) {
        await supabase.functions.invoke("manage-subscription", {
          body: {
            action: "update_quantity",
            subscriptionId: subscription.stripe_subscription_id,
            newQuantity: quantity,
          },
        });
      }

      toast.success("Subscription updated successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating subscription:", error);
      toast.error(error.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Update your {subscription.product_name} subscription settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Delivery Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantity (bags per delivery)</Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.min(5, quantity + 1))}
                disabled={quantity >= 5}
              >
                +
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Grind Type</Label>
            <Select value={grind} onValueChange={setGrind}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {grindOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bag Size</Label>
            <Select value={bagSize} onValueChange={setBagSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bagSizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDetailDialog;
