import { ChevronDown } from "lucide-react";
import forestShieldedImage from "@/assets/forest-shielded.png";
import handPickingImage from "@/assets/hand-picking.png";
import slowRoastedImage from "@/assets/slow-roasted.png";
import ethiopianHighlandsHero from "@/assets/ethiopian-highlands-hero.png";


const processSteps = [
  {
    number: "01",
    title: "Forest Shielded",
    description: "Our premium Arabica beans grow naturally in Ethiopia's lush, protected forest highlands, where the perfect climate creates exceptional flavor.",
    image: forestShieldedImage,
    imagePosition: "left"
  },
  {
    number: "02",
    title: "Hand Picked",
    description: "Each cherry is carefully selected by experienced farmers who harvest only the ripest beans, ensuring superior quality in every batch.",
    image: handPickingImage,
    imagePosition: "right"
  },
  {
    number: "03",
    title: "Slow Roasted",
    description: "We roast in small batches using traditional methods, allowing each bean to develop its full, complex flavor profile and aroma.",
    image: slowRoastedImage,
    imagePosition: "left"
  }
];

const About = () => {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth"
    });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${ethiopianHighlandsHero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            From Ethiopian Highlands to Your Cup
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-sans leading-relaxed max-w-3xl mx-auto">
            Discover the journey of exceptional coffee
          </p>
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/80 hover:text-white transition-all hover:translate-y-1"
          aria-label="Scroll to content"
        >
          <ChevronDown className="w-12 h-12 animate-bounce" />
        </button>
      </section>

      {/* Process Steps Section */}
      <section id="process" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-16">
            {processSteps.map((step, index) => (
              <div 
                key={step.number} 
                className={`flex flex-col md:flex-row gap-8 items-center ${
                  index === 1 ? '' : 'md:flex-row-reverse'
                }`}
              >
                <div className="md:w-1/2">
                  <div className="relative aspect-square rounded-2xl overflow-hidden">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="text-5xl font-bold text-white/90">{step.number}</span>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 space-y-4">
                  <p className="text-sm text-muted-foreground">STEP {step.number}</p>
                  <h4 className="text-3xl md:text-4xl font-bold text-foreground">
                    {step.title}
                  </h4>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Three Sacred Rounds Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                The Three Sacred Rounds
              </h2>
              <p className="text-lg text-muted-foreground">
                Each round tells a story, each cup brings us closer
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-4 p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <h3 className="text-2xl font-bold text-foreground">Abol</h3>
                <p className="text-primary font-semibold">Bold & Beautiful</p>
                <p className="text-muted-foreground">
                  The first round — strong, rich, and full of life. This is where the conversation begins and the magic unfolds.
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <h3 className="text-2xl font-bold text-foreground">Tona</h3>
                <p className="text-primary font-semibold">Smooth & Social</p>
                <p className="text-muted-foreground">
                  The second round — mellower and more refined. Perfect for deep conversations and strengthening bonds.
                </p>
              </div>

              <div className="text-center space-y-4 p-6 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <h3 className="text-2xl font-bold text-foreground">Baraka</h3>
                <p className="text-primary font-semibold">Light & Blessed</p>
                <p className="text-muted-foreground">
                  The third round — gentle and blessed. A moment of gratitude, reflection, and heartfelt connection.
                </p>
              </div>
            </div>

            <blockquote className="text-center text-xl md:text-2xl text-foreground italic border-l-4 border-primary pl-6 py-4 my-12">
              "Coffee is our bread, our culture, our connection. It is the thread that weaves through every moment of Ethiopian life."
            </blockquote>

            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Experience the authentic taste of tradition with Coffee Habesha
              </p>
              <a
                href="/products"
                className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors"
              >
                Explore Our Coffee Selection
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
