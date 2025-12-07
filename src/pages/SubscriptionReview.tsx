import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Coffee, Package, Calendar, DollarSign, Mail, ArrowLeft, 
  ArrowRight, AlertCircle, Gift, CreditCard, User, Tag, Check, X, Loader2
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

  // Coupon code state
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Gift recipient state
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftErrors, setGiftErrors] = useState<{ name?: string; email?: string }>({});

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
    if (!productData || !bagSizeData) return { perDelivery: 0, total: 0, discount: 0, deliveries: 1, couponDiscount: 0 };

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

    // Add coupon discount
    if (couponApplied) {
      discountPercent += couponApplied.discount;
    }

    const discountedPrice = basePrice * (1 - discountPercent / 100);
    const total = subscriptionType === "regular" ? discountedPrice : discountedPrice * totalDeliveries;
    const couponDiscount = couponApplied 
      ? basePrice * (couponApplied.discount / 100) * (subscriptionType === "regular" ? 1 : totalDeliveries)
      : 0;

    return {
      perDelivery: discountedPrice,
      total,
      discount: discountPercent,
      deliveries: totalDeliveries,
      couponDiscount,
    };
  };

  const pricing = calculatePrice();
  const nextBillingDate = addDays(new Date(), frequencyData?.days || 14);

  // Validate and apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      // Check referral codes first
      const { data: referral, error: referralError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referral_code", couponCode.toUpperCase())
        .eq("status", "pending")
        .maybeSingle();

      if (referral) {
        setCouponApplied({ 
          code: couponCode.toUpperCase(), 
          discount: referral.referee_discount_percent 
        });
        toast.success(`Referral code applied! ${referral.referee_discount_percent}% off`);
        setCouponCode("");
        return;
      }

      // Mock coupon validation (in production, validate against a coupons table)
      const mockCoupons: Record<string, number> = {
        "WELCOME10": 10,
        "COFFEE15": 15,
        "FIRST20": 20,
        "HABESHA25": 25,
      };

      const discount = mockCoupons[couponCode.toUpperCase()];
      if (discount) {
        setCouponApplied({ code: couponCode.toUpperCase(), discount });
        toast.success(`Coupon applied! ${discount}% off`);
        setCouponCode("");
      } else {
        setCouponError("Invalid or expired coupon code");
      }
    } catch (error) {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponError("");
  };

  // Validate gift recipient
  const validateGiftRecipient = (): boolean => {
    const errors: { name?: string; email?: string } = {};
    
    if (!giftRecipientName.trim()) {
      errors.name = "Recipient name is required";
    }
    
    if (!giftRecipientEmail.trim()) {
      errors.email = "Recipient email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(giftRecipientEmail)) {
      errors.email = "Please enter a valid email address";
    }
    
    setGiftErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

    // Validate gift recipient if gift subscription
    if (subscriptionType === "gift" && !validateGiftRecipient()) {
      toast.error("Please fill in the gift recipient details");
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
          giftRecipientName: subscriptionType === "gift" ? giftRecipientName : undefined,
          giftRecipientEmail: subscriptionType === "gift" ? giftRecipientEmail : undefined,
          giftMessage: subscriptionType === "gift" ? giftMessage : undefined,
          discountCode: couponApplied?.code,
          discountPercent: couponApplied?.discount,
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

                  {/* Gift Recipient Form */}
                  <AnimatePresence>
                    {subscriptionType === "gift" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg space-y-4">
                          <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5 text-pink-500" />
                            <h3 className="font-semibold text-pink-700 dark:text-pink-300">Gift Recipient Details</h3>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="recipientName">Recipient Name *</Label>
                              <Input
                                id="recipientName"
                                placeholder="Enter recipient's name"
                                value={giftRecipientName}
                                onChange={(e) => {
                                  setGiftRecipientName(e.target.value);
                                  if (giftErrors.name) setGiftErrors(prev => ({ ...prev, name: undefined }));
                                }}
                                className={giftErrors.name ? "border-destructive" : ""}
                              />
                              {giftErrors.name && (
                                <p className="text-xs text-destructive">{giftErrors.name}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="recipientEmail">Recipient Email *</Label>
                              <Input
                                id="recipientEmail"
                                type="email"
                                placeholder="Enter recipient's email"
                                value={giftRecipientEmail}
                                onChange={(e) => {
                                  setGiftRecipientEmail(e.target.value);
                                  if (giftErrors.email) setGiftErrors(prev => ({ ...prev, email: undefined }));
                                }}
                                className={giftErrors.email ? "border-destructive" : ""}
                              />
                              {giftErrors.email && (
                                <p className="text-xs text-destructive">{giftErrors.email}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="giftMessage">Personal Message (Optional)</Label>
                            <Textarea
                              id="giftMessage"
                              placeholder="Add a personal message to your gift..."
                              value={giftMessage}
                              onChange={(e) => setGiftMessage(e.target.value)}
                              rows={3}
                              maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground text-right">{giftMessage.length}/500</p>
                          </div>
                        </div>
                        <Separator />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Coupon Code */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Have a coupon code?</span>
                    </div>
                    
                    {couponApplied ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700 dark:text-green-300">
                            {couponApplied.code}
                          </span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {couponApplied.discount}% off
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCoupon}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setCouponError("");
                            }}
                            className={couponError ? "border-destructive" : ""}
                          />
                          {couponError && (
                            <p className="text-xs text-destructive mt-1">{couponError}</p>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                        >
                          {couponLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Pricing */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base price per delivery</span>
                      <span className="font-medium">
                        ${(productData.price * (bagSizeData?.priceMultiplier || 1) * quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Subscriber discount (10% off)</span>
                      <span>-${((productData.price * (bagSizeData?.priceMultiplier || 1) * quantity) * 0.1).toFixed(2)}</span>
                    </div>
                    {subscriptionType === "prepaid" && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Prepaid discount ({prepaidOptions.find(p => p.value === prepaidMonths)?.discount}% off)</span>
                        <span>-${((productData.price * (bagSizeData?.priceMultiplier || 1) * quantity) * ((prepaidOptions.find(p => p.value === prepaidMonths)?.discount || 0) / 100)).toFixed(2)}</span>
                      </div>
                    )}
                    {couponApplied && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Coupon ({couponApplied.code})</span>
                        <span>-${pricing.couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Price per delivery</span>
                      <span className="font-medium">${pricing.perDelivery.toFixed(2)}</span>
                    </div>
                    {subscriptionType !== "regular" && (
                      <div className="flex justify-between items-center text-muted-foreground text-sm">
                        <span>× {pricing.deliveries} deliveries</span>
                        <span></span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{subscriptionType === "regular" ? "Per Delivery" : "Total Due Today"}</span>
                      <span className="text-primary">${pricing.total.toFixed(2)}</span>
                    </div>
                    {subscriptionType !== "regular" && (
                      <p className="text-xs text-muted-foreground text-center">
                        One-time payment for {pricing.deliveries} deliveries
                      </p>
                    )}
                    <div className="flex justify-center">
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Total savings: {pricing.discount}% off
                      </Badge>
                    </div>
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
