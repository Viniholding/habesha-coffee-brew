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

      {/* Three Sacred Rounds Section */}
      <section className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-16">
            <div 
              data-index={3}
              className="animate-on-scroll text-center space-y-6 transition-all duration-700"
            >
              <h2 className="text-5xl md:text-6xl font-bold text-foreground animate-fade-in">
                The Three Sacred Rounds
              </h2>
              <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Each round tells a story, each cup brings us closer
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full" />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Abol", subtitle: "Bold & Beautiful", description: "The first round — strong, rich, and full of life. This is where the conversation begins and the magic unfolds.", delay: "0s" },
                { name: "Tona", subtitle: "Smooth & Social", description: "The second round — mellower and more refined. Perfect for deep conversations and strengthening bonds.", delay: "0.1s" },
                { name: "Baraka", subtitle: "Light & Blessed", description: "The third round — gentle and blessed. A moment of gratitude, reflection, and heartfelt connection.", delay: "0.2s" }
              ].map((round, idx) => (
                <div 
                  key={round.name}
                  data-index={4 + idx}
                  className="animate-on-scroll text-center space-y-4 p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 group"
                  style={{ animationDelay: round.delay }}
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                    <Coffee className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform duration-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{round.name}</h3>
                  <p className="text-primary font-semibold text-lg">{round.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed">
                    {round.description}
                  </p>
                </div>
              ))}
            </div>

            <blockquote 
              data-index={7}
              className="animate-on-scroll text-center text-2xl md:text-3xl text-foreground italic border-l-4 border-primary pl-8 py-6 my-16 max-w-4xl mx-auto hover:border-l-8 transition-all duration-300"
            >
              "Coffee is our bread, our culture, our connection. It is the thread that weaves through every moment of Ethiopian life."
            </blockquote>

            <div 
              data-index={8}
              className="animate-on-scroll text-center space-y-8"
            >
              <p className="text-xl text-muted-foreground">
                Experience the authentic taste of tradition with Coffee Habesha
              </p>
              <a
                href="/products"
                className="inline-block bg-primary text-primary-foreground px-10 py-5 rounded-xl font-semibold text-lg hover:bg-primary/90 hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 group"
              >
                <span className="flex items-center gap-3">
                  Explore Our Coffee Selection
                  <ChevronDown className="w-5 h-5 rotate-[-90deg] group-hover:translate-x-2 transition-transform duration-300" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
