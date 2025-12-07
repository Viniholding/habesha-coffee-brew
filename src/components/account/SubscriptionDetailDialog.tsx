import { useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { subscriptionProducts, grindOptions, bagSizeOptions, frequencyOptions } from "@/lib/subscriptionProducts";

interface Subscription {
  id: string;
  status: string;
  frequency: string;
  quantity: number;
  product_name: string;
  product_id: string;
  grind?: string;
  bag_size?: string;
  stripe_subscription_id?: string;
  price: number;
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
  const [productId, setProductId] = useState(subscription?.product_id || "");
  const [showProductSwap, setShowProductSwap] = useState(false);

  useEffect(() => {
    if (subscription) {
      setFrequency(subscription.frequency);
      setQuantity(subscription.quantity);
      setGrind(subscription.grind || "whole_bean");
      setBagSize(subscription.bag_size || "12oz");
      setProductId(subscription.product_id);
      setShowProductSwap(false);
    }
  }, [subscription]);

  const handleSave = async () => {
    if (!subscription) return;

    setLoading(true);
    try {
      const selectedProduct = subscriptionProducts.find((p) => p.id === productId);
      const bagMultiplier = bagSizeOptions.find((b) => b.value === bagSize)?.priceMultiplier || 1;
      const newPrice = selectedProduct ? selectedProduct.price * bagMultiplier : subscription.price;

      // Update local database
      const updateData: any = {
        frequency,
        quantity,
        grind,
        bag_size: bagSize,
      };

      // If product changed, update product info
      if (productId !== subscription.product_id) {
        updateData.product_id = productId;
        updateData.product_name = selectedProduct?.name || subscription.product_name;
        updateData.price = newPrice;
      }

      const { error: dbError } = await supabase
        .from("subscriptions")
        .update(updateData)
        .eq("id", subscription.id);

      if (dbError) throw dbError;

      // Log product swap event
      if (productId !== subscription.product_id) {
        await supabase.from("subscription_events").insert({
          subscription_id: subscription.id,
          event_type: "product_swapped",
          event_data: {
            from_product: subscription.product_name,
            to_product: selectedProduct?.name,
          },
        });
      }

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

  const selectedProduct = subscriptionProducts.find((p) => p.id === productId);
  const bagMultiplier = bagSizeOptions.find((b) => b.value === bagSize)?.priceMultiplier || 1;
  const estimatedPrice = selectedProduct ? (selectedProduct.price * bagMultiplier * quantity).toFixed(2) : subscription.price.toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Update your {subscription.product_name} subscription settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Swap Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Current Product</Label>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowProductSwap(!showProductSwap)}
                className="text-primary"
              >
                {showProductSwap ? "Cancel" : "Change Product"}
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            {showProductSwap ? (
              <RadioGroup value={productId} onValueChange={setProductId} className="space-y-2">
                {subscriptionProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                      productId === product.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setProductId(product.id)}
                  >
                    <RadioGroupItem value={product.id} id={product.id} />
                    <div className="flex-1">
                      <Label htmlFor={product.id} className="font-medium cursor-pointer">
                        {product.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                    </div>
                    <span className="font-medium">${product.price.toFixed(2)}</span>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                {subscription.product_name}
              </p>
            )}
          </div>

          <Separator />

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

          {/* Price Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estimated Price per Delivery</span>
              <span className="text-lg font-semibold">${estimatedPrice}</span>
            </div>
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
