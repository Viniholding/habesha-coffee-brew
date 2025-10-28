import { Coffee, Sparkles, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import jebenaImage from "@/assets/jebena-ceremony.png";
import coffeeCeremonyImage from "@/assets/coffee-ceremony.png";

const tutorialSteps = [
  {
    number: <span className="text-primary">1</span>,
    title: "Set the Mood — Coffee Time Is Sacred",
    description: "Find your coziest spot — Light your etan (frankincense), grab your Jebena, and gather your people. Coffee time is sacred — laughter required.",
    icon: Heart
  },
  {
    number: <span className="text-primary">2</span>,
    title: "Roast with Rhythm",
    description: "Traditionally, you'd roast green beans until your kitchen smells like paradise. But hey — we've got you covered! Pick from our amazing Coffee Habesha selection — roasted to perfection and ready to impress.",
    icon: Sparkles
  },
  {
    number: <span className="text-primary">3</span>,
    title: "Grind It the Traditional Way",
    description: "Add your ground coffee to the Jebena, fill with water, and simmer slowly. When it starts to rise, lift it — let it dance a little — then pour into sini cups with style and confidence.",
    icon: Coffee
  },
  {
    number: <span className="text-primary">4</span>,
    title: "The Jebena Magic",
    description: "Serve with fendisha (popcorn) or kolo, and enjoy three rounds: Abol (Bold & Beautiful), Tona (Smooth & Social), and Baraka (Light & Blessed).",
    icon: Users
  }
];

const sacredRounds = [
  {
    name: "Abol",
    subtitle: "Bold & Beautiful",
    description: "The first round — strong, rich, and full of life. This is where the conversation begins and the magic unfolds."
  },
  {
    name: "Tona",
    subtitle: "Smooth & Social",
    description: "The second round — mellower and more refined. Perfect for deep conversations and strengthening bonds."
  },
  {
    name: "Baraka",
    subtitle: "Light & Blessed",
    description: "The third round — gentle and blessed. A moment of gratitude, reflection, and heartfelt connection."
  }
];

export default function Learn() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
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
              {tutorialSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-6 group"
                  data-testid={`tutorial-step-${index + 1}`}
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

      {/* Three Sacred Rounds Section */}
      <section className="w-full bg-background py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              The Three Sacred Rounds
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground italic">
              Each round tells a story, each cup brings us closer
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {sacredRounds.map((round) => (
              <div key={round.name} className="text-center space-y-4 p-8 rounded-2xl bg-card hover:shadow-xl transition-shadow">
                <h3 className="text-3xl md:text-4xl font-bold text-primary">
                  {round.name}
                </h3>
                <p className="text-lg font-semibold text-card-foreground">
                  {round.subtitle}
                </p>
                <p className="text-card-foreground/70 leading-relaxed">
                  {round.description}
                </p>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="relative rounded-2xl overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${coffeeCeremonyImage})` }}
              >
                <div className="absolute inset-0 bg-black/30" />
              </div>
              <blockquote className="relative z-10 text-2xl md:text-3xl font-serif italic text-white border-l-4 border-primary pl-8 py-12 pr-8">
                "Coffee is our bread, our culture, our connection. It is the thread that weaves through every moment of Ethiopian life."
              </blockquote>
            </div>
            
            <div className="pt-8">
              <p className="text-xl text-muted-foreground mb-6">
                Experience the authentic taste of tradition with Coffee Habesha
              </p>
              <Button variant="hero" size="lg" asChild>
                <a href="/products">Explore Our Coffee Selection</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
