import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const TermsOfUse = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Use | Coffee Habesha</title>
        <meta name="description" content="Read the terms and conditions for using the Coffee Habesha website." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Use</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <p className="text-muted-foreground leading-relaxed">
                By accessing this website, you agree to comply with these Terms of Use.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree not to misuse the site or interfere with its operation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Accuracy of Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We strive for accuracy but do not guarantee that product descriptions or pricing are error-free.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on this website is owned by Coffee Habesha unless otherwise stated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are not liable for indirect or consequential damages arising from site usage.
              </p>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TermsOfUse;
