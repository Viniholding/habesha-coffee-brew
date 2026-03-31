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
  { id: "governing-law", title: "8. Choice of Law & Dispute Resolution", level: 2 },
  { id: "subscription-terms", title: "9. Subscription Terms", level: 2 },
  { id: "promotion-terms", title: "10. Promotion & Coupon Terms", level: 2 },
  { id: "changes-terms", title: "11. Changes to These Terms", level: 2 },
  { id: "contact-info", title: "12. Contact Information", level: 2 },
];

const subscriptionSubItems = [
  { id: "sub-automatic-billing", title: "9.1 Automatic Billing" },
  { id: "sub-discounts", title: "9.2 Subscription Discounts" },
  { id: "sub-early-cancellation", title: "9.3 Early Cancellation" },
  { id: "sub-cancellation", title: "9.4 Cancellation" },
  { id: "sub-pause-skip", title: "9.5 Pause & Skip" },
  { id: "sub-price-changes", title: "9.6 Price Changes" },
  { id: "sub-failed-payments", title: "9.7 Failed Payments" },
  { id: "sub-no-refunds", title: "9.8 No Refunds on Delivered Orders" },
  { id: "sub-consent", title: "9.9 Consent & Agreement" },
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
              <p className="text-muted-foreground leading-relaxed mb-4">
                By purchasing a subscription through coffeehabesha.com, you agree to the following terms. Please read them carefully before subscribing. These terms govern all Coffee Habesha subscription plans, including weekly, bi-weekly, and monthly delivery options.
              </p>

              <div className="space-y-6 ml-2">
                <div id="sub-automatic-billing">
                  <h3 className="text-lg font-medium mb-2">1. Automatic Billing</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Subscriptions are billed automatically at the frequency you select (weekly, bi-weekly, or monthly) until canceled. Your payment method on file will be charged at the start of each billing cycle. By subscribing, you authorize Coffee Habesha, LLC to charge your payment method on a recurring basis until you cancel.
                  </p>
                </div>

                <div id="sub-discounts">
                  <h3 className="text-lg font-medium mb-2">2. Subscription Discounts</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Subscription pricing reflects a 10% promotional discount from standard one-time purchase prices. This discount is applied automatically at checkout and reflected in your order confirmation. Discount availability is subject to change for new subscriptions with 30 days' notice.
                  </p>
                </div>

                <div id="sub-early-cancellation">
                  <h3 className="text-lg font-medium mb-2">3. Early Cancellation</h3>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    If you cancel your subscription before your second delivery is fulfilled, the promotional discount applied to your first order will be charged back to your payment method at the time of cancellation. By subscribing, you explicitly authorize this charge.
                  </p>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        <strong className="text-amber-800 dark:text-amber-200">Important:</strong> You're receiving a discounted subscription price. If the subscription is canceled before the second delivery, the discount applied to the first order will be charged back. See these Terms for details.
                      </p>
                    </div>
                  </div>
                </div>

                <div id="sub-cancellation">
                  <h3 className="text-lg font-medium mb-2">4. Cancellation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You may cancel your subscription at any time through your account dashboard or by contacting customer support at{" "}
                    <a href="mailto:info@coffeehabesha.com" className="text-primary hover:underline">info@coffeehabesha.com</a> or{" "}
                    <a href="tel:+18777880389" className="text-primary hover:underline">(877) 788-0389</a>. Cancellations take effect at the end of the current billing period. You will not be charged for the next cycle, and no partial refunds are issued for the remainder of a paid period.
                  </p>
                </div>

                <div id="sub-pause-skip">
                  <h3 className="text-lg font-medium mb-2">5. Pause & Skip</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You may pause your subscription or skip individual deliveries through your account settings. Subscriptions may be paused for up to 60 consecutive days. Paused subscriptions resume automatically at the end of the pause period. Skipping or pausing a delivery does not extend your subscription or affect your billing cycle timing.
                  </p>
                </div>

                <div id="sub-price-changes">
                  <h3 className="text-lg font-medium mb-2">6. Price Changes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to change subscription pricing with 30 days' advance notice. Notice will be provided via email to the address on your account. You may cancel your subscription before new pricing takes effect without penalty. Continued use of your subscription after the effective date of a price change constitutes acceptance of the new price.
                  </p>
                </div>

                <div id="sub-failed-payments">
                  <h3 className="text-lg font-medium mb-2">7. Failed Payments</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If a payment fails, we will retry your payment method up to three times over a 7-day period. If payment cannot be successfully collected after three attempts, your subscription will be paused and no delivery will be made for that cycle. You will receive an email notification and may update your billing information through your account dashboard to resume your subscription.
                  </p>
                </div>

                <div id="sub-no-refunds">
                  <h3 className="text-lg font-medium mb-2">8. No Refunds on Delivered Orders</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All delivered orders are final. Refunds are not issued for delivered subscription orders except in cases of product defect, shipping damage, or carrier error. If your order arrives damaged or incorrect, please contact us within 7 days of delivery at{" "}
                    <a href="mailto:info@coffeehabesha.com" className="text-primary hover:underline">info@coffeehabesha.com</a> with a description and photo of the issue and we will make it right.
                  </p>
                </div>

                <div id="sub-consent">
                  <h3 className="text-lg font-medium mb-2">9. Consent & Agreement</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    By completing your subscription purchase, you confirm that you have read, understood, and agree to these Subscription Terms of Use. Your electronic consent at checkout constitutes a legally binding agreement. These terms are incorporated into and form part of Coffee Habesha's full Terms of Use available at{" "}
                    <a href="/terms-of-use" className="text-primary hover:underline">coffeehabesha.com/terms</a>.
                  </p>
                </div>
              </div>
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