import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { getGuestCart, updateGuestCartQuantity, removeFromGuestCart, getGuestCartTotal, GuestCartItem } from "@/lib/guestCart";
import productBag from "@/assets/product-bag.jpg";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    description?: string | null;
  };
  isGuest?: boolean;
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadCart();
  }, []);

  const checkAuthAndLoadCart = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      setUserId(session.user.id);
      await fetchCartItems(session.user.id);
    } else {
      loadGuestCart();
    }
    setLoading(false);
  };

  const fetchCartItems = async (uid: string) => {
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
            image_url,
            description
          )
        `)
        .eq("user_id", uid);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      logger.error("Error fetching cart items:", error);
      toast.error("Failed to load cart");
    }
  };

  const loadGuestCart = () => {
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
  };

  const updateQuantity = async (itemId: string, newQuantity: number, isGuest?: boolean) => {
    if (newQuantity < 1) return;
    
    setUpdating(itemId);
    
    if (isGuest) {
      const item = cartItems.find(i => i.id === itemId);
      if (item) {
        updateGuestCartQuantity(item.product.id, newQuantity);
        loadGuestCart();
      }
      setUpdating(null);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;
      
      setCartItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
      toast.success("Cart updated");
    } catch (error) {
      logger.error("Error updating quantity:", error);
      toast.error("Failed to update cart");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string, isGuest?: boolean) => {
    setUpdating(itemId);
    
    if (isGuest) {
      const item = cartItems.find(i => i.id === itemId);
      if (item) {
        removeFromGuestCart(item.product.id);
        loadGuestCart();
      }
      setUpdating(null);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      
      setCartItems(prev => prev.filter(item => item.id !== itemId));
      toast.success("Item removed from cart");
    } catch (error) {
      logger.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 pb-16 container mx-auto px-4">
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/products")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <h1 className="text-4xl font-bold">Your Cart</h1>
          <p className="text-muted-foreground mt-2">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added any coffee to your cart yet.
            </p>
            <Button variant="hero" size="lg" onClick={() => navigate("/products")}>
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <img 
                      src={item.product.image_url || productBag} 
                      alt={item.product.name}
                      className="h-24 w-24 rounded-lg object-cover bg-muted flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{item.product.name}</h3>
                          <p className="text-primary font-bold text-lg">
                            ${item.product.price.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id, item.isGuest)}
                          disabled={updating === item.id}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3 border rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.isGuest)}
                            disabled={updating === item.id || item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.isGuest)}
                            disabled={updating === item.id}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="font-semibold text-lg">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                {shipping > 0 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full mt-6"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Secure checkout powered by Stripe
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
