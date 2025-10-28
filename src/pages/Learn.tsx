import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Coffee, Sparkles, Users, Heart } from "lucide-react";
import jebenaImage from "@/assets/jebena-ceremony.png";

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

const Learn = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        {/* Content */}
        <div className="container mx-auto px-4 z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-1000">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              Learn
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover the art and science of exceptional coffee
            </p>
          </div>
        </div>
      </section>

      {/* Jebena Tutorial Section */}
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

      <Footer />
    </div>
  );
};

export default Learn;
