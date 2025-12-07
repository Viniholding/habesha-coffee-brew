import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SubscriptionHero from "@/components/subscription/SubscriptionHero";
import HowItWorks from "@/components/subscription/HowItWorks";
import SubscriptionPrograms from "@/components/subscription/SubscriptionPrograms";
import SubscriptionConfigurator from "@/components/subscription/SubscriptionConfigurator";
import SubscriptionFAQ from "@/components/subscription/SubscriptionFAQ";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Subscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      toast.error("Subscription checkout was canceled");
    }
  }, [searchParams]);

  const handleProgramSelect = (programId: string) => {
    setSelectedProgram(programId);
    // Scroll to configurator
    document.getElementById("configurator")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <SubscriptionHero />
      <HowItWorks />
      <SubscriptionPrograms onProgramSelect={handleProgramSelect} />
      <div id="configurator">
        <SubscriptionConfigurator initialProgram={selectedProgram} />
      </div>
      <SubscriptionFAQ />
      <Footer />
    </div>
  );
};

export default Subscribe;
