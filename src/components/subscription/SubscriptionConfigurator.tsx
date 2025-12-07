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
import { Calendar, Coffee, Package, Truck, Tag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { subscriptionProducts, grindOptions, bagSizeOptions, frequencyOptions } from "@/lib/subscriptionProducts";

interface SubscriptionConfiguratorProps {
  initialProgram?: string | null;
}

const SubscriptionConfigurator = ({ initialProgram }: SubscriptionConfiguratorProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Configuration state
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [grind, setGrind] = useState("whole_bean");
  const [bagSize, setBagSize] = useState("12oz");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState("biweekly");
  const [startDate, setStartDate] = useState<"now" | "future">("now");
  const [couponCode, setCouponCode] = useState("");

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
    if (!selectedProductData || !bagSizeData) return 0;
    const basePrice = selectedProductData.price * bagSizeData.priceMultiplier * quantity;
    const discount = basePrice * 0.1; // 10% subscription discount
    return (basePrice - discount).toFixed(2);
  };

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

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription", {
        body: {
          priceId: calculatePrice(),
          productId: selectedProductData?.stripeProductId,
          productName: selectedProductData?.name,
          quantity,
          frequency,
          grind,
          bagSize,
          couponCode: couponCode || undefined,
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
                  <CardTitle>Order Summary</CardTitle>
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
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>${(parseFloat(String(calculatePrice())) / 0.9).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-primary">
                          <span>Subscription Discount (10%)</span>
                          <span>-${((parseFloat(String(calculatePrice())) / 0.9) * 0.1).toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total per delivery</span>
                          <span>${calculatePrice()}</span>
                        </div>
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
                        ) : (
                          "Subscribe Now"
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Cancel or pause anytime. No commitments.
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
