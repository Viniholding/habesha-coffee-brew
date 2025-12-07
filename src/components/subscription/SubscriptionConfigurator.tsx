import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Coffee, Package, Truck, Tag, Loader2, Gift, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { subscriptionProducts, grindOptions, bagSizeOptions, frequencyOptions } from "@/lib/subscriptionProducts";

interface SubscriptionConfiguratorProps {
  initialProgram?: string | null;
}

const prepaidOptions = [
  { value: "3", label: "3 Months", discount: 5, badge: null },
  { value: "6", label: "6 Months", discount: 10, badge: "Popular" },
  { value: "12", label: "12 Months", discount: 15, badge: "Best Value" },
];

const SubscriptionConfigurator = ({ initialProgram }: SubscriptionConfiguratorProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [subscriptionType, setSubscriptionType] = useState<"regular" | "prepaid" | "gift">("regular");

  // Configuration state
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [grind, setGrind] = useState("whole_bean");
  const [bagSize, setBagSize] = useState("12oz");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState("biweekly");
  const [startDate, setStartDate] = useState<"now" | "future">("now");
  const [couponCode, setCouponCode] = useState("");

  // Prepaid state
  const [prepaidMonths, setPrepaidMonths] = useState("6");

  // Gift state
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftDuration, setGiftDuration] = useState("3");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const selectedProductData = subscriptionProducts.find(p => p.id === selectedProduct);
  const bagSizeData = bagSizeOptions.find(b => b.value === bagSize);
  const frequencyData = frequencyOptions.find(f => f.value === frequency);

  const calculatePrice = () => {
    if (!selectedProductData || !bagSizeData) return { perDelivery: 0, total: 0, discount: 0 };
    
    const basePrice = selectedProductData.price * bagSizeData.priceMultiplier * quantity;
    let discountPercent = 10; // Base subscription discount
    let totalDeliveries = 1;

    if (subscriptionType === "prepaid") {
      const prepaidOption = prepaidOptions.find(p => p.value === prepaidMonths);
      discountPercent += prepaidOption?.discount || 0;
      // Calculate deliveries based on frequency
      const daysPerDelivery = frequencyData?.days || 14;
      const months = parseInt(prepaidMonths);
      totalDeliveries = Math.floor((months * 30) / daysPerDelivery);
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
      discount: discountPercent,
      deliveries: totalDeliveries,
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
      toast.error("Please select a coffee");
      return;
    }

    if (subscriptionType === "gift") {
      if (!giftRecipientEmail || !giftRecipientName) {
        toast.error("Please fill in recipient details");
        return;
      }
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
          subscriptionType,
          // Prepaid fields
          isPrepaid: subscriptionType === "prepaid",
          prepaidMonths: subscriptionType === "prepaid" ? parseInt(prepaidMonths) : undefined,
          prepaidTotal: subscriptionType === "prepaid" ? pricing.total : undefined,
          // Gift fields
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
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Subscription Type Tabs */}
          <Tabs value={subscriptionType} onValueChange={(v) => setSubscriptionType(v as any)} className="mb-8">
            <TabsList className="grid w-full grid-cols-3">
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
              <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
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
              <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
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
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="3" id="gift-3" />
                        <Label htmlFor="gift-3" className="cursor-pointer">3 Months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="6" id="gift-6" />
                        <Label htmlFor="gift-6" className="cursor-pointer">6 Months</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="12" id="gift-12" />
                        <Label htmlFor="gift-12" className="cursor-pointer">12 Months</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Configuration Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Product Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <CardTitle className="text-lg">Choose Your Coffee</CardTitle>
                      <CardDescription>Select your preferred blend</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedProduct} onValueChange={setSelectedProduct} className="space-y-3">
                    {subscriptionProducts.map((product) => (
                      <div key={product.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={product.id} id={product.id} />
                        <Label htmlFor={product.id} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.description}</p>
                            </div>
                            <span className="font-semibold">${product.price}</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Step 2: Grind & Size */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <CardTitle className="text-lg">Grind & Size</CardTitle>
                      <CardDescription>Customize to your brewing method</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Grind Type</Label>
                    <Select value={grind} onValueChange={setGrind}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {grindOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Bag Size</Label>
                    <RadioGroup value={bagSize} onValueChange={setBagSize} className="flex gap-4">
                      {bagSizeOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`size-${option.value}`} />
                          <Label htmlFor={`size-${option.value}`} className="cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity (bags per delivery)</Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        -
                      </Button>
                      <span className="text-xl font-semibold w-8 text-center">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.min(5, quantity + 1))}
                        disabled={quantity >= 5}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3: Delivery Schedule */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <CardTitle className="text-lg">Delivery Schedule</CardTitle>
                      <CardDescription>Set your frequency and start date</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Delivery Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {subscriptionType === "regular" && (
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <RadioGroup value={startDate} onValueChange={(v) => setStartDate(v as "now" | "future")} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="now" id="start-now" />
                          <Label htmlFor="start-now" className="cursor-pointer">Ship Immediately</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="future" id="start-future" />
                          <Label htmlFor="start-future" className="cursor-pointer">Choose Date</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Coupon Code (optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button variant="outline" size="sm">
                        <Tag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {subscriptionType === "gift" && <Gift className="h-5 w-5 text-primary" />}
                    {subscriptionType === "prepaid" && <CreditCard className="h-5 w-5 text-primary" />}
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedProductData ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Coffee className="h-4 w-4 text-primary" />
                          <span className="font-medium">{selectedProductData.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">
                          {grindOptions.find(g => g.value === grind)?.label} • {bagSizeOptions.find(b => b.value === bagSize)?.label}
                        </p>
                      </div>

                      {subscriptionType === "gift" && giftRecipientName && (
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium">Gift for: {giftRecipientName}</p>
                          <p className="text-xs text-muted-foreground">{giftRecipientEmail}</p>
                        </div>
                      )}

                      <Separator />

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Quantity
                          </span>
                          <span>{quantity} bag(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Frequency
                          </span>
                          <span>{frequencyData?.label}</span>
                        </div>
                        {(subscriptionType === "prepaid" || subscriptionType === "gift") && (
                          <div className="flex justify-between">
                            <span>Deliveries</span>
                            <span>{pricing.deliveries}x</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Shipping
                          </span>
                          <span className="text-primary">Free</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-primary">
                          <span>Total Discount</span>
                          <span>-{pricing.discount}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Per delivery</span>
                          <span>${pricing.perDelivery}</span>
                        </div>
                        {(subscriptionType === "prepaid" || subscriptionType === "gift") && (
                          <>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total (one-time)</span>
                              <span>${pricing.total}</span>
                            </div>
                          </>
                        )}
                        {subscriptionType === "regular" && (
                          <>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total per delivery</span>
                              <span>${pricing.perDelivery}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg" 
                        variant="hero"
                        onClick={handleSubscribe}
                        disabled={loading || !selectedProduct}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : subscriptionType === "gift" ? (
                          <>
                            <Gift className="h-4 w-4 mr-2" />
                            Send Gift
                          </>
                        ) : subscriptionType === "prepaid" ? (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay ${pricing.total}
                          </>
                        ) : (
                          "Subscribe Now"
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        {subscriptionType === "regular" 
                          ? "Cancel or pause anytime. No commitments."
                          : subscriptionType === "prepaid"
                          ? "One-time payment. No recurring charges."
                          : "Recipient can manage their subscription."}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Coffee className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select a coffee to see your order summary</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionConfigurator;
