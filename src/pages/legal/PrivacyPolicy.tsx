import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Coffee Habesha</title>
        <meta name="description" content="Learn how Coffee Habesha collects, uses, and protects your personal information." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <p className="text-muted-foreground leading-relaxed">
                We respect your privacy and collect personal information only when voluntarily provided.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Information Collected</h2>
              <p className="text-muted-foreground leading-relaxed">
                Information collected may include name, email, billing and shipping address, payment details required to process orders, and order history.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Use of Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Information is used to process orders, deliver products, communicate updates, and improve our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Sharing</h2>
              <p className="text-muted-foreground leading-relaxed">
                We do not sell or rent personal information. Data may be shared only with trusted partners necessary to fulfill orders.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Policy Updates</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this policy periodically. Continued use of the site indicates acceptance.
              </p>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicy;
