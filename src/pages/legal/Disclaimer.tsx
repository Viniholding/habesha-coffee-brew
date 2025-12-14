import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const Disclaimer = () => {
  return (
    <>
      <Helmet>
        <title>Disclaimer | Coffee Habesha</title>
        <meta name="description" content="Read the disclaimer for Coffee Habesha website content and external links." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Disclaimer</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Informational Purposes</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on this website is provided for informational purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">No Medical Advice</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not provide medical, health, or nutritional advice. Please consult a qualified professional if you have concerns related to caffeine consumption.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Third-Party Content</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are not responsible for third-party content or external links.
              </p>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Disclaimer;
