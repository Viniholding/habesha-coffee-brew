import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

const ShippingReturns = () => {
  return (
    <>
      <Helmet>
        <title>Shipping & Returns | Coffee Habesha</title>
        <meta name="description" content="Learn about our shipping process, delivery times, and return policy for Coffee Habesha products." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Shipping, Returns & Refund Policy</h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">Order Processing & Delivery</h2>
              <p className="text-muted-foreground leading-relaxed">
                Orders are processed within 24–48 business hours. U.S. delivery typically takes 5–7 business days. International delivery may take 15–30 business days. Tracking information will be provided once your order ships.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Shipping Responsibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                We are not responsible for shipping delays caused by carriers, customs, or incorrect address information. Undeliverable orders may be canceled and refunded within 10 business days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Returns & Refunds</h2>
              <p className="text-muted-foreground leading-relaxed">
                Due to the nature of our products, all sales are final. We do not offer returns, refunds, or exchanges once an order is placed.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Damaged Orders</h2>
              <p className="text-muted-foreground leading-relaxed">
                If your order arrives damaged, contact us within 24–48 hours with your order number and photos of the damage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                Email: <a href="mailto:sales@coffeehabesha.com" className="text-primary hover:underline">sales@coffeehabesha.com</a>
              </p>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ShippingReturns;
