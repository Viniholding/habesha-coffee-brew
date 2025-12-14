import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const Accessibility = () => {
  return (
    <>
      <Helmet>
        <title>Accessibility | Coffee Habesha</title>
        <meta name="description" content="Coffee Habesha is committed to ensuring our website is accessible to all users." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Accessibility Statement</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Our Commitment</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are committed to ensuring our website is accessible to all users.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Need Assistance?</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you experience difficulty accessing content or placing an order, please contact us at{" "}
                <a href="mailto:sales@coffeehabesha.com" className="text-primary hover:underline">
                  sales@coffeehabesha.com
                </a>{" "}
                and we will make reasonable efforts to assist you.
              </p>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Accessibility;
