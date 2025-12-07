import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SubscriptionHero from "@/components/subscription/SubscriptionHero";
import HowItWorks from "@/components/subscription/HowItWorks";
import SubscriptionPrograms from "@/components/subscription/SubscriptionPrograms";
import SubscriptionFAQ from "@/components/subscription/SubscriptionFAQ";
import SubscriptionSummary from "@/components/subscription/SubscriptionSummary";
import { CoffeeBeanLoading } from "@/components/ui/CoffeeBeanSpinner";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subscriptionProducts, bagSizeOptions, frequencyOptions } from "@/lib/subscriptionProducts";

// Map flavor profiles to products
const flavorProductMap: Record<string, string> = {
  bold: "sidamo-dark-roast",
  bright: "ethiopian-yirgacheffe",
  balanced: "harar-heritage-blend",
};

const prepaidOptions = [
  { value: "3", discount: 5 },
  { value: "6", discount: 10 },
  { value: "12", discount: 15 },
];

const Subscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  
  // Quiz selections state
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [grind, setGrind] = useState("whole_bean");
  const [bagSize, setBagSize] = useState("12oz");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState("biweekly");
  const [couponCode, setCouponCode] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<"regular" | "prepaid" | "gift">("regular");
  const [prepaidMonths, setPrepaidMonths] = useState(6);
  const [giftDuration, setGiftDuration] = useState(3);
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast.error("Subscription checkout was canceled");
    }
    checkUser();
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleProgramSelect = (programId: string) => {
    setSelectedProgram(programId);
    document.getElementById("configurator")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuizComplete = (selections: {
    flavorProfile: string;
    brewMethod: string;
    grind: string;
    bagSize: string;
    quantity: number;
    frequency: string;
  }) => {
    setSelectedProduct(flavorProductMap[selections.flavorProfile] || "");
    setGrind(selections.grind);
    setBagSize(selections.bagSize);
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

    if (referralDiscount > 0) {
      discountPercent += referralDiscount;
    }

    let totalDeliveries = 1;
    if (subscriptionType === "prepaid") {
      const prepaidOption = prepaidOptions.find(p => p.value === String(prepaidMonths));
      discountPercent += prepaidOption?.discount || 0;
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
    };
  };

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

    setSubscribing(true);
    const pricing = calculatePrice();
    
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
          isPrepaid: subscriptionType === "prepaid",
          prepaidMonths: subscriptionType === "prepaid" ? prepaidMonths : undefined,
          prepaidTotal: subscriptionType === "prepaid" ? pricing.total : undefined,
          isGift: subscriptionType === "gift",
          giftDuration: subscriptionType === "gift" ? giftDuration : undefined,
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
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <CoffeeBeanLoading message="Preparing your subscription experience..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <SubscriptionHero />
      <HowItWorks />
      <SubscriptionPrograms 
        onProgramSelect={handleProgramSelect}
        onQuizComplete={handleQuizComplete}
        showQuiz={showQuiz}
        onShowQuizChange={setShowQuiz}
      />
      
      {/* Show Summary when quiz is complete */}
      {showQuiz && quizComplete && (
        <section className="py-12 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <SubscriptionSummary
                selectedProduct={selectedProduct}
                grind={grind}
                bagSize={bagSize}
                quantity={quantity}
                frequency={frequency}
                subscriptionType={subscriptionType}
                prepaidMonths={prepaidMonths}
                giftDuration={giftDuration}
                referralDiscount={referralDiscount}
                couponCode={couponCode}
                onCouponChange={setCouponCode}
                onSubscribe={handleSubscribe}
                loading={subscribing}
                quizComplete={quizComplete}
              />
            </div>
          </div>
        </section>
      )}
      
      <SubscriptionFAQ />
      <Footer />
    </div>
  );
};

export default Subscribe;
