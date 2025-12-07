import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Coffee, Star, Leaf, Palette, X, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CoffeeQuiz from "./CoffeeQuiz";

interface Program {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

interface SubscriptionProgramsProps {
  onProgramSelect: (programId: string) => void;
  onQuizComplete?: (selections: {
    flavorProfile: string;
    brewMethod: string;
    grind: string;
    bagSize: string;
    quantity: number;
    frequency: string;
    subscriptionType: "regular" | "prepaid" | "gift";
    prepaidMonths?: number;
    giftDuration?: number;
  }) => void;
  showQuiz?: boolean;
  onShowQuizChange?: (show: boolean) => void;
}

const programIcons: Record<string, any> = {
  "Roaster's Choice": Sparkles,
  "Espresso Lovers": Coffee,
  "Best Sellers": Star,
  "Seasonal Collection": Leaf,
  "Build Your Own": Palette,
  "Shop All": ShoppingBag,
};

const SubscriptionPrograms = ({ 
  onProgramSelect, 
  onQuizComplete,
  showQuiz = false,
  onShowQuizChange
}: SubscriptionProgramsProps) => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleBuildYourOwnClick = (programId: string) => {
    onShowQuizChange?.(true);
    // Scroll to quiz after a short delay to allow animation to start
    setTimeout(() => {
      document.getElementById("build-your-own-quiz")?.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
    }, 100);
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
    onQuizComplete?.(selections);
  };

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_programs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            Our Programs
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Experience
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select from our curated subscription programs or build your own custom experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {programs.map((program) => {
            const Icon = programIcons[program.name] || Coffee;
            const isBuildYourOwn = program.name === "Build Your Own";
            
            return (
              <Card 
                key={program.id}
                className={`relative overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] ${
                  isBuildYourOwn ? "md:col-span-2 lg:col-span-1 border-primary/30 bg-gradient-to-br from-card to-primary/5" : ""
                }`}
              >
                {isBuildYourOwn && (
                  <Badge className="absolute top-4 right-4 bg-primary">
                    Most Flexible
                  </Badge>
                )}
                
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{program.name}</CardTitle>
                  <CardDescription className="text-base">
                    {program.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <Button 
                    variant={isBuildYourOwn ? "hero" : "outline"} 
                    className="w-full"
                    onClick={() => isBuildYourOwn ? handleBuildYourOwnClick(program.id) : onProgramSelect(program.id)}
                  >
                    {isBuildYourOwn ? "Start Building" : "Subscribe"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Shop All Subscriptions Card */}
          <Card 
            className="relative overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] border-dashed border-2"
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Shop All Subscriptions</CardTitle>
              <CardDescription className="text-base">
                Browse our complete collection of subscription coffees and find your perfect match.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/products?category=coffee")}
              >
                View All Coffees
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Build Your Own Quiz Panel */}
        <AnimatePresence>
          {showQuiz && (
            <motion.div
              id="build-your-own-quiz"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
                <CardHeader className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={() => onShowQuizChange?.(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Palette className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Build Your Perfect Subscription</CardTitle>
                      <CardDescription className="text-base">
                        Answer a few quick questions to craft your ideal coffee experience
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CoffeeQuiz onComplete={handleQuizComplete} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default SubscriptionPrograms;
