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
    image: forestShieldedImage
  },
  {
    number: "02",
    title: "Hand Picked",
    description: "Each cherry is carefully selected by experienced farmers who harvest only the ripest beans, ensuring superior quality in every batch.",
    image: handPickingImage
  },
  {
    number: "03",
    title: "Slow Roasted",
    description: "We roast in small batches using traditional methods, allowing each bean to develop its full, complex flavor profile and aroma.",
    image: slowRoastedImage
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

      {/* Main Content */}
      <section id="about" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold">
              Coffee by <span className="text-primary">Coffee Habesha</span>
            </h2>
            <div className="h-1 w-32 bg-primary mx-auto rounded-full" />
          </div>
          
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p className="text-xl text-center">
              To achieve our unique and famous signature <strong className="text-foreground">Coffee Habesha</strong>, 
              we only use premium Arabica beans, and our coffee beans are single sourced and hand-crafted 
              in small batches to ensure the highest quality.
            </p>
            
            <p>
              Coffee Habesha is both a necessity and a treat all at the same time, delivering pleasure 
              and purpose all in one delicious, decadent, delightful drink. Ethiopian coffee beans are 
              known for being the best coffee in the world. Ethiopian coffee is elegant and has smooth flavor.
            </p>
            
            <p>
              We manage all our milling, processing, and roasting to maximize texture and flavor profile 
              of all our coffee beans. Each sample is cupped (tasted) and graded by a Master Taster to 
              ensure it meets our high standards worthy of the Habesha name.
            </p>
            
            <p className="text-center text-xl pt-4">
              We are honored and proud to share Coffee Habesha with the world. We are sure you will be 
              hooked on the sweet smell and delicate flavor that will excite your taste buds and ensure 
              a satisfied feeling from the first to the last sip.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground mt-2">Premium Arabica</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">Single</div>
              <div className="text-sm text-muted-foreground mt-2">Source Origin</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">Small</div>
              <div className="text-sm text-muted-foreground mt-2">Batch Roasted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">Expert</div>
              <div className="text-sm text-muted-foreground mt-2">Master Tasted</div>
            </div>
          </div>

          {/* Process Steps Section */}
          <div className="pt-16 space-y-12">
            <div className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                From Farm to Cup
              </h3>
              <p className="text-lg text-muted-foreground">
                Every step delivers perfection through centuries of tradition
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step) => (
                <div key={step.number} className="text-center space-y-4">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="text-5xl font-bold text-white/90">{step.number}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">STEP {step.number}</p>
                    <h4 className="text-2xl font-bold text-foreground mb-3">
                      {step.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
};

export default About;
