import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import SearchBar from "./SearchBar";
import ShoppingCart from "./ShoppingCart";
import { logger } from "@/lib/logger";

const Navigation = () => {
  const navigate = useNavigate();
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchUserAvatar(session.user.id);
        fetchPendingOrders(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchUserAvatar(session.user.id);
        fetchPendingOrders(session.user.id);
      } else {
        setAvatarUrl("");
        setUserId(null);
        setPendingOrdersCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserAvatar = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      logger.error("Error fetching avatar:", error);
    }
  };

  const fetchPendingOrders = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["processing", "shipped"]);

      if (error) throw error;
      setPendingOrdersCount(count || 0);
    } catch (error) {
      logger.error("Error fetching pending orders:", error);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
      setMobileMenuOpen(false);
    }
  };

  const navigateToSection = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/">
          <img src={logo} alt="Coffee Habesha" className="h-12 w-auto" />
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <Link to="/about" className="hover:text-primary transition-colors">The Journey</Link>
          <Link to="/learn" className="hover:opacity-80 transition-opacity flex items-center">
            <img src={logo} alt="Coffee Habesha Way" className="h-8 w-auto" />
          </Link>
          <Link to="/products" className="hover:text-primary transition-colors">Shop</Link>
          <Link to="/subscribe" className="hover:text-primary transition-colors">Subscribe</Link>
          <Link to="/cafe" className="hover:text-primary transition-colors">Café</Link>
        </div>
        
        {/* Desktop Search & Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <SearchBar />
          
          <ShoppingCart userId={userId} />
          
          {isLoggedIn ? (
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-300 active:scale-95"
              onClick={() => navigate("/account?tab=orders")}
            >
              <Avatar className="h-10 w-10 ring-2 ring-border">
                <AvatarImage src={avatarUrl} alt="Profile" />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
              {pendingOrdersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {pendingOrdersCount}
                </Badge>
              )}
            </Button>
          ) : (
            <Button variant="outline" size="lg" onClick={() => navigate("/auth")}>
              My Account
            </Button>
          )}
          <Button variant="hero" size="lg" onClick={() => navigate("/products")}>
            Shop Now
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex lg:hidden items-center gap-2">
          <ShoppingCart userId={userId} />
          
          {isLoggedIn && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative rounded-full active:scale-95 transition-transform duration-150"
              onClick={() => navigateToSection("/account?tab=orders")}
            >
              <Avatar className="h-9 w-9 ring-2 ring-border">
                <AvatarImage src={avatarUrl} alt="Profile" />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              {pendingOrdersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                >
                  {pendingOrdersCount}
                </Badge>
              )}
            </Button>
          )}
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-6 mt-8">
                <div className="mb-4">
                  <SearchBar isMobile />
                </div>
                
                <Link 
                  to="/" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/about" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  The Journey
                </Link>
                <Link 
                  to="/learn" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Coffee Habesha Way
                </Link>
                <Link 
                  to="/products" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Shop
                </Link>
                <Link 
                  to="/subscribe" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Subscribe
                </Link>
                <Link 
                  to="/cafe" 
                  className="text-lg font-medium hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Café
                </Link>
                
                <div className="pt-6 border-t border-border space-y-3">
                  {!isLoggedIn && (
                    <Button variant="outline" size="lg" className="w-full" onClick={() => navigateToSection("/auth")}>
                      My Account
                    </Button>
                  )}
                  <Button variant="hero" size="lg" className="w-full" onClick={() => navigateToSection("/products")}>
                    Shop Now
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
