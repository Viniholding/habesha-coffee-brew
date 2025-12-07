import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Coffee, Package, Calendar, Truck, Tag, Loader2, Gift, Sparkles, Lock, ChevronUp, ChevronDown } from "lucide-react";
import { subscriptionProducts, grindOptions, bagSizeOptions, frequencyOptions } from "@/lib/subscriptionProducts";
import DeliveryCalendar from "./DeliveryCalendar";

interface SubscriptionSummaryProps {
  selectedProduct: string;
  grind: string;
  bagSize: string;
  quantity: number;
  frequency: string;
  subscriptionType: "regular" | "prepaid" | "gift";
  prepaidMonths?: number;
  giftDuration?: number;
  referralDiscount?: number;
  couponCode: string;
  onCouponChange: (code: string) => void;
  onSubscribe: () => void;
  loading: boolean;
  quizComplete: boolean;
}

const SubscriptionSummary = ({
  selectedProduct,
  grind,
  bagSize,
  quantity,
  frequency,
  subscriptionType,
  prepaidMonths = 6,
  giftDuration = 3,
  referralDiscount = 0,
  couponCode,
  onCouponChange,
  onSubscribe,
  loading,
  quizComplete,
}: SubscriptionSummaryProps) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [showIncentive, setShowIncentive] = useState(false);

  const selectedProductData = subscriptionProducts.find(p => p.id === selectedProduct);
  const bagSizeData = bagSizeOptions.find(b => b.value === bagSize);
  const frequencyData = frequencyOptions.find(f => f.value === frequency);
  const grindData = grindOptions.find(g => g.value === grind);

  // Calculate pricing
  const calculatePrice = () => {
    if (!selectedProductData || !bagSizeData) return { perDelivery: 0, total: 0, discount: 0, deliveries: 1 };

    const basePrice = selectedProductData.price * bagSizeData.priceMultiplier * quantity;
    let discountPercent = 10; // Base subscription discount
    let totalDeliveries = 1;

    if (referralDiscount > 0) {
      discountPercent += referralDiscount;
    }

    if (subscriptionType === "prepaid") {
      const prepaidDiscounts: Record<number, number> = { 3: 5, 6: 10, 12: 15 };
      discountPercent += prepaidDiscounts[prepaidMonths] || 0;
      const daysPerDelivery = frequencyData?.days || 14;
      totalDeliveries = Math.floor((prepaidMonths * 30) / daysPerDelivery);
    } else if (subscriptionType === "gift") {
      const daysPerDelivery = frequencyData?.days || 14;
      totalDeliveries = Math.floor((giftDuration * 30) / daysPerDelivery);
    }

    const discountedPrice = basePrice * (1 - discountPercent / 100);
    const total = discountedPrice * totalDeliveries;

    return {
      perDelivery: discountedPrice.toFixed(2),
      total: total.toFixed(2),
      discount: discountPercent,
      deliveries: totalDeliveries,
      savings: (basePrice - discountedPrice).toFixed(2),
    };
  };

  const pricing = calculatePrice();

  // Show incentive when quiz is complete
  useEffect(() => {
    if (quizComplete && selectedProduct) {
      const timer = setTimeout(() => setShowIncentive(true), 500);
      return () => clearTimeout(timer);
    }
  }, [quizComplete, selectedProduct]);

  const SummaryContent = () => (
    <div className="space-y-4">
      {selectedProductData ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedProductData.name}</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {grindData?.label || "Whole Bean"} • {bagSizeData?.label || "12 oz"}
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
              <span className="text-primary font-medium">Free</span>
            </div>
          </div>

          <Separator />

          {/* Delivery Calendar */}
          <DeliveryCalendar frequency={frequency} />

          <Separator />

          {/* Coupon */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => onCouponChange(e.target.value)}
                className="text-sm"
              />
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-2">
            {pricing.discount > 0 && (
              <div className="flex justify-between text-sm text-primary">
                <span>Subscriber Discount</span>
                <span>-{pricing.discount}%</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Per delivery</span>
              <span>${pricing.perDelivery}</span>
            </div>
            {subscriptionType !== "regular" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{pricing.deliveries} deliveries</span>
                <span>You save ${pricing.savings}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>{subscriptionType === "regular" ? "Per Delivery" : "Total"}</span>
              <span>${subscriptionType === "regular" ? pricing.perDelivery : pricing.total}</span>
            </div>
          </div>

          {/* First Bag Incentive */}
          <AnimatePresence>
            {showIncentive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-4 border border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm flex items-center gap-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Free Sample Included!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ethiopian single-origin taster with your first order
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showIncentive && !quizComplete && (
            <div className="bg-muted/50 rounded-lg p-4 border border-dashed border-border">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm text-muted-foreground">Unlock Bonus!</p>
                  <p className="text-xs text-muted-foreground">Complete your selection to reveal</p>
                </div>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            variant="hero"
            onClick={onSubscribe}
            disabled={loading || !selectedProduct || !quizComplete}
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
          <p>Complete the quiz to see your order summary</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block">
        <Card className="sticky top-24 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SummaryContent />
          </CardContent>
        </Card>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
        <motion.div
          animate={{ height: mobileExpanded ? "auto" : "auto" }}
          className="max-h-[70vh] overflow-y-auto"
        >
          <div className="p-4">
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="font-bold">
                  {selectedProductData
                    ? `$${subscriptionType === "regular" ? pricing.perDelivery : pricing.total}`
                    : "Order Summary"}
                </span>
                {selectedProductData && (
                  <Badge variant="secondary" className="text-xs">
                    {pricing.discount}% off
                  </Badge>
                )}
              </div>
              {mobileExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>

            {mobileExpanded ? (
              <SummaryContent />
            ) : (
              <Button
                className="w-full"
                size="lg"
                variant="hero"
                onClick={onSubscribe}
                disabled={loading || !selectedProduct || !quizComplete}
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
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default SubscriptionSummary;
