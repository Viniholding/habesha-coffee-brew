import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LegalBreadcrumb from "@/components/legal/LegalBreadcrumb";
import { Helmet } from "react-helmet-async";

const CookiePolicy = () => {
  return (
    <>
      <Helmet>
        <title>Cookie Policy | Coffee Habesha</title>
        <meta name="description" content="Learn about how Coffee Habesha uses cookies to improve your browsing experience." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <LegalBreadcrumb currentPage="Cookie Policy" />
          
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Cookie Policy</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">What Are Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small files stored on your device to improve site functionality.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies for essential site operation, analytics, and user preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may disable cookies through your browser settings, but some features may not function properly.
              </p>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CookiePolicy;
