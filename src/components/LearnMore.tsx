import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coffee, Leaf, Heart } from "lucide-react";

const LearnMore = () => {
  const features = [
    {
      icon: Coffee,
      title: "Single Origin",
      description: "100% Ethiopian Arabica beans from carefully selected highland farms"
    },
    {
      icon: Leaf,
      title: "Sustainably Sourced",
      description: "Direct trade relationships supporting local farming communities"
    },
    {
      icon: Heart,
      title: "Hand Crafted",
      description: "Small batch roasting to preserve the unique flavor profile"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Learn More</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover what makes our coffee exceptional
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 text-center">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button variant="default" size="lg" asChild>
            <a href="/products">Products</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LearnMore;
