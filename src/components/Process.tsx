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
    <section id="process" className="bg-card">
      {/* Hero Section with Background Image */}
      <div className="relative h-screen min-h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={forestImage} 
            alt="Ethiopian Coffee Highlands"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 text-center px-4 space-y-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight">
            From Ethiopian<br />Highlands to Your<br />Cup
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto font-light">
            Every step delivers perfection through centuries of tradition and uncompromising craftsmanship
          </p>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>

      {/* Process Steps Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-12">
          {processSteps.map((step, index) => (
            <div key={index} className="space-y-6">
              <div className="relative h-80 overflow-hidden rounded-lg group">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-6 left-6 bg-primary text-primary-foreground w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
                  {step.number}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-primary tracking-wider">
                  STEP {step.number}
                </div>
                <h3 className="text-3xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {step.description}
                </p>
              </div>
            </div>
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

export default Process;
