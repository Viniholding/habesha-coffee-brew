import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coffee, Truck, Percent, ArrowDown } from "lucide-react";

const SubscriptionHero = () => {
  const scrollToConfigurator = () => {
    document.getElementById("configurator")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="border-primary text-primary px-4 py-2">
            Coffee Subscription
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Fresh Coffee,{" "}
            <span className="text-primary">Delivered</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Never run out of your favorite Ethiopian coffee. Subscribe and save with 
            flexible delivery schedules tailored to your brewing habits.
          </p>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 py-8">
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <Coffee className="h-6 w-6 text-primary" />
              <span className="font-medium">Freshly Roasted</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <Truck className="h-6 w-6 text-primary" />
              <span className="font-medium">Free Shipping</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <Percent className="h-6 w-6 text-primary" />
              <span className="font-medium">Save 10%</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="hero" onClick={scrollToConfigurator} className="text-lg px-8">
              Get Started
              <ArrowDown className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionHero;
