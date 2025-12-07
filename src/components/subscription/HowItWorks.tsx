import { Badge } from "@/components/ui/badge";
import { Coffee, Settings2, Truck } from "lucide-react";

const steps = [
  {
    icon: Coffee,
    title: "Choose Your Coffee",
    description: "Select from our curated programs or build your own custom subscription with any coffee you love.",
  },
  {
    icon: Settings2,
    title: "Set Your Preferences",
    description: "Pick your grind, bag size, quantity, and delivery frequency. Adjust anytime.",
  },
  {
    icon: Truck,
    title: "Enjoy Auto-Delivery",
    description: "Freshly roasted coffee arrives at your door on your schedule. Skip or pause whenever you need.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-card/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            How It Works
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold">
            Three Simple Steps
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center p-6">
              {/* Step number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
