import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, Gift, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { subscriptionProducts, grindOptions, bagSizeOptions, frequencyOptions } from "@/lib/subscriptionProducts";
import CoffeeQuiz from "./CoffeeQuiz";
import SubscriptionSummary from "./SubscriptionSummary";

interface SubscriptionConfiguratorProps {
  initialProgram?: string | null;
}

const prepaidOptions = [
  { value: "3", label: "3 Months", discount: 5, badge: null },
  { value: "6", label: "6 Months", discount: 10, badge: "Popular" },
  { value: "12", label: "12 Months", discount: 15, badge: "Best Value" },
];

// Map flavor profiles to products
const flavorProductMap: Record<string, string> = {
  bold: "sidamo-dark-roast",
  bright: "ethiopian-yirgacheffe",
  balanced: "harar-heritage-blend",
};

const SubscriptionConfigurator = ({ initialProgram }: SubscriptionConfiguratorProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subscriptionType, setSubscriptionType] = useState<"regular" | "prepaid" | "gift">("regular");
  const [quizComplete, setQuizComplete] = useState(false);

  // Configuration state
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [grind, setGrind] = useState("whole_bean");
  const [bagSize, setBagSize] = useState("12oz");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState("biweekly");
  const [couponCode, setCouponCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [referralApplied, setReferralApplied] = useState(false);

  // Prepaid state
  const [prepaidMonths, setPrepaidMonths] = useState("6");

  // Gift state
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftDuration, setGiftDuration] = useState("3");

  useEffect(() => {
    checkUser();
    const refCode = searchParams.get("ref");
    if (refCode) {
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const validateReferralCode = async (code: string) => {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referral_code", code)
        .eq("status", "pending")
        .single();

      if (error || !data) return;

      setReferralCode(code);
      setReferralDiscount(data.referee_discount_percent || 15);
      setReferralApplied(true);
      toast.success(`Referral code applied! You get ${data.referee_discount_percent || 15}% off your first order`);
    } catch (error) {
      console.error("Error validating referral code:", error);
    }
  };

  const handleQuizComplete = (selections: {
    flavorProfile: string;
    brewMethod: string;
    grind: string;
    quantity: number;
    frequency: string;
  }) => {
    setSelectedProduct(flavorProductMap[selections.flavorProfile] || "");
    setGrind(selections.grind);
    setQuantity(selections.quantity);
    setFrequency(selections.frequency);
    setQuizComplete(true);
  };

  const selectedProductData = subscriptionProducts.find(p => p.id === selectedProduct);
  const bagSizeData = bagSizeOptions.find(b => b.value === bagSize);
  const frequencyData = frequencyOptions.find(f => f.value === frequency);

  const calculatePrice = () => {
    if (!selectedProductData || !bagSizeData) return { perDelivery: "0", total: "0" };

    const basePrice = selectedProductData.price * bagSizeData.priceMultiplier * quantity;
    let discountPercent = 10;

    if (referralApplied) {
      discountPercent += referralDiscount;
    }

    let totalDeliveries = 1;
    if (subscriptionType === "prepaid") {
      const prepaidOption = prepaidOptions.find(p => p.value === prepaidMonths);
      discountPercent += prepaidOption?.discount || 0;
      const daysPerDelivery = frequencyData?.days || 14;
      totalDeliveries = Math.floor((parseInt(prepaidMonths) * 30) / daysPerDelivery);
    } else if (subscriptionType === "gift") {
      const months = parseInt(giftDuration);
      const daysPerDelivery = frequencyData?.days || 14;
      totalDeliveries = Math.floor((months * 30) / daysPerDelivery);
    }

    const discountedPrice = basePrice * (1 - discountPercent / 100);
    const total = discountedPrice * totalDeliveries;

    return {
      perDelivery: discountedPrice.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const pricing = calculatePrice();

  const handleSubscribe = async () => {
    if (!user) {
      toast.error("Please sign in to subscribe");
      navigate("/auth?redirect=/subscribe");
      return;
    }

    if (!selectedProduct) {
      toast.error("Please complete the quiz to select a coffee");
      return;
    }

    if (subscriptionType === "gift" && (!giftRecipientEmail || !giftRecipientName)) {
      toast.error("Please fill in recipient details");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          priceId: pricing.perDelivery,
          productId: selectedProductData?.stripeProductId,
          productName: selectedProductData?.name,
          quantity,
          frequency,
          grind,
          bagSize,
          couponCode: couponCode || undefined,
          referralCode: referralApplied ? referralCode : undefined,
          subscriptionType,
          isPrepaid: subscriptionType === "prepaid",
          prepaidMonths: subscriptionType === "prepaid" ? parseInt(prepaidMonths) : undefined,
          prepaidTotal: subscriptionType === "prepaid" ? pricing.total : undefined,
          isGift: subscriptionType === "gift",
          giftRecipientName: subscriptionType === "gift" ? giftRecipientName : undefined,
          giftRecipientEmail: subscriptionType === "gift" ? giftRecipientEmail : undefined,
          giftMessage: subscriptionType === "gift" ? giftMessage : undefined,
          giftDuration: subscriptionType === "gift" ? parseInt(giftDuration) : undefined,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            Build Your Subscription
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Customize Your Experience
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Answer a few quick questions and we'll craft the perfect subscription for you
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Subscription Type Tabs */}
          <Tabs value={subscriptionType} onValueChange={(v) => setSubscriptionType(v as any)} className="mb-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="regular" className="flex items-center gap-2">
                <Coffee className="h-4 w-4" />
                Regular
              </TabsTrigger>
              <TabsTrigger value="prepaid" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Prepaid
              </TabsTrigger>
              <TabsTrigger value="gift" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Gift
              </TabsTrigger>
            </TabsList>

            <TabsContent value="prepaid" className="mt-6">
              <Card className="max-w-2xl mx-auto border-primary/30 bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Prepaid Subscription
                  </CardTitle>
                  <CardDescription>
                    Pay upfront and save more! Lock in your subscription for 3, 6, or 12 months.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={prepaidMonths} onValueChange={setPrepaidMonths} className="grid grid-cols-3 gap-4">
                    {prepaidOptions.map((option) => (
                      <div key={option.value} className="relative">
                        <RadioGroupItem value={option.value} id={`prepaid-${option.value}`} className="peer sr-only" />
                        <Label
                          htmlFor={`prepaid-${option.value}`}
                          className="flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 hover:border-primary/50"
                        >
                          {option.badge && (
                            <Badge className="absolute -top-2 bg-primary text-xs">{option.badge}</Badge>
                          )}
                          <span className="font-bold text-lg">{option.label}</span>
                          <span className="text-primary font-medium">Save {option.discount}%</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gift" className="mt-6">
              <Card className="max-w-2xl mx-auto border-primary/30 bg-gradient-to-br from-card to-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Gift Subscription
                  </CardTitle>
                  <CardDescription>
                    Give the gift of great coffee! The recipient will receive an email notification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recipient Name *</Label>
                      <Input
                        placeholder="John Smith"
                        value={giftRecipientName}
                        onChange={(e) => setGiftRecipientName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Recipient Email *</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={giftRecipientEmail}
                        onChange={(e) => setGiftRecipientEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Gift Message (optional)</Label>
                    <Textarea
                      placeholder="Write a personal message for the recipient..."
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gift Duration</Label>
                    <RadioGroup value={giftDuration} onValueChange={setGiftDuration} className="flex gap-4">
                      {["3", "6", "12"].map((months) => (
                        <div key={months} className="flex items-center space-x-2">
                          <RadioGroupItem value={months} id={`gift-${months}`} />
                          <Label htmlFor={`gift-${months}`} className="cursor-pointer">{months} Months</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Quiz Section */}
            <div className="lg:col-span-2">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <CoffeeQuiz onComplete={handleQuizComplete} />
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <SubscriptionSummary
              selectedProduct={selectedProduct}
              grind={grind}
              bagSize={bagSize}
              quantity={quantity}
              frequency={frequency}
              subscriptionType={subscriptionType}
              prepaidMonths={parseInt(prepaidMonths)}
              giftDuration={parseInt(giftDuration)}
              referralDiscount={referralDiscount}
              couponCode={couponCode}
              onCouponChange={setCouponCode}
              onSubscribe={handleSubscribe}
              loading={loading}
              quizComplete={quizComplete}
            />
          </div>
        </div>
      </div>

      {/* Mobile spacing for fixed bottom bar */}
      <div className="h-32 lg:hidden" />
    </section>
  );
};

export default SubscriptionConfigurator;
