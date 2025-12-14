import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import AboutPage from "./pages/About";
import ProductsPage from "./pages/ProductsPage";
import ProductDetail from "./pages/ProductDetail";
import Cafe from "./pages/Cafe";
import ContactPage from "./pages/Contact";
import Learn from "./pages/Learn";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import AccountDelete from "./pages/AccountDelete";
import Goodbye from "./pages/Goodbye";
import DeletionScheduled from "./pages/DeletionScheduled";
import Admin from "./pages/Admin";
import Subscribe from "./pages/Subscribe";
import SubscriptionReview from "./pages/SubscriptionReview";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import ShippingReturns from "./pages/legal/ShippingReturns";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfUse from "./pages/legal/TermsOfUse";
import CookiePolicy from "./pages/legal/CookiePolicy";
import Accessibility from "./pages/legal/Accessibility";
import Disclaimer from "./pages/legal/Disclaimer";
import LegalHub from "./pages/legal/LegalHub";
import { initErrorTracking } from "@/lib/sentry";

// Initialize global error tracking
initErrorTracking();

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:productId" element={<ProductDetail />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/cafe" element={<Cafe />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/account" element={<Account />} />
              <Route path="/account/delete" element={<AccountDelete />} />
              <Route path="/account/deletion-scheduled" element={<DeletionScheduled />} />
              <Route path="/goodbye" element={<Goodbye />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="/subscription/review" element={<SubscriptionReview />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/admin/*" element={<Admin />} />
              {/* Legal Pages */}
              <Route path="/legal" element={<LegalHub />} />
              <Route path="/shipping-returns" element={<ShippingReturns />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/accessibility" element={<Accessibility />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
