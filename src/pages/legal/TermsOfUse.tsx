import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LegalBreadcrumb from "@/components/legal/LegalBreadcrumb";
import LegalPageWrapper from "@/components/legal/LegalPageWrapper";
import TableOfContents from "@/components/legal/TableOfContents";
import { Helmet } from "react-helmet-async";
import { Mail, AlertTriangle } from "lucide-react";

const tocItems = [
  { id: "use-of-website", title: "1. Use of the Website", level: 2 },
  { id: "product-service-info", title: "2. Product & Service Information", level: 2 },
  { id: "orders-payments", title: "3. Orders & Payments", level: 2 },
  { id: "intellectual-property", title: "4. Intellectual Property", level: 2 },
  { id: "third-party", title: "5. Third-Party Services & Links", level: 2 },
  { id: "disclaimer-warranties", title: "6. Disclaimer of Warranties", level: 2 },
  { id: "limitation-liability", title: "7. Limitation of Liability", level: 2 },
  { id: "governing-law", title: "8. Governing Law", level: 2 },
  { id: "subscription-terms", title: "9. Subscription Terms", level: 2 },
  { id: "promotion-terms", title: "10. Promotion & Coupon Terms", level: 2 },
  { id: "changes-terms", title: "11. Changes to These Terms", level: 2 },
  { id: "contact-info", title: "12. Contact Information", level: 2 },
];

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
          
          <LegalPageWrapper>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms of Use</h1>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: December 14, 2025</p>
          
            <TableOfContents items={tocItems} />
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using this website, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with these terms, please do not use the website.
            </p>

            <section id="use-of-website">
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

            <section id="product-service-info">
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

            <section id="orders-payments">
              <h2 className="text-xl font-semibold mb-3">3. Orders & Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                All purchases made through the website are subject to availability and acceptance. Payment must be completed at checkout. By placing an order, you represent that the information provided is accurate and that you are authorized to use the payment method.
              </p>
            </section>

            <section id="intellectual-property">
              <h2 className="text-xl font-semibold mb-3">4. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                All content on this website — including text, images, graphics, logos, product names, and design elements — is the property of Coffee Habesha LLC, unless otherwise stated.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                You may not copy, reproduce, distribute, modify, or use any content without prior written permission.
              </p>
            </section>

            <section id="third-party">
              <h2 className="text-xl font-semibold mb-3">5. Third-Party Services & Links</h2>
              <p className="text-muted-foreground leading-relaxed">
                This website may contain links to third-party websites or services. Coffee Habesha is not responsible for the content, policies, or practices of third-party sites. Accessing third-party links is at your own risk.
              </p>
            </section>

            <section id="disclaimer-warranties">
              <h2 className="text-xl font-semibold mb-3">6. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                The website and its content are provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the operation of the website or the accuracy of its content.
              </p>
            </section>

            <section id="limitation-liability">
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the fullest extent permitted by law, Coffee Habesha shall not be liable for any indirect, incidental, consequential, or special damages arising from or related to your use of the website, products, or services.
              </p>
            </section>

            <section id="governing-law">
              <h2 className="text-xl font-semibold mb-3">8. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms of Use are governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
              </p>
            </section>

            <section id="subscription-terms">
              <h2 className="text-xl font-semibold mb-3">9. Subscription Terms</h2>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">Subscription Discount Policy</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Subscription purchases receive a discounted price compared to one-time purchases. 
                      If a subscription is canceled before the second scheduled delivery, we reserve the right to 
                      charge the difference between the discounted subscription price and the standard one-time 
                      purchase price for the initial order.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-3">
                By purchasing a subscription, you agree to the following terms:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li><strong>Automatic Billing:</strong> Subscriptions are billed automatically at the frequency you select until canceled.</li>
                <li><strong>Subscription Discounts:</strong> Subscription pricing reflects a promotional discount from standard one-time purchase prices.</li>
                <li><strong>Early Cancellation:</strong> If you cancel before receiving two deliveries, the discount from your first order may be charged back to ensure fair use of promotional pricing.</li>
                <li><strong>Cancellation:</strong> You may cancel your subscription at any time through your account dashboard or by contacting customer support.</li>
                <li><strong>Pause & Skip:</strong> You may pause your subscription or skip individual deliveries through your account settings.</li>
                <li><strong>Price Changes:</strong> We reserve the right to change subscription pricing with 30 days' notice. You may cancel before new pricing takes effect.</li>
              </ul>
            </section>

            <section id="promotion-terms">
              <h2 className="text-xl font-semibold mb-3">10. Promotion & Coupon Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The following terms apply to promotional offers and coupon codes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2">
                <li><strong>No Stacking:</strong> Coupon codes may not be combined with other offers or discounts unless explicitly stated.</li>
                <li><strong>Subscription Exclusions:</strong> Subscription purchases already include a promotional discount and are not eligible for additional coupon codes unless the coupon is specifically marked as subscription-eligible.</li>
                <li><strong>One Per Customer:</strong> Coupons are limited to one use per customer unless otherwise specified.</li>
                <li><strong>Checkout Only:</strong> Coupons must be applied at checkout and cannot be added after an order is placed.</li>
                <li><strong>Expiration:</strong> Coupons may have expiration dates and usage limits.</li>
                <li><strong>Abuse Prevention:</strong> We reserve the right to cancel orders or revoke promotions in cases of suspected misuse or abuse, including but not limited to creating multiple accounts or using automated systems.</li>
              </ul>
            </section>

            <section id="changes-terms">
              <h2 className="text-xl font-semibold mb-3">11. Changes to These Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to update or modify these Terms of Use at any time. Continued use of the website after changes are posted constitutes acceptance of the revised terms.
              </p>
            </section>

            <section id="contact-info">
              <h2 className="text-xl font-semibold mb-3">12. Contact Information</h2>
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
          </LegalPageWrapper>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default TermsOfUse;