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

  const handleProgramSelect = async (programId: string) => {
    setSelectedProgram(programId);
    
    // Fetch the program to get the default product
    const { data: program, error } = await supabase
      .from("subscription_programs")
      .select("default_product_id, name")
      .eq("id", programId)
      .single();
    
    if (error || !program?.default_product_id) {
      toast.error("Could not load program details");
      return;
    }

    // Fetch the product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("name")
      .eq("id", program.default_product_id)
      .single();

    if (productError || !product) {
      toast.error("Could not load product details");
      return;
    }

    // Map product name to product ID used in subscriptionProducts
    const productIdMap: Record<string, string> = {
      "Ethiopian Yirgacheffe": "ethiopian-yirgacheffe",
      "Sidamo Dark Roast": "sidamo-dark-roast",
      "Harar Heritage Blend": "harar-heritage-blend",
      "Limu Organic": "limu-organic",
    };

    const productId = productIdMap[product.name] || "ethiopian-yirgacheffe";

    // Navigate to review page with the program's default product
    const params = new URLSearchParams({
      product: productId,
      grind: "whole_bean",
      bagSize: "12oz",
      quantity: "1",
      frequency: "biweekly",
      type: "regular",
      program: programId,
    });

    navigate(`/subscription/review?${params.toString()}`);
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
