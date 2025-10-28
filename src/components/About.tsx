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

      {/* Company Bio Section - Creative Layout */}
      <section className="py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          {/* Title Section - Asymmetric */}
          <div className="max-w-4xl mb-20 animate-fade-in">
            <p className="text-primary font-semibold tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              OUR STORY
            </p>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight mb-8">
              Coffee by{" "}
              <span className="text-primary relative inline-block">
                Coffee Habesha
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </span>
            </h2>
          </div>

          {/* Story Grid - Creative Positioning */}
          <div className="grid md:grid-cols-2 gap-16 items-start mb-20">
            {/* Left Column */}
            <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="bg-card/50 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5">
                <Coffee className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">Born from Excellence</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Our signature <span className="font-bold text-primary">Coffee Habesha</span> isn't just coffee—it's a promise. 
                  Every bean tells the story of Ethiopia's highlands, carefully selected from premium Arabica harvests and 
                  hand-crafted in small batches that honor centuries of tradition.
                </p>
              </div>

              <div className="pl-8 border-l-4 border-primary/30">
                <p className="text-xl leading-relaxed text-foreground italic">
                  "Ethiopian coffee beans are known for being the best coffee in the world. 
                  Our coffee is elegant, smooth, and carries the soul of its homeland."
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8 md:mt-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="bg-card/50 backdrop-blur-sm p-8 rounded-2xl border border-primary/10 hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5">
                <Heart className="w-12 h-12 text-primary mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-foreground">Necessity Meets Pleasure</h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Coffee Habesha is both ritual and reward—delivering purpose and pleasure in every delicious, 
                  decadent, delightful cup. It's the morning motivation and the afternoon escape, 
                  crafted for those who know that life's best moments deserve exceptional coffee.
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Master Crafted Quality
                </h3>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  We control every step: milling, processing, roasting. Each batch is cupped and graded by 
                  a Master Taster, ensuring only beans worthy of the Habesha name reach your cup. 
                  This is coffee crafted with precision, passion, and pride.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Divider */}
      <div className="relative py-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-24 h-px bg-gradient-to-r from-transparent to-primary"></div>
            <Coffee className="w-8 h-8 text-primary animate-pulse" />
            <div className="w-24 h-px bg-gradient-to-l from-transparent to-primary"></div>
          </div>
        </div>
      </div>

      {/* Process Steps Section */}
      <section id="process" className="py-32 bg-background">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <p className="text-primary font-semibold tracking-wider mb-4 flex items-center justify-center gap-2">
              <Coffee className="w-5 h-5" />
              THE JOURNEY
            </p>
            <h3 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              From Highland to Home
            </h3>
            <p className="text-xl text-muted-foreground">
              Every cup begins with a journey through Ethiopia's pristine forests, 
              guided by tradition and perfected by expertise.
            </p>
          </div>

          <div className="max-w-6xl mx-auto space-y-32">
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
                    {index === 0 && <Sparkles className="w-6 h-6 text-primary animate-pulse" />}
                    {index === 1 && <Heart className="w-6 h-6 text-primary animate-pulse" />}
                    {index === 2 && <Coffee className="w-6 h-6 text-primary animate-pulse" />}
                    <p className="text-sm font-bold text-primary tracking-widest">STEP {step.number}</p>
                  </div>
                  <h4 className="text-5xl md:text-6xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h4>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <div className="flex gap-2 items-center pt-4">
                    <div className="w-24 h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full transform origin-left group-hover:scale-x-150 transition-transform duration-500" />
                    <ChevronDown className="w-5 h-5 text-primary rotate-[-90deg] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section - Creative */}
          <div className="mt-32 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm p-12 md:p-16 rounded-3xl border border-primary/20 text-center">
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                Ready to Experience{" "}
                <span className="text-primary">Excellence?</span>
              </h3>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Discover our curated collection of premium Ethiopian coffee, 
                each blend telling its own unique story.
              </p>
              <a
                href="/products"
                className="group inline-flex items-center gap-3 bg-primary text-primary-foreground px-12 py-6 rounded-2xl font-bold text-xl hover:bg-primary/90 hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
              >
                Explore our Products
                <Coffee className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
