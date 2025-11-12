import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // ✅ import ONCE

import Index from "./pages/Index";
import AboutPage from "./pages/About";
import ProductsPage from "./pages/ProductsPage";
import Cafe from "./pages/Cafe";
import ContactPage from "./pages/Contact";
import Learn from "./pages/Learn";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

// If these files live under ./pages, import from there:
import ProfileSettings from "./pages/ProfileSettings";
import AccountDelete from "./pages/AccountDelete";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

/** Small gate to fetch the current user and pass userId to children pages */
function AuthGate({
  children,
}: {
  children: (ctx: { userId: string }) => JSX.Element;
}) {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!mounted) return;
      if (error || !data.user) {
        setUserId(null);
      } else {
        setUserId(data.user.id);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // You can redirect to /auth if not logged in:
  if (!userId) {
    return <Auth />;
  }

  return children({ userId });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/cafe" element={<Cafe />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Account hub */}
          <Route path="/account" element={<Account />} />

          {/* Profile settings (the page you pasted) */}
          <Route
            path="/account/profile"
            element={
              <AuthGate>
                {({ userId }) => <ProfileSettings userId={userId} />}
              </AuthGate>
            }
          />

          {/* Delete flow page (password + type DELETE; shows DELETE PERMANENTLY) */}
          <Route
            path="/account/delete"
            element={
              <AuthGate>
                {() => <AccountDelete />}
              </AuthGate>
            }
          />

          {/* Keep this last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

