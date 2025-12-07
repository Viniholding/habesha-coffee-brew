import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ShoppingBag, 
  User, 
  LogIn, 
  UserPlus, 
  Trash2, 
  ArrowLeft,
  CreditCard,
  Coffee,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import SubscriptionRequiredModal from "@/components/checkout/SubscriptionRequiredModal";
import { CoffeeBeanLoading } from "@/components/ui/CoffeeBeanSpinner";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string | null;
  };
}

const Checkout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutMode, setCheckoutMode] = useState<"guest" | "login" | "signup">("guest");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Guest checkout form
  const [guestEmail, setGuestEmail] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");

  useEffect(() => {
    checkAuth();
    fetchCartItems();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const fetchCartItems = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

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
            category
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if cart has subscription items
  const hasSubscriptionItems = cartItems.some(
    item => item.product.category?.toLowerCase() === "subscription"
  );

  // Check if cart has only regular items
  const hasOnlyRegularItems = cartItems.length > 0 && !hasSubscriptionItems;

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const removeItem = async (itemId: string) => {
    try {
      await supabase.from("cart_items").delete().eq("id", itemId);
      setCartItems(items => items.filter(i => i.id !== itemId));
      toast.success("Item removed");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const removeSubscriptionItems = async () => {
    const subscriptionItems = cartItems.filter(
      item => item.product.category?.toLowerCase() === "subscription"
    );
    
    for (const item of subscriptionItems) {
      await removeItem(item.id);
    }
    
    setShowSubscriptionModal(false);
    toast.success("Subscription items removed from cart");
  };

  const handleGuestCheckout = () => {
    if (hasSubscriptionItems) {
      setShowSubscriptionModal(true);
      return;
    }
    setCheckoutMode("guest");
  };

  const handleProceedToPayment = async () => {
    if (!user && hasSubscriptionItems) {
      setShowSubscriptionModal(true);
      return;
    }

    if (!user && checkoutMode === "guest") {
      if (!guestEmail || !guestFirstName || !guestLastName) {
        toast.error("Please fill in all required fields");
        return;
      }
    }

    setProcessingCheckout(true);
    try {
      // Here you would integrate with Stripe checkout
      toast.success("Redirecting to payment...");
      // For now, simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Order placed successfully!");
      navigate("/");
    } catch (error) {
      toast.error("Checkout failed");
    } finally {
      setProcessingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <CoffeeBeanLoading message="Loading your cart..." />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some delicious coffee to get started
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate("/products")}>
              Browse Products
            </Button>
            <Button variant="outline" onClick={() => navigate("/subscribe")}>
              Start Subscription
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Options */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-bold">Checkout</h1>

            {/* Subscription Notice */}
            {hasSubscriptionItems && !user && (
              <Card className="border-primary bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <RefreshCw className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary">
                        Subscription items require an account
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create an account to manage your subscription deliveries, update billing, 
                        and pause or modify your plan anytime.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Checkout Options for Non-Logged Users */}
            {!user && (
              <Card>
                <CardHeader>
                  <CardTitle>How would you like to checkout?</CardTitle>
                  <CardDescription>
                    {hasSubscriptionItems
                      ? "Subscriptions require an account for delivery management"
                      : "Continue as a guest or create an account for order tracking"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={checkoutMode}
                    onValueChange={(v) => setCheckoutMode(v as any)}
                    className="space-y-4"
                  >
                    {/* Guest Option - Only for non-subscription */}
                    {!hasSubscriptionItems && (
                      <div
                        className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          checkoutMode === "guest"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setCheckoutMode("guest")}
                      >
                        <RadioGroupItem value="guest" id="guest" />
                        <Label htmlFor="guest" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Continue as Guest</p>
                              <p className="text-sm text-muted-foreground">
                                Quick checkout without creating an account
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )}

                    {/* Login Option */}
                    <div
                      className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        checkoutMode === "login"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setCheckoutMode("login")}
                    >
                      <RadioGroupItem value="login" id="login" />
                      <Label htmlFor="login" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <LogIn className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Log In</p>
                            <p className="text-sm text-muted-foreground">
                              Use your existing account
                            </p>
                          </div>
                        </div>
                      </Label>
                      {hasSubscriptionItems && (
                        <Badge variant="secondary">Recommended</Badge>
                      )}
                    </div>

                    {/* Signup Option */}
                    <div
                      className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        checkoutMode === "signup"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setCheckoutMode("signup")}
                    >
                      <RadioGroupItem value="signup" id="signup" />
                      <Label htmlFor="signup" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <UserPlus className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Create Account</p>
                            <p className="text-sm text-muted-foreground">
                              Track orders, manage subscriptions, earn rewards
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Auth Buttons */}
                  {(checkoutMode === "login" || checkoutMode === "signup") && (
                    <div className="mt-6">
                      <Button
                        className="w-full"
                        onClick={() =>
                          navigate(`/auth?redirect=/checkout&mode=${checkoutMode}`)
                        }
                      >
                        {checkoutMode === "login" ? "Continue to Login" : "Continue to Sign Up"}
                      </Button>
                    </div>
                  )}

                  {/* Guest Form */}
                  {checkoutMode === "guest" && !hasSubscriptionItems && (
                    <div className="mt-6 space-y-4">
                      <Separator />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            value={guestFirstName}
                            onChange={(e) => setGuestFirstName(e.target.value)}
                            placeholder="John"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            value={guestLastName}
                            onChange={(e) => setGuestLastName(e.target.value)}
                            placeholder="Smith"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Logged-in User Info */}
            {user && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Logged in as {user.email}
                  </CardTitle>
                </CardHeader>
              </Card>
            )}

            {/* Payment Section - Show when ready */}
            {(user || (checkoutMode === "guest" && !hasSubscriptionItems)) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                  <CardDescription>
                    Secure checkout powered by Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleProceedToPayment}
                    disabled={processingCheckout}
                  >
                    {processingCheckout ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay ${totalPrice.toFixed(2)}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-md object-cover bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm truncate">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                          </p>
                          {item.product.category?.toLowerCase() === "subscription" && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Subscription
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold text-primary mt-1">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-primary">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {hasSubscriptionItems && (
                  <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                    <Coffee className="h-4 w-4 inline mr-1" />
                    Subscription items will be billed according to their delivery schedule.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SubscriptionRequiredModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        onRemoveSubscriptions={removeSubscriptionItems}
      />

      <Footer />
    </div>
  );
};

export default Checkout;
