import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LegalBreadcrumb from "@/components/legal/LegalBreadcrumb";
import { Helmet } from "react-helmet-async";
import { Mail } from "lucide-react";

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
          <LegalBreadcrumb currentPage="Terms of Use" />
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Use</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: December 14, 2025</p>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using this website, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with these terms, please do not use the website.
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Use of the Website</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You may use this website for lawful purposes only. You agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Misuse or interfere with the operation or security of the website</li>
                <li>Attempt to gain unauthorized access to any portion of the site</li>
                <li>Use the site in a way that violates applicable laws or regulations</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                We reserve the right to restrict or terminate access to the website if these terms are violated.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Product & Service Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We make reasonable efforts to display accurate product descriptions, pricing, and availability. However:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Product descriptions, images, and pricing are provided for informational purposes only</li>
                <li>Errors or omissions may occur</li>
                <li>We reserve the right to correct errors and update information at any time without prior notice</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Placing an order constitutes an offer to purchase, which we may accept or decline at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Orders & Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                All purchases made through the website are subject to availability and acceptance. Payment must be completed at checkout. By placing an order, you represent that the information provided is accurate and that you are authorized to use the payment method.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                All content on this website — including text, images, graphics, logos, product names, and design elements — is the property of Coffee Habesha LLC, unless otherwise stated.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                You may not copy, reproduce, distribute, modify, or use any content without prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Third-Party Services & Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                This website may contain links to third-party websites or services. Coffee Habesha is not responsible for the content, policies, or practices of third-party sites. Accessing third-party links is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                The website and its content are provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the operation of the website or the accuracy of its content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by law, Coffee Habesha shall not be liable for any indirect, incidental, consequential, or special damages arising from or related to your use of the website, products, or services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Use are governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Changes to These Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to update or modify these Terms of Use at any time. Continued use of the website after changes are posted constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Use, please contact us at:
              </p>
              <p className="mt-2">
                <a 
                  href="mailto:sales@coffeehabesha.com" 
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  sales@coffeehabesha.com
                </a>
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
