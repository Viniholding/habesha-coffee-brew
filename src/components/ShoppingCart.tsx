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

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

interface ShoppingCartProps {
  userId: string | null;
}

const ShoppingCart = ({ userId }: ShoppingCartProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      fetchCartItems();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('cart-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchCartItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setCartItems([]);
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

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Cart updated");
    } catch (error) {
      logger.error("Error updating quantity:", error);
      toast.error("Failed to update cart");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      toast.success("Item removed from cart");
    } catch (error) {
      logger.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setLoading(false);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (!userId) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <a href="/auth">
          <CartIcon className="h-5 w-5" />
        </a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
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
                      src={item.product.image_url} 
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
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={loading || item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto text-destructive"
                          onClick={() => removeItem(item.id)}
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
                onClick={() => navigate("/checkout")}
              >
                Checkout
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShoppingCart;
