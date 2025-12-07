import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Trash2, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
}

interface Addon {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  status: string;
  products?: Product;
}

interface SubscriptionAddonsProps {
  subscriptionId: string;
  nextDeliveryDate: string | null;
  onAddonsChange?: () => void;
}

export default function SubscriptionAddons({
  subscriptionId,
  nextDeliveryDate,
  onAddonsChange,
}: SubscriptionAddonsProps) {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddons();
    fetchProducts();
  }, [subscriptionId]);

  const fetchAddons = async () => {
    const { data, error } = await supabase
      .from("subscription_addons")
      .select("*, products:product_id(id, name, price, image_url, description)")
      .eq("subscription_id", subscriptionId)
      .eq("status", "pending");

    if (error) {
      console.error("Error fetching addons:", error);
    } else {
      setAddons(data || []);
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, price, image_url, description")
      .eq("in_stock", true)
      .order("name");

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
    }
  };

  const handleAddAddon = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    setSaving(true);
    const { error } = await supabase.from("subscription_addons").insert({
      subscription_id: subscriptionId,
      product_id: selectedProduct,
      quantity,
      unit_price: product.price,
    });

    if (error) {
      toast.error("Failed to add item");
      console.error(error);
    } else {
      toast.success("Item added to next shipment");
      setIsDialogOpen(false);
      setSelectedProduct("");
      setQuantity(1);
      fetchAddons();
      onAddonsChange?.();
    }
    setSaving(false);
  };

  const handleRemoveAddon = async (addonId: string) => {
    const { error } = await supabase
      .from("subscription_addons")
      .delete()
      .eq("id", addonId);

    if (error) {
      toast.error("Failed to remove item");
      console.error(error);
    } else {
      toast.success("Item removed");
      fetchAddons();
      onAddonsChange?.();
    }
  };

  const totalAddonAmount = addons.reduce(
    (sum, addon) => sum + addon.unit_price * addon.quantity,
    0
  );

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Package className="h-5 w-5" />
          Add-on Items
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Item to Next Shipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Product</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - ${product.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={quantity >= 10}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedProduct && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    This item will be added to your next shipment
                    {nextDeliveryDate && ` on ${new Date(nextDeliveryDate).toLocaleDateString()}`}.
                  </p>
                  <p className="font-medium mt-2">
                    Total: $
                    {(
                      (products.find((p) => p.id === selectedProduct)?.price || 0) * quantity
                    ).toFixed(2)}
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAddon} disabled={saving || !selectedProduct}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add to Shipment
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addons.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No add-on items for your next shipment.
            <br />
            Add extra products to include them in your next delivery!
          </p>
        ) : (
          <div className="space-y-3">
            {addons.map((addon) => {
              const product = addon.products as Product | undefined;
              return (
                <div
                  key={addon.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    {product?.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{product?.name || "Product"}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {addon.quantity} × ${addon.unit_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      ${(addon.unit_price * addon.quantity).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAddon(addon.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Add-on Total</span>
              <span className="font-semibold">${totalAddonAmount.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
