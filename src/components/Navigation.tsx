import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coffee className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Coffee Habesha</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="#home" className="hover:text-primary transition-colors">Home</a>
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#process" className="hover:text-primary transition-colors">Our Process</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>
        
        <Button variant="hero" size="lg">
          Order Now
        </Button>
      </div>
    </nav>
  );
};

export default Navigation;
