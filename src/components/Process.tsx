import { Card } from "@/components/ui/card";
import forestImage from "@/assets/forest.jpg";
import handPickedImage from "@/assets/hand-picked.jpg";
import roastedImage from "@/assets/roasted.jpg";
import jebenaImage from "@/assets/jebena.png";

const processSteps = [
  {
    number: "01",
    title: "Forest Shielded",
    description: "Our premium Arabica beans grow naturally in Ethiopia's lush, protected forest highlands, where the perfect climate creates exceptional flavor.",
    image: forestImage,
  },
  {
    number: "02",
    title: "Hand Picked",
    description: "Each cherry is carefully selected by experienced farmers who harvest only the ripest beans, ensuring superior quality in every batch.",
    image: handPickedImage,
  },
  {
    number: "03",
    title: "Slow Roasted",
    description: "We roast in small batches using traditional methods, allowing each bean to develop its full, complex flavor profile and aroma.",
    image: roastedImage,
  },
];

const Process = () => {
  return (
    <section id="process" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl md:text-6xl font-bold">Our Process</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From Ethiopian highlands to your cup, we ensure every step delivers perfection
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {processSteps.map((step, index) => (
            <Card 
              key={index}
              className="overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] group"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
                  {step.number}
                </div>
              </div>
              <div className="p-6 space-y-3">
                <h3 className="text-2xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Jebena Coffee Brewing Guide */}
        <div className="mt-32 relative">
          {/* Hero Section with Image */}
          <div className="text-center mb-20 space-y-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150"></div>
              <img 
                src={jebenaImage} 
                alt="Traditional Ethiopian Jebena Coffee Pot" 
                className="relative w-80 h-auto object-contain mx-auto animate-fade-in"
              />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl md:text-6xl font-bold">How to Make Jebena Coffee</h3>
              <p className="text-2xl text-muted-foreground font-light">The Coffee Habesha Way</p>
            </div>
          </div>

          {/* Timeline Style Instructions */}
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Step 1 */}
            <div className="relative pl-8 md:pl-16 border-l-2 border-primary/30">
              <div className="absolute -left-4 top-0 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                1
              </div>
              <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
                <h4 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  Set the Mood — Coffee Time Is Sacred
                </h4>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Find your coziest spot — Light your etan (frankincense), grab your Jebena, and gather your people. Coffee time is sacred — laughter required.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-8 md:pl-16 border-l-2 border-primary/30">
              <div className="absolute -left-4 top-0 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                2
              </div>
              <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
                <h4 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  Roast with Rhythm
                </h4>
                <div className="space-y-3">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Traditionally, you'd roast green beans until your kitchen smells like paradise.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    But hey — we've got you covered! Pick from our amazing Coffee Habesha selection — roasted to perfection and ready to impress.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed italic opacity-80">
                    (Warning: neighbors might "accidentally" drop by once they smell it 😉)
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-8 md:pl-16 border-l-2 border-primary/30">
              <div className="absolute -left-4 top-0 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                3
              </div>
              <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
                <h4 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  Grind It the Traditional Way
                </h4>
                <div className="space-y-3">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Add your ground coffee to the Jebena, fill with water, and simmer slowly.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    When it starts to rise, lift it — let it dance a little — then pour into sini cups with style and confidence.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative pl-8 md:pl-16 border-l-2 border-primary/30">
              <div className="absolute -left-4 top-0 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg">
                4
              </div>
              <div className="bg-card/50 backdrop-blur-sm p-8 rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
                <h4 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
                  The Jebena Magic
                </h4>
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Serve with fendisha (popcorn) or kolo, and enjoy three rounds:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="text-lg font-semibold mb-1">☕ Abol</p>
                      <p className="text-sm text-muted-foreground">Bold & Beautiful</p>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="text-lg font-semibold mb-1">☕ Tona</p>
                      <p className="text-sm text-muted-foreground">Smooth & Social</p>
                    </div>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                      <p className="text-lg font-semibold mb-1">☕ Baraka</p>
                      <p className="text-sm text-muted-foreground">Light & Blessed</p>
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-center mt-8 text-foreground">
                    Because coffee isn't just a drink — it's the Habesha way of life.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;import { Coffee, Sparkles, Users, Heart } from "lucide-react";
import jebenaImage from "@assets/generated_images/Traditional_Jebena_coffee_pot_ceremony_96854059.png";

const steps = [
  {
    number: "1",
    title: "Set the Mood — Coffee Time Is Sacred",
    description: "Find your coziest spot — Light your etan (frankincense), grab your Jebena, and gather your people. Coffee time is sacred — laughter required.",
    icon: Heart
  },
  {
    number: "2",
    title: "Roast with Rhythm",
    description: "Traditionally, you'd roast green beans until your kitchen smells like paradise. But hey — we've got you covered! Pick from our amazing Coffee Habesha selection — roasted to perfection and ready to impress.",
    icon: Sparkles
  },
  {
    number: "3",
    title: "Grind It the Traditional Way",
    description: "Add your ground coffee to the Jebena, fill with water, and simmer slowly. When it starts to rise, lift it — let it dance a little — then pour into sini cups with style and confidence.",
    icon: Coffee
  },
  {
    number: "4",
    title: "The Jebena Magic",
    description: "Serve with fendisha (popcorn) or kolo, and enjoy three rounds: Abol (Bold & Beautiful), Tona (Smooth & Social), and Baraka (Light & Blessed).",
    icon: Users
  }
];

export default function JebenaTutorial() {
  return (
    <section className="w-full bg-card py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-card-foreground mb-4">
            How to Make Jebena Coffee
          </h2>
          <p className="text-xl md:text-2xl text-card-foreground/70 font-accent italic">
            The Coffee Habesha Way
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 space-y-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-6 group"
                data-testid={`tutorial-step-${step.number}`}
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold text-primary/20">{step.number}</span>
                    <h3 className="text-xl md:text-2xl font-semibold text-card-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-card-foreground/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={jebenaImage}
                alt="Traditional Ethiopian Jebena Coffee Pot"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <p className="mt-6 text-center text-card-foreground/60 italic text-lg">
              Because coffee isn't just a drink — it's the Habesha way of life.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

