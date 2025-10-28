import forestImage from "@/assets/forest.jpg";
import handPickedImage from "@/assets/hand-picked.jpg";
import roastedImage from "@/assets/roasted.jpg";
import jebenaImage from "@/assets/jebena.png";
import { Button } from "@/components/ui/button";

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
    <section id="process" className="bg-background">
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
      </div>

      {/* Jebena Coffee Making Guide */}
      <div className="bg-card py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">How to Make Jebena Coffee</h2>
            <p className="text-xl text-muted-foreground">The Coffee Habesha Way</p>
          </div>

          <div className="max-w-5xl mx-auto space-y-12">
            {/* Step 1 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Set the Mood — Coffee Time Is Sacred</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Find your coziest spot — Light your etan (frankincense), grab your Jebena, and gather your people. Coffee time is sacred — laughter required.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Roast with Rhythm</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Traditionally, you'd roast green beans until your kitchen smells like paradise. But hey — we've got you covered! Pick from our amazing Coffee Habesha selection — roasted to perfection and ready to impress.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Grind It the Traditional Way</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Add your ground coffee to the Jebena, fill with water, and simmer slowly. When it starts to rise, lift it — let it dance a little — then pour into sini cups with style and confidence.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-8 items-start">
              <div className="flex-shrink-0 bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                4
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">The Jebena Magic</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Serve with fendisha (popcorn) or kolo, and enjoy three rounds: Abol (Bold & Beautiful), Tona (Smooth & Social), and Baraka (Light & Blessed).
                </p>
              </div>
            </div>
          </div>

          {/* Jebena Image */}
          <div className="mt-16 text-center space-y-8">
            <img 
              src={jebenaImage} 
              alt="Traditional Ethiopian Jebena Coffee Pot"
              className="w-80 h-auto mx-auto"
            />
            <p className="text-xl text-muted-foreground italic">
              Because coffee isn't just a drink — it's the Habesha way of life.
            </p>
          </div>
        </div>
      </div>

      {/* The Three Sacred Rounds */}
      <div className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">The Three Sacred Rounds</h2>
            <p className="text-xl text-muted-foreground">Each round tells a story, each cup brings us closer</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Abol */}
            <div className="space-y-4 text-center">
              <h3 className="text-3xl font-bold">Abol</h3>
              <p className="text-lg font-semibold text-primary">Bold & Beautiful</p>
              <p className="text-muted-foreground leading-relaxed">
                The first round — strong, rich, and full of life. This is where the conversation begins and the magic unfolds.
              </p>
            </div>

            {/* Tona */}
            <div className="space-y-4 text-center">
              <h3 className="text-3xl font-bold">Tona</h3>
              <p className="text-lg font-semibold text-primary">Smooth & Social</p>
              <p className="text-muted-foreground leading-relaxed">
                The second round — mellower and more refined. Perfect for deep conversations and strengthening bonds.
              </p>
            </div>

            {/* Baraka */}
            <div className="space-y-4 text-center">
              <h3 className="text-3xl font-bold">Baraka</h3>
              <p className="text-lg font-semibold text-primary">Light & Blessed</p>
              <p className="text-muted-foreground leading-relaxed">
                The third round — gentle and blessed. A moment of gratitude, reflection, and heartfelt connection.
              </p>
            </div>
          </div>

          {/* Quote */}
          <div className="mt-20 max-w-4xl mx-auto">
            <blockquote className="text-center space-y-6">
              <p className="text-2xl md:text-3xl italic text-foreground leading-relaxed">
                "Coffee is our bread, our culture, our connection. It is the thread that weaves through every moment of Ethiopian life."
              </p>
            </blockquote>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center space-y-6">
            <p className="text-xl text-muted-foreground">
              Experience the authentic taste of tradition with Coffee Habesha
            </p>
            <Button size="lg" className="text-lg px-8">
              Explore Our Coffee Selection
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Process;
