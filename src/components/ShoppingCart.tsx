import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ShoppingCart as CartIcon, Trash2, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";
import { getGuestCart, getGuestCartTotal, updateGuestCartQuantity, removeFromGuestCart, GuestCartItem } from "@/lib/guestCart";
import productBag from "@/assets/product-bag.jpg";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
  isGuest?: boolean;
}

interface ShoppingCartProps {
  userId: string | null;
}

const ShoppingCart = ({ userId }: ShoppingCartProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [guestCartCount, setGuestCartCount] = useState(0);
  const navigate = useNavigate();

  // Update guest cart count periodically
  useEffect(() => {
    if (!userId) {
      const updateGuestCount = () => {
        const { items } = getGuestCartTotal();
        setGuestCartCount(items);
      };
      
      updateGuestCount();
      
      // Listen for storage changes (from other tabs)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "guest_cart") {
          updateGuestCount();
        }
      };
      
      window.addEventListener("storage", handleStorageChange);
      
      // Poll for changes in same tab
      const interval = setInterval(updateGuestCount, 1000);
      
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [userId]);

  // Load guest cart items when dropdown opens for non-logged-in users
  const loadGuestCartItems = () => {
    if (!userId) {
      const guestItems = getGuestCart();
      const items: CartItem[] = guestItems.map((item: GuestCartItem, index: number) => ({
        id: `guest-${index}`,
        quantity: item.quantity,
        product: {
          id: item.productId,
          name: item.productName,
          price: item.price,
          image_url: item.imageUrl,
        },
        isGuest: true,
      }));
      setCartItems(items);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCartItems();
      
      // Listen for cart-updated custom events
      const handleCartUpdate = () => {
        fetchCartItems();
      };
      window.addEventListener("cart-updated", handleCartUpdate);

      return () => {
        window.removeEventListener("cart-updated", handleCartUpdate);
      };
    } else {
      loadGuestCartItems();
    }
  }, [userId]);

  const fetchCartItems = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          quantity,
          product:products (
            id,
            name,
            price,
            image_url
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      logger.error("Error fetching cart items:", error);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number, isGuest?: boolean) => {
    if (newQuantity < 1) return;
    
    if (isGuest) {
      const item = cartItems.find(i => i.id === itemId);
      if (item) {
        updateGuestCartQuantity(item.product.id, newQuantity);
        loadGuestCartItems();
      }
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Cart updated");
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch (error) {
      logger.error("Error updating quantity:", error);
      toast.error("Failed to update cart");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string, isGuest?: boolean) => {
    if (isGuest) {
      const item = cartItems.find(i => i.id === itemId);
      if (item) {
        removeFromGuestCart(item.product.id);
        loadGuestCartItems();
      }
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Item removed from cart");
      window.dispatchEvent(new CustomEvent("cart-updated"));
    } catch (error) {
      logger.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const totalItems = userId 
    ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
    : guestCartCount;
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <DropdownMenu onOpenChange={(open) => open && !userId && loadGuestCartItems()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-cart-trigger>
          <CartIcon className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Shopping Cart</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {cartItems.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Your cart is empty
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="px-2 py-3 border-b border-border last:border-0">
                  <div className="flex items-start gap-3">
                    <img 
                      src={item.product.image_url || productBag} 
                      alt={item.product.name}
                      className="h-12 w-12 rounded object-cover bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-sm text-primary font-semibold">
                        ${item.product.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.isGuest)}
                          disabled={loading || item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.isGuest)}
                          disabled={loading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto text-destructive"
                          onClick={() => removeItem(item.id, item.isGuest)}
                          disabled={loading}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            
            <div className="px-2 py-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-primary">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
              <Button 
                className="w-full" 
                onClick={() => navigate('/cart')}
              >
                View Cart
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShoppingCart;
