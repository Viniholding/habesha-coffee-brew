import { Card } from "@/components/ui/card";
import forestImage from "@/assets/forest.jpg";
import handPickedImage from "@/assets/hand-picked.jpg";
import roastedImage from "@/assets/roasted.jpg";

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

        {/* Jebena Coffee Guide */}
        <div className="mt-24 max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h3 className="text-4xl md:text-5xl font-bold">How to Make Jebena Coffee — The Coffee Habesha Way</h3>
          </div>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="space-y-3">
              <h4 className="text-2xl font-bold text-primary">Step 1: Set the Mood — Coffee Time Is Sacred</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Find your coziest spot — Light your etan (frankincense), grab your Jebena, and gather your people. Coffee time is sacred — laughter required.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <h4 className="text-2xl font-bold text-primary">Step 2: Roast with Rhythm (or... Let Us Do It for You 😉)</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Traditionally, you'd roast green beans until your kitchen smells like paradise.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                But hey — we've got you covered! Pick from our amazing Coffee Habesha selection — roasted to perfection and ready to impress.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed italic">
                (Warning: neighbors might "accidentally" drop by once they smell it 😉)
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <h4 className="text-2xl font-bold text-primary">Step 3: Grind It the Traditional Way</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Add your ground coffee to the Jebena, fill with water, and simmer slowly.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                When it starts to rise, lift it — let it dance a little — then pour into sini cups with style and confidence.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3">
              <h4 className="text-2xl font-bold text-primary">Step 4: The Jebena Magic</h4>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Serve with fendisha (popcorn) or kolo, and enjoy three rounds:
              </p>
              <div className="pl-6 space-y-2">
                <p className="text-lg text-muted-foreground">☕ Abol – bold & beautiful</p>
                <p className="text-lg text-muted-foreground">☕ Tona – smooth & social</p>
                <p className="text-lg text-muted-foreground">☕ Baraka – light & blessed</p>
              </div>
              <p className="text-lg font-semibold mt-6">
                Because coffee isn't just a drink — it's the Habesha way of life.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
