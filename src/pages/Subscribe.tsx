import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SubscriptionHero from "@/components/subscription/SubscriptionHero";
import HowItWorks from "@/components/subscription/HowItWorks";
import SubscriptionPrograms from "@/components/subscription/SubscriptionPrograms";
import SubscriptionFAQ from "@/components/subscription/SubscriptionFAQ";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Map flavor profiles to products
const flavorProductMap: Record<string, string> = {
  bold: "sidamo-dark-roast",
  bright: "ethiopian-yirgacheffe",
  balanced: "harar-heritage-blend",
};

const Subscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(searchParams.get("showQuiz") === "true");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast.error("Subscription checkout was canceled");
    }
    checkUser();
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
    subscriptionType: "regular" | "prepaid" | "gift";
    prepaidMonths?: number;
    giftDuration?: number;
  }) => {
    const productId = flavorProductMap[selections.flavorProfile] || "";
    
    // Build URL params for the review page
    const params = new URLSearchParams({
      product: productId,
      grind: selections.grind,
      bagSize: selections.bagSize,
      quantity: String(selections.quantity),
      frequency: selections.frequency,
      type: selections.subscriptionType,
    });

    if (selections.subscriptionType === "prepaid" && selections.prepaidMonths) {
      params.set("prepaidMonths", String(selections.prepaidMonths));
    }
    if (selections.subscriptionType === "gift" && selections.giftDuration) {
      params.set("giftDuration", String(selections.giftDuration));
    }

    // Navigate to the subscription review page
    navigate(`/subscription/review?${params.toString()}`);
  };

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
      <SubscriptionFAQ />
      <Footer />
    </div>
  );
};

export default Subscribe;
