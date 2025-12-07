import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Lock, Shield } from "lucide-react";

interface CheckoutPaymentFormProps {
  onPaymentDataChange: (data: any) => void;
  paymentData: {
    cardNumber: string;
    expiry: string;
    cvc: string;
    nameOnCard: string;
  };
}

const CheckoutPaymentForm = ({
  onPaymentDataChange,
  paymentData,
}: CheckoutPaymentFormProps) => {
  const handleChange = (field: string, value: string) => {
    let formattedValue = value;

    // Format card number with spaces
    if (field === "cardNumber") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19);
    }

    // Format expiry as MM/YY
    if (field === "expiry") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "$1/$2")
        .slice(0, 5);
    }

    // Limit CVC to 4 digits
    if (field === "cvc") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    onPaymentDataChange({ ...paymentData, [field]: formattedValue });
  };

  const getCardBrand = (number: string) => {
    const cleaned = number.replace(/\s/g, "");
    if (cleaned.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return "Mastercard";
    if (cleaned.startsWith("34") || cleaned.startsWith("37")) return "Amex";
    if (cleaned.startsWith("6011") || cleaned.startsWith("65")) return "Discover";
    return null;
  };

  const cardBrand = getCardBrand(paymentData.cardNumber);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Method
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Secure payment powered by Stripe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nameOnCard">Name on Card *</Label>
          <Input
            id="nameOnCard"
            value={paymentData.nameOnCard}
            onChange={(e) => handleChange("nameOnCard", e.target.value)}
            placeholder="John Smith"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="cardNumber">Card Number *</Label>
            {cardBrand && (
              <Badge variant="secondary" className="text-xs">
                {cardBrand}
              </Badge>
            )}
          </div>
          <Input
            id="cardNumber"
            value={paymentData.cardNumber}
            onChange={(e) => handleChange("cardNumber", e.target.value)}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry Date *</Label>
            <Input
              id="expiry"
              value={paymentData.expiry}
              onChange={(e) => handleChange("expiry", e.target.value)}
              placeholder="MM/YY"
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvc">CVC *</Label>
            <Input
              id="cvc"
              type="password"
              value={paymentData.cvc}
              onChange={(e) => handleChange("cvc", e.target.value)}
              placeholder="123"
              maxLength={4}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-primary" />
          <span>Your payment information is encrypted and secure.</span>
        </div>

        {/* Accepted cards */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">We accept:</span>
          <div className="flex gap-2">
            {["Visa", "Mastercard", "Amex", "Discover"].map((brand) => (
              <Badge key={brand} variant="outline" className="text-xs">
                {brand}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CheckoutPaymentForm;
