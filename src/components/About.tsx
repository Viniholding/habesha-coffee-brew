import { ChevronDown, Sparkles, Coffee, Heart } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [visibleSections, setVisibleSections] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleSections(prev => new Set(prev).add(index));
          }
        });
      },
      { threshold: 0.2 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

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
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: `url(${ethiopianHighlandsHero})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto animate-fade-in">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight hover:scale-105 transition-transform duration-500">
            From Ethiopian Highlands to Your Cup
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-sans leading-relaxed max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Discover the journey of exceptional coffee
          </p>
        </div>

        <button
          onClick={scrollToContent}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/80 hover:text-white transition-all hover:translate-y-1 hover:scale-110"
          aria-label="Scroll to content"
        >
          <ChevronDown className="w-12 h-12 animate-bounce" />
        </button>
      </section>

      {/* Process Steps Section */}
      <section id="process" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-24">
            {processSteps.map((step, index) => (
              <div 
                key={step.number}
                data-index={index}
                className={`animate-on-scroll flex flex-col md:flex-row gap-12 items-center transition-all duration-700 ${
                  index === 1 ? '' : 'md:flex-row-reverse'
                } ${
                  visibleSections.has(index) 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-20'
                }`}
                style={{ transitionDelay: `${index * 0.2}s` }}
              >
                <div className="md:w-1/2 group">
                  <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-500">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-6 left-6 transform group-hover:scale-110 transition-transform duration-500">
                      <span className="text-6xl font-bold text-white/90 drop-shadow-lg">{step.number}</span>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 space-y-6 group">
                  <div className="flex items-center gap-3">
                    {index === 0 && <Sparkles className="w-5 h-5 text-primary animate-pulse" />}
                    {index === 1 && <Heart className="w-5 h-5 text-primary animate-pulse" />}
                    {index === 2 && <Coffee className="w-5 h-5 text-primary animate-pulse" />}
                    <p className="text-sm font-semibold text-primary tracking-wider">STEP {step.number}</p>
                  </div>
                  <h4 className="text-4xl md:text-5xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h4>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <div className="w-20 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full transform origin-left group-hover:scale-x-150 transition-transform duration-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
