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
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingBag, 
  User, 
  LogIn, 
  UserPlus, 
  Trash2, 
  ArrowLeft,
  CreditCard,
  Coffee,
  RefreshCw,
  MapPin,
  Check,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import SubscriptionRequiredModal from "@/components/checkout/SubscriptionRequiredModal";
import CheckoutAddressForm from "@/components/checkout/CheckoutAddressForm";
import CheckoutPaymentForm from "@/components/checkout/CheckoutPaymentForm";
import { CoffeeBeanLoading } from "@/components/ui/CoffeeBeanSpinner";
import { motion, AnimatePresence } from "framer-motion";

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

const checkoutSteps = [
  { id: 1, label: "Account", icon: User },
  { id: 2, label: "Shipping", icon: MapPin },
  { id: 3, label: "Payment", icon: CreditCard },
];

const Checkout = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [checkoutMode, setCheckoutMode] = useState<"guest" | "login" | "signup">("guest");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Guest checkout form
  const [guestEmail, setGuestEmail] = useState("");
  const [guestFirstName, setGuestFirstName] = useState("");
  const [guestLastName, setGuestLastName] = useState("");

  // Address state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [guestAddress, setGuestAddress] = useState<any>(null);

  // Payment state
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiry: "",
    cvc: "",
    nameOnCard: "",
  });

  useEffect(() => {
    checkAuth();
    fetchCartItems();
  }, []);

  useEffect(() => {
    // Auto-advance to step 2 if user is logged in
    if (user && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [user]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      setCurrentStep(2);
    }
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

  const hasSubscriptionItems = cartItems.some(
    item => item.product.category?.toLowerCase() === "subscription"
  );

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

  const canProceedToNext = () => {
    if (currentStep === 1) {
      if (user) return true;
      if (checkoutMode === "guest" && !hasSubscriptionItems) {
        return guestEmail && guestFirstName && guestLastName;
      }
      return false;
    }
    if (currentStep === 2) {
      return user ? !!selectedAddressId : isGuestAddressValid();
    }
    if (currentStep === 3) {
      return isPaymentValid();
    }
    return false;
  };

  const isGuestAddressValid = () => {
    if (!guestAddress) return false;
    const { full_name, address_line1, city, state, postal_code } = guestAddress;
    return full_name && address_line1 && city && state && postal_code;
  };

  const isPaymentValid = () => {
    const { cardNumber, expiry, cvc, nameOnCard } = paymentData;
    return (
      cardNumber.replace(/\s/g, "").length >= 15 &&
      expiry.length === 5 &&
      cvc.length >= 3 &&
      nameOnCard.length > 0
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !user && hasSubscriptionItems) {
      setShowSubscriptionModal(true);
      return;
    }
    
    if (canProceedToNext() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      // Don't go back to step 1 if user is logged in
      if (currentStep === 2 && user) {
        navigate(-1);
      } else {
        setCurrentStep(currentStep - 1);
      }
    } else {
      navigate(-1);
    }
  };

  const handlePlaceOrder = async () => {
    if (!canProceedToNext()) {
      toast.error("Please complete all required fields");
      return;
    }

    setProcessingCheckout(true);
    try {
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear cart after successful order
      if (user) {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
      }

      // Navigate to success page
      const hasSubscription = hasSubscriptionItems;
      const successUrl = hasSubscription 
        ? "/order-success?subscription=demo-sub-id"
        : "/order-success?order=demo-order-id";
      
      navigate(successUrl);
    } catch (error) {
      toast.error("Order failed. Please try again.");
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

  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6 gap-2"
          onClick={handlePreviousStep}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Progress Steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-4">
            {checkoutSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 ${
                    currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep > step.id
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {step.label}
                  </span>
                </div>
                {index < checkoutSteps.length - 1 && (
                  <ChevronRight className="h-5 w-5 mx-4 text-muted-foreground hidden sm:block" />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Checkout Steps */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Account */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h1 className="text-3xl font-bold mb-6">Checkout</h1>

                  {/* Subscription Notice */}
                  {hasSubscriptionItems && (
                    <Card className="border-primary bg-primary/5 mb-6">
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
                              Create an account to manage your subscription deliveries, 
                              update billing, and pause or modify your plan anytime.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
                        {/* Guest Option */}
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
                </motion.div>
              )}

              {/* Step 2: Shipping Address */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CheckoutAddressForm
                    userId={user?.id}
                    selectedAddressId={selectedAddressId}
                    onAddressSelect={(id, data) => {
                      setSelectedAddressId(id);
                      if (data) setGuestAddress(data);
                    }}
                    guestMode={!user}
                  />
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CheckoutPaymentForm
                    paymentData={paymentData}
                    onPaymentDataChange={setPaymentData}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedToNext()}
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handlePlaceOrder}
                  disabled={!canProceedToNext() || processingCheckout}
                  className="gap-2"
                >
                  {processingCheckout ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Place Order - ${totalPrice.toFixed(2)}
                    </>
                  )}
                </Button>
              )}
            </div>
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
