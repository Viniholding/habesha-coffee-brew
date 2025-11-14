import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-coffee.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/85 to-background" />
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-1000">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
            Coffee <span className="text-primary">Habesha</span>
          </h1>
          <p className="text-3xl md:text-5xl font-serif italic text-primary">
            Love at first sip
          </p>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Premium Ethiopian Arabica beans, single sourced and hand-crafted in small batches 
            to deliver the world's finest coffee experience
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button variant="hero" size="lg" className="text-lg px-8 py-6 h-auto" asChild>
              <Link to="/products">Shop Now</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-primary/50 hover:border-primary" asChild>
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"style={{bottom:'2rem'}}>
        <ChevronDown className="w-8 h-8 text-primary/70" />
      </div>
    </section>
  );
};

export default Hero;
