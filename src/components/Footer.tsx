import { Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer id="contact" className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link to="/">
              <img src={logo} alt="Coffee Habesha" className="h-12 w-auto" />
            </Link>
            <p className="text-muted-foreground">
              Premium Ethiopian coffee, crafted with passion and delivered with love.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">The Journey</Link></li>
              <li><Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">Products</Link></li>
              <li><Link to="/learn" className="text-muted-foreground hover:text-primary transition-colors">Learn</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4">Subscriptions</h3>
            <ul className="space-y-2">
              <li><Link to="/subscribe" className="text-muted-foreground hover:text-primary transition-colors">Subscribe & Save</Link></li>
              <li><Link to="/subscribe?showQuiz=true" className="text-muted-foreground hover:text-primary transition-colors">Build Your Own</Link></li>
              <li><Link to="/products?category=coffee" className="text-muted-foreground hover:text-primary transition-colors">Shop All Coffees</Link></li>
              <li><Link to="/cafe" className="text-muted-foreground hover:text-primary transition-colors">Visit Our Café</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-4 space-y-2">
              <Link to="/account" className="block text-muted-foreground hover:text-primary transition-colors">My Account</Link>
              <Link to="/account?tab=orders" className="block text-muted-foreground hover:text-primary transition-colors">Order History</Link>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="border-t border-border pt-6 mb-6">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/shipping-returns" className="text-muted-foreground hover:text-primary transition-colors">
              Shipping & Returns
            </Link>
            <Link to="/terms-of-use" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Use
            </Link>
            <Link to="/cookie-policy" className="text-muted-foreground hover:text-primary transition-colors">
              Cookie Policy
            </Link>
            <Link to="/accessibility" className="text-muted-foreground hover:text-primary transition-colors">
              Accessibility
            </Link>
            <Link to="/disclaimer" className="text-muted-foreground hover:text-primary transition-colors">
              Disclaimer
            </Link>
          </nav>
        </div>
        
        <div className="border-t border-border pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Coffee Habesha. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
