import { useState, useEffect, useMemo, useCallback } from "react";
import { logger } from "@/lib/logger";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Coffee, Package, Calendar as CalendarIcon, DollarSign, Mail, ArrowLeft, 
  ArrowRight, AlertCircle, Gift, CreditCard, User, Tag, Check, X, Loader2,
  Minus, Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subscriptionProducts, bagSizeOptions, frequencyOptions, grindOptions } from "@/lib/subscriptionProducts";
import { addDays, format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { logCouponAction, isAccountRestricted } from "@/lib/couponAudit";

const prepaidOptions = [
  { value: 3, discount: 5 },
  { value: 6, discount: 10 },
  { value: 12, discount: 15 },
];

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 10;
const MIN_FULFILLMENT_DAYS = 3; // Minimum days before first delivery

const SubscriptionReview = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Editable subscription options
  const [selectedBagSize, setSelectedBagSize] = useState(searchParams.get("bagSize") || "12oz");
  const [selectedGrind, setSelectedGrind] = useState(searchParams.get("grind") || "whole_bean");
  const [selectedQuantity, setSelectedQuantity] = useState(parseInt(searchParams.get("quantity") || "1"));
  const [selectedFrequency, setSelectedFrequency] = useState(searchParams.get("frequency") || "biweekly");
  const [selectedFirstDelivery, setSelectedFirstDelivery] = useState<Date>(() => {
    const paramDate = searchParams.get("firstDelivery");
    if (paramDate) {
      const parsed = new Date(paramDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return addDays(new Date(), MIN_FULFILLMENT_DAYS);
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

  // Editable product selection
  const [selectedProductId, setSelectedProductId] = useState(searchParams.get("product") || "");
  const [productImageError, setProductImageError] = useState(false);
  
  // Parse subscription data from URL params
  const subscriptionType = (searchParams.get("type") || "regular") as "regular" | "prepaid" | "gift";
  const prepaidMonths = parseInt(searchParams.get("prepaidMonths") || "6");
  const giftDuration = parseInt(searchParams.get("giftDuration") || "3");

  // Get data for display
  const productData = subscriptionProducts.find(p => p.id === selectedProductId);
  const bagSizeData = bagSizeOptions.find(b => b.value === selectedBagSize);
  const frequencyData = frequencyOptions.find(f => f.value === selectedFrequency);
  const grindData = grindOptions.find(g => g.value === selectedGrind);

  // Minimum delivery date
  const minDeliveryDate = useMemo(() => addDays(startOfDay(new Date()), MIN_FULFILLMENT_DAYS), []);

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
    if (!selectedProductId || !productData) {
      toast.error("Please choose a subscription first");
      navigate("/subscribe");
    }
  }, [selectedProductId, productData, navigate]);

  // Sync URL params when selections change
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("product", selectedProductId);
    newParams.set("bagSize", selectedBagSize);
    newParams.set("grind", selectedGrind);
    newParams.set("quantity", selectedQuantity.toString());
    newParams.set("frequency", selectedFrequency);
    newParams.set("firstDelivery", format(selectedFirstDelivery, "yyyy-MM-dd"));
    setSearchParams(newParams, { replace: true });
  }, [selectedProductId, selectedBagSize, selectedGrind, selectedQuantity, selectedFrequency, selectedFirstDelivery]);

  // Calculate pricing
  const calculatePrice = () => {
    if (!productData || !bagSizeData) return { perDelivery: 0, total: 0, discount: 0, deliveries: 1, couponDiscount: 0, monthlyEstimate: 0 };

    const basePrice = productData.price * bagSizeData.priceMultiplier * selectedQuantity;
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

    // Calculate monthly estimate based on frequency
    const daysPerDelivery = frequencyData?.days || 14;
    const deliveriesPerMonth = 30 / daysPerDelivery;
    const monthlyEstimate = discountedPrice * deliveriesPerMonth;

    return {
      perDelivery: discountedPrice,
      total,
      discount: discountPercent,
      deliveries: totalDeliveries,
      couponDiscount,
      monthlyEstimate,
    };
  };

  const pricing = calculatePrice();

  // Validate and apply coupon from database
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      // Check if account is restricted from promotional pricing
      if (user) {
        const restricted = await isAccountRestricted(user.id);
        if (restricted) {
          setCouponError("Your account is not eligible for promotional pricing");
          await logCouponAction({
            userId: user.id,
            couponCode: couponCode.toUpperCase(),
            action: 'rejected',
            reasonCode: 'account_restricted',
          });
          setCouponLoading(false);
          return;
        }
      }

      // Check referral codes first
      const { data: referral } = await supabase
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
        if (user) {
          await logCouponAction({
            userId: user.id,
            couponCode: couponCode.toUpperCase(),
            action: 'applied',
            reasonCode: 'success',
            discountAmount: referral.referee_discount_percent,
            metadata: { type: 'referral' },
          });
        }
        toast.success(`Referral code applied! ${referral.referee_discount_percent}% off`);
        setCouponCode("");
        return;
      }

      // Check promotions table for valid coupon
      const { data: promotion, error: promoError } = await supabase
        .from("promotions")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promoError) {
        throw promoError;
      }

      if (!promotion) {
        setCouponError("Invalid coupon code");
        if (user) {
          await logCouponAction({
            userId: user.id,
            couponCode: couponCode.toUpperCase(),
            action: 'rejected',
            reasonCode: 'invalid_code',
          });
        }
        setCouponLoading(false);
        return;
      }

      // Check expiration
      if (promotion.expires_at && new Date(promotion.expires_at) < new Date()) {
        setCouponError("This coupon has expired");
        if (user) {
          await logCouponAction({
            userId: user.id,
            couponCode: couponCode.toUpperCase(),
            action: 'rejected',
            reasonCode: 'expired',
            promotionId: promotion.id,
          });
        }
        setCouponLoading(false);
        return;
      }

      // Check if not started yet
      if (promotion.starts_at && new Date(promotion.starts_at) > new Date()) {
        setCouponError("This coupon is not yet active");
        if (user) {
          await logCouponAction({
            userId: user.id,
            couponCode: couponCode.toUpperCase(),
            action: 'rejected',
            reasonCode: 'not_started',
            promotionId: promotion.id,
          });
        }
        setCouponLoading(false);
        return;
      }

      // Check usage limit
      if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) {
        setCouponError("This coupon has reached its usage limit");
        if (user) {
          await logCouponAction({
            userId: user.id,
            couponCode: couponCode.toUpperCase(),
            action: 'rejected',
            reasonCode: 'max_uses_exceeded',
            promotionId: promotion.id,
          });
        }
        setCouponLoading(false);
        return;
      }

      // Check if applies to subscription - must be explicitly eligible
      if (!promotion.is_subscription_eligible) {
        setCouponError("This coupon cannot be applied to subscription orders");
        if (user) {
          await logCouponAction({
            userId: user.id,
            couponCode: couponCode.toUpperCase(),
            action: 'rejected',
            reasonCode: 'not_subscription_eligible',
            promotionId: promotion.id,
          });
        }
        setCouponLoading(false);
        return;
      }

      // Check if user already used this coupon (max_uses_per_user check)
      if (user && promotion.max_uses_per_user) {
        const { data: existingUses } = await supabase
          .from("promotion_uses")
          .select("id")
          .eq("promotion_id", promotion.id)
          .eq("user_id", user.id);

        if (existingUses && existingUses.length >= promotion.max_uses_per_user) {
          setCouponError("This coupon has already been used");
          await logCouponAction({
            userId: user.id,
            couponCode: couponCode.toUpperCase(),
            action: 'rejected',
            reasonCode: 'already_used',
            promotionId: promotion.id,
          });
          setCouponLoading(false);
          return;
        }
      }

      // Apply discount
      const discountValue = promotion.discount_type === "percentage" 
        ? promotion.discount_value 
        : promotion.discount_value;

      setCouponApplied({ 
        code: couponCode.toUpperCase(), 
        discount: discountValue,
      });
      
      if (user) {
        await logCouponAction({
          userId: user.id,
          couponCode: couponCode.toUpperCase(),
          action: 'applied',
          reasonCode: 'success',
          promotionId: promotion.id,
          discountAmount: discountValue,
        });
      }
      
      toast.success(`Coupon applied! ${promotion.discount_type === "percentage" ? `${discountValue}%` : `$${discountValue}`} off`);
      setCouponCode("");
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

  // Validate all fields
  const validateFields = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!selectedProductId) {
      errors.product = "Please select a coffee product";
    }
    if (!selectedBagSize) {
      errors.bagSize = "Please select a bag size";
    }
    if (!selectedGrind) {
      errors.grind = "Please select a grind type";
    }
    if (selectedQuantity < MIN_QUANTITY || selectedQuantity > MAX_QUANTITY) {
      errors.quantity = `Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}`;
    }
    if (!selectedFrequency) {
      errors.frequency = "Please select a delivery frequency";
    }
    if (!selectedFirstDelivery) {
      errors.firstDelivery = "Please select a first delivery date";
    } else if (isBefore(selectedFirstDelivery, minDeliveryDate)) {
      errors.firstDelivery = `First delivery must be at least ${MIN_FULFILLMENT_DAYS} days from today`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSelection = () => {
    navigate("/subscribe?showQuiz=true");
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = selectedQuantity + delta;
    if (newQuantity >= MIN_QUANTITY && newQuantity <= MAX_QUANTITY) {
      setSelectedQuantity(newQuantity);
      setValidationErrors(prev => ({ ...prev, quantity: "" }));
    }
  };

  const handleConfirmAndPay = async () => {
    if (!user) {
      const currentParams = searchParams.toString();
      navigate(`/auth?redirect=/subscription/review?${currentParams}`);
      return;
    }

    // Validate all fields
    if (!validateFields()) {
      toast.error("Please fill in all required fields correctly");
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
          internalProductId: selectedProductId,
          quantity: selectedQuantity,
          frequency: selectedFrequency,
          grind: selectedGrind,
          bagSize: selectedBagSize,
          firstDeliveryDate: format(selectedFirstDelivery, "yyyy-MM-dd"),
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
      logger.error("Subscription error:", error);
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

  // Live summary text
  const summaryText = `You'll get ${selectedQuantity} × ${bagSizeData?.label || selectedBagSize} bag${selectedQuantity > 1 ? "s" : ""} of ${grindData?.label || selectedGrind} every ${frequencyData?.label.replace("Every ", "").toLowerCase() || selectedFrequency} starting ${format(selectedFirstDelivery, "MMM d, yyyy")}`;

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
                Customize your selection before proceeding to payment
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-primary/10 flex-shrink-0">
                        {productData?.imageUrl && !productImageError ? (
                          <img 
                            src={productData.imageUrl} 
                            alt={productData.name}
                            className="w-full h-full object-cover"
                            onError={() => setProductImageError(true)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Coffee className="h-8 w-8 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="space-y-2">
                          <Label htmlFor="product" className="text-sm text-muted-foreground">Coffee Selection</Label>
                          <Select
                            value={selectedProductId}
                            onValueChange={(value) => {
                              setSelectedProductId(value);
                              setValidationErrors(prev => ({ ...prev, product: "" }));
                            }}
                          >
                            <SelectTrigger id="product" className={cn("w-full md:w-[300px]", validationErrors.product ? "border-destructive" : "")}>
                              <SelectValue placeholder="Select coffee" />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              {subscriptionProducts.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-primary/10 flex-shrink-0 overflow-hidden">
                                      {product.imageUrl ? (
                                        <img 
                                          src={product.imageUrl} 
                                          alt={product.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Coffee className="h-4 w-4 text-primary" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-start">
                                      <span className="font-medium">{product.name}</span>
                                      <span className="text-xs text-muted-foreground">${product.price.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {validationErrors.product && (
                            <p className="text-xs text-destructive">{validationErrors.product}</p>
                          )}
                        </div>
                        {productData && (
                          <p className="text-muted-foreground text-sm mt-2">{productData.description}</p>
                        )}
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
                  {/* Editable Subscription Details */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Bag Size */}
                    <div className="space-y-2">
                      <Label htmlFor="bagSize" className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Bag Size
                      </Label>
                      <Select
                        value={selectedBagSize}
                        onValueChange={(value) => {
                          setSelectedBagSize(value);
                          setValidationErrors(prev => ({ ...prev, bagSize: "" }));
                        }}
                      >
                        <SelectTrigger id="bagSize" className={validationErrors.bagSize ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select bag size" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {bagSizeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.bagSize && (
                        <p className="text-xs text-destructive">{validationErrors.bagSize}</p>
                      )}
                    </div>

                    {/* Grind */}
                    <div className="space-y-2">
                      <Label htmlFor="grind" className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-primary" />
                        Grind Type
                      </Label>
                      <Select
                        value={selectedGrind}
                        onValueChange={(value) => {
                          setSelectedGrind(value);
                          setValidationErrors(prev => ({ ...prev, grind: "" }));
                        }}
                      >
                        <SelectTrigger id="grind" className={validationErrors.grind ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select grind type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {grindOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.grind && (
                        <p className="text-xs text-destructive">{validationErrors.grind}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Quantity
                      </Label>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={selectedQuantity <= MIN_QUANTITY}
                          className="h-10 w-10"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="text-lg font-semibold">{selectedQuantity} bag{selectedQuantity > 1 ? "s" : ""}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(1)}
                          disabled={selectedQuantity >= MAX_QUANTITY}
                          className="h-10 w-10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {validationErrors.quantity && (
                        <p className="text-xs text-destructive">{validationErrors.quantity}</p>
                      )}
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                      <Label htmlFor="frequency" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        Delivery Frequency
                      </Label>
                      <Select
                        value={selectedFrequency}
                        onValueChange={(value) => {
                          setSelectedFrequency(value);
                          setValidationErrors(prev => ({ ...prev, frequency: "" }));
                        }}
                      >
                        <SelectTrigger id="frequency" className={validationErrors.frequency ? "border-destructive" : ""}>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {frequencyOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.frequency && (
                        <p className="text-xs text-destructive">{validationErrors.frequency}</p>
                      )}
                    </div>

                    {/* First Delivery Date */}
                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-primary" />
                        First Delivery Date
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedFirstDelivery && "text-muted-foreground",
                              validationErrors.firstDelivery && "border-destructive"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedFirstDelivery ? format(selectedFirstDelivery, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedFirstDelivery}
                            onSelect={(date) => {
                              if (date) {
                                setSelectedFirstDelivery(date);
                                setValidationErrors(prev => ({ ...prev, firstDelivery: "" }));
                              }
                            }}
                            disabled={(date) => isBefore(date, minDeliveryDate)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      {validationErrors.firstDelivery && (
                        <p className="text-xs text-destructive">{validationErrors.firstDelivery}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Earliest available: {format(minDeliveryDate, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  {/* Prepaid/Gift Info */}
                  {subscriptionType === "prepaid" && (
                    <div className="flex items-center gap-3 text-sm p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">Prepaid:</span>
                      <span className="font-medium">{prepaidMonths} months ({pricing.deliveries} deliveries)</span>
                    </div>
                  )}
                  {subscriptionType === "gift" && (
                    <div className="flex items-center gap-3 text-sm p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                      <Gift className="h-4 w-4 text-pink-500" />
                      <span className="text-muted-foreground">Gift Duration:</span>
                      <span className="font-medium">{giftDuration} months ({pricing.deliveries} deliveries)</span>
                    </div>
                  )}

                  <Separator />

                  {/* Live Summary */}
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-sm font-medium text-primary">{summaryText}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Estimated monthly cost: ${pricing.monthlyEstimate.toFixed(2)}
                    </p>
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

                  {/* Coupon Code - Hidden for regular subscriptions by default */}
                  {subscriptionType !== "regular" ? (
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
                  ) : (
                    <div className="p-3 bg-muted/50 border border-border rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Subscription pricing already includes a 10% discount. Coupons cannot be combined with subscription discounts.</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Pricing */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base price per delivery</span>
                      <span className="font-medium">
                        ${(productData.price * (bagSizeData?.priceMultiplier || 1) * selectedQuantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-green-600">
                      <span>Subscriber discount (10% off)</span>
                      <span>-${((productData.price * (bagSizeData?.priceMultiplier || 1) * selectedQuantity) * 0.1).toFixed(2)}</span>
                    </div>
                    {subscriptionType === "prepaid" && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Prepaid discount ({prepaidOptions.find(p => p.value === prepaidMonths)?.discount}% off)</span>
                        <span>-${((productData.price * (bagSizeData?.priceMultiplier || 1) * selectedQuantity) * ((prepaidOptions.find(p => p.value === prepaidMonths)?.discount || 0) / 100)).toFixed(2)}</span>
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

                  {/* Subscription Discount Disclosure */}
                  {subscriptionType === "regular" && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Subscription Discount Terms
                          </p>
                          <p className="text-amber-700 dark:text-amber-300">
                            You're receiving a discounted subscription price. If the subscription is canceled 
                            before the second delivery, the discount applied to the first order may be charged back. 
                            See our <a href="/terms-of-use#subscription-terms" className="underline hover:no-underline">Terms of Use</a> for details.
                          </p>
                        </div>
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