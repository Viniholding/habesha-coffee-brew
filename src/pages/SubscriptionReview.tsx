import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Coffee, Package, Calendar, DollarSign, Mail, ArrowLeft, 
  ArrowRight, AlertCircle, Gift, CreditCard, User
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subscriptionProducts, bagSizeOptions, frequencyOptions, grindOptions } from "@/lib/subscriptionProducts";
import { addDays, format } from "date-fns";

const prepaidOptions = [
  { value: 3, discount: 5 },
  { value: 6, discount: 10 },
  { value: 12, discount: 15 },
];

const SubscriptionReview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Parse subscription data from URL params
  const productId = searchParams.get("product") || "";
  const grind = searchParams.get("grind") || "whole_bean";
  const bagSize = searchParams.get("bagSize") || "12oz";
  const quantity = parseInt(searchParams.get("quantity") || "1");
  const frequency = searchParams.get("frequency") || "biweekly";
  const subscriptionType = (searchParams.get("type") || "regular") as "regular" | "prepaid" | "gift";
  const prepaidMonths = parseInt(searchParams.get("prepaidMonths") || "6");
  const giftDuration = parseInt(searchParams.get("giftDuration") || "3");

  // Get data for display
  const productData = subscriptionProducts.find(p => p.id === productId);
  const bagSizeData = bagSizeOptions.find(b => b.value === bagSize);
  const frequencyData = frequencyOptions.find(f => f.value === frequency);
  const grindData = grindOptions.find(g => g.value === grind);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    setAuthChecking(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setAuthChecking(false);
  };

  // Redirect if no valid subscription data
  useEffect(() => {
    if (!productId || !productData) {
      toast.error("Please choose a subscription first");
      navigate("/subscribe");
    }
  }, [productId, productData, navigate]);

  // Calculate pricing
  const calculatePrice = () => {
    if (!productData || !bagSizeData) return { perDelivery: 0, total: 0, discount: 0, deliveries: 1 };

    const basePrice = productData.price * bagSizeData.priceMultiplier * quantity;
    let discountPercent = 10; // Base subscriber discount

    let totalDeliveries = 1;
    if (subscriptionType === "prepaid") {
      const prepaidOption = prepaidOptions.find(p => p.value === prepaidMonths);
      discountPercent += prepaidOption?.discount || 0;
      const daysPerDelivery = frequencyData?.days || 14;
      totalDeliveries = Math.floor((prepaidMonths * 30) / daysPerDelivery);
    } else if (subscriptionType === "gift") {
      const daysPerDelivery = frequencyData?.days || 14;
      totalDeliveries = Math.floor((giftDuration * 30) / daysPerDelivery);
    }

    const discountedPrice = basePrice * (1 - discountPercent / 100);
    const total = subscriptionType === "regular" ? discountedPrice : discountedPrice * totalDeliveries;

    return {
      perDelivery: discountedPrice,
      total,
      discount: discountPercent,
      deliveries: totalDeliveries,
    };
  };

  const pricing = calculatePrice();
  const nextBillingDate = addDays(new Date(), frequencyData?.days || 14);

  const handleEditSelection = () => {
    navigate("/subscribe?showQuiz=true");
  };

  const handleConfirmAndPay = async () => {
    if (!user) {
      // Save current URL params and redirect to auth
      const currentParams = searchParams.toString();
      navigate(`/auth?redirect=/subscription/review?${currentParams}`);
      return;
    }

    setLoading(true);
    
    try {
      // Create subscription via edge function
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          priceId: pricing.perDelivery.toFixed(2),
          productId: productData?.stripeProductId,
          productName: productData?.name,
          quantity,
          frequency,
          grind,
          bagSize,
          subscriptionType,
          isPrepaid: subscriptionType === "prepaid",
          prepaidMonths: subscriptionType === "prepaid" ? prepaidMonths : undefined,
          prepaidTotal: subscriptionType === "prepaid" ? pricing.total.toFixed(2) : undefined,
          isGift: subscriptionType === "gift",
          giftDuration: subscriptionType === "gift" ? giftDuration : undefined,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    const currentParams = searchParams.toString();
    navigate(`/auth?redirect=/subscription/review?${currentParams}`);
  };

  const handleCreateAccount = () => {
    const currentParams = searchParams.toString();
    navigate(`/auth?redirect=/subscription/review?${currentParams}&mode=signup`);
  };

  if (!productData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <Badge variant="outline" className="border-primary text-primary mb-4">
                Step 2 of 3
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Review Your Subscription</h1>
              <p className="text-muted-foreground">
                Confirm your selection before proceeding to payment
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Coffee className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{productData.name}</CardTitle>
                        <p className="text-muted-foreground text-sm">{productData.description}</p>
                      </div>
                    </div>
                    <Badge className={
                      subscriptionType === "prepaid" ? "bg-blue-500" :
                      subscriptionType === "gift" ? "bg-pink-500" : "bg-primary"
                    }>
                      {subscriptionType === "prepaid" ? "Prepaid" :
                       subscriptionType === "gift" ? "Gift" : "Regular"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Subscription Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Bag Size:</span>
                        <span className="font-medium">{bagSizeData?.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Coffee className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Grind:</span>
                        <span className="font-medium">{grindData?.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="font-medium">{quantity} bag{quantity > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Frequency:</span>
                        <span className="font-medium">{frequencyData?.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">First Delivery:</span>
                        <span className="font-medium">{format(nextBillingDate, "MMM d, yyyy")}</span>
                      </div>
                      {subscriptionType === "prepaid" && (
                        <div className="flex items-center gap-3 text-sm">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Prepaid:</span>
                          <span className="font-medium">{prepaidMonths} months ({pricing.deliveries} deliveries)</span>
                        </div>
                      )}
                      {subscriptionType === "gift" && (
                        <div className="flex items-center gap-3 text-sm">
                          <Gift className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">Gift Duration:</span>
                          <span className="font-medium">{giftDuration} months ({pricing.deliveries} deliveries)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price per delivery</span>
                      <span className="font-medium">${pricing.perDelivery.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Subscriber discount ({pricing.discount}% off)</span>
                      <span>-${((productData.price * (bagSizeData?.priceMultiplier || 1) * quantity) * (pricing.discount / 100)).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{subscriptionType === "regular" ? "Per Delivery" : "Total"}</span>
                      <span className="text-primary">${pricing.total.toFixed(2)}</span>
                    </div>
                    {subscriptionType !== "regular" && (
                      <p className="text-xs text-muted-foreground text-center">
                        One-time payment for {pricing.deliveries} deliveries
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Account Status */}
                  {authChecking ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                    </div>
                  ) : user ? (
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Mail className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          Signed in as {user.email}
                        </p>
                        <p className="text-sm text-green-600/80 dark:text-green-500/80">
                          This subscription will be linked to your account
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-700 dark:text-amber-400">
                            Account Required
                          </p>
                          <p className="text-sm text-amber-600/80 dark:text-amber-500/80">
                            Subscriptions require an account so you can manage deliveries and billing.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={handleLogin}>
                          <User className="h-4 w-4 mr-2" />
                          Log In
                        </Button>
                        <Button className="flex-1" onClick={handleCreateAccount}>
                          Create Account
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleEditSelection}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Edit Selection
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleConfirmAndPay}
                      disabled={loading || !user}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Confirm & Continue to Payment
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionReview;
