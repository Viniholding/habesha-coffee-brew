import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const Navigation = () => {
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user?.id) {
        fetchUserAvatar(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user?.id) {
        fetchUserAvatar(session.user.id);
      } else {
        setAvatarUrl("");
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
      console.error("Error fetching avatar:", error);
    }
  };
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
          {isLoggedIn ? (
            <Button variant="ghost" size="icon" className="rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-300" asChild>
              <a href="/account">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarImage src={avatarUrl} alt="Profile" />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="lg" asChild>
              <a href="/account">My Account</a>
            </Button>
          )}
          <Button variant="hero" size="lg" asChild>
            <a href="/products">Shop Now</a>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
