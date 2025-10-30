import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <img src={logo} alt="Coffee Habesha" className="h-12 w-auto" />
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <a href="/about" className="hover:text-primary transition-colors">The Journey</a>
          <a href="/learn" className="hover:opacity-80 transition-opacity flex items-center">
            <img src={logo} alt="Coffee Habesha Way" className="h-8 w-auto" />
          </a>
          <a href="/products" className="hover:text-primary transition-colors">Products</a>
          <a href="/cafe" className="hover:text-primary transition-colors">Café</a>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" asChild>
            <a href="/auth">Login</a>
          </Button>
          <Button variant="hero" size="lg">
            Order Now
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
