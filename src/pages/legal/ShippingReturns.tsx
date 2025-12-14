import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LegalBreadcrumb from "@/components/legal/LegalBreadcrumb";
import { Helmet } from "react-helmet-async";
import { Mail, Package, Globe, AlertTriangle, Clock, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ShippingReturns = () => {
  return (
    <>
      <Helmet>
        <title>Shipping & Returns | Coffee Habesha</title>
        <meta name="description" content="Learn about Coffee Habesha shipping times, delivery options, international shipping, and return policy." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <LegalBreadcrumb currentPage="Shipping & Returns" />
          
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Shipping, Returns & Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last Updated: December 14, 2025</p>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            
            {/* Shipping Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold m-0">Shipping Information</h2>
              </div>

              <h3 className="text-lg font-medium mb-2 mt-4">Order Processing</h3>
              <p className="text-muted-foreground leading-relaxed">
                Orders are processed within 24–48 business hours (Monday–Friday, excluding holidays). Orders placed on weekends or holidays will be processed the next business day. You will receive an email confirmation once your order has shipped, including tracking information.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">Domestic Shipping (United States)</h3>
              <div className="bg-muted/50 rounded-lg p-4 mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">Shipping Method</th>
                      <th className="text-left py-2 font-medium">Estimated Delivery</th>
                      <th className="text-left py-2 font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">Standard Shipping</td>
                      <td className="py-2">5–7 business days</td>
                      <td className="py-2">Free on orders $50+</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">Expedited Shipping</td>
                      <td className="py-2">3–5 business days</td>
                      <td className="py-2">$9.99</td>
                    </tr>
                    <tr>
                      <td className="py-2">Express Shipping</td>
                      <td className="py-2">1–2 business days</td>
                      <td className="py-2">$19.99</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                * Delivery times are estimates and not guaranteed. Actual delivery may vary based on carrier and location.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold m-0">International Shipping</h2>
              </div>
              
              <p className="text-muted-foreground leading-relaxed mb-3">
                We ship to select international destinations. International shipping rates and delivery times vary by location.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">Delivery Estimates by Region</h3>
              <div className="bg-muted/50 rounded-lg p-4 mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium">Region</th>
                      <th className="text-left py-2 font-medium">Estimated Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2">Canada</td>
                      <td className="py-2">7–14 business days</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">Europe (EU/UK)</td>
                      <td className="py-2">10–21 business days</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2">Australia / New Zealand</td>
                      <td className="py-2">14–28 business days</td>
                    </tr>
                    <tr>
                      <td className="py-2">Rest of World</td>
                      <td className="py-2">15–30 business days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-medium mb-2 mt-4">Customs, Duties & Taxes</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>International orders may be subject to import duties, taxes, and customs fees</li>
                <li>These charges are the responsibility of the recipient and are not included in the order total</li>
                <li>We cannot predict or control customs delays or additional charges</li>
                <li>Please check with your local customs office for more information on import regulations</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Restricted Countries</h3>
              <p className="text-muted-foreground leading-relaxed">
                Due to shipping restrictions and regulations, we may be unable to ship to certain countries. If your country is not available at checkout, we currently do not ship to your location.
              </p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold m-0">Shipping Issues</h2>
              </div>

              <h3 className="text-lg font-medium mb-2 mt-4">Lost or Delayed Packages</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We are not responsible for shipping delays caused by:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Carrier delays (weather, high volume, operational issues)</li>
                <li>Customs processing or inspection</li>
                <li>Incorrect or incomplete address information provided by the customer</li>
                <li>Failed delivery attempts due to recipient unavailability</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                If your package shows as delivered but you have not received it, please contact the carrier directly. If your tracking has not updated for more than 7 business days (domestic) or 21 business days (international), please contact us.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">Undeliverable Packages</h3>
              <p className="text-muted-foreground leading-relaxed">
                Packages returned to us as undeliverable due to incorrect address, refused delivery, or unclaimed shipments may be refunded minus the original shipping cost. Re-shipping fees will apply.
              </p>
            </section>

            {/* Returns Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold m-0">Returns & Refunds Policy</h2>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                <p className="font-medium text-primary mb-1">Important Notice</p>
                <p className="text-sm text-muted-foreground">
                  Due to the perishable nature of our coffee products, all sales are final. We do not accept returns or offer refunds for change of mind, incorrect orders placed by the customer, or taste preferences.
                </p>
              </div>

              <h3 className="text-lg font-medium mb-2 mt-4">When We May Offer a Refund or Replacement</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We will review refund or replacement requests on a case-by-case basis for the following situations:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Damaged Products:</strong> Items arrived damaged during shipping</li>
                <li><strong>Defective Products:</strong> Products are spoiled, stale, or significantly different from description</li>
                <li><strong>Wrong Items:</strong> You received an item different from what you ordered (our error)</li>
                <li><strong>Missing Items:</strong> Items listed on your order were not included in the package</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">How to Report an Issue</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To request a refund or replacement, you must:
              </p>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-2">
                <li>Contact us within <strong>48 hours</strong> of delivery</li>
                <li>Provide your order number</li>
                <li>Include clear photos of the damaged/defective product and packaging</li>
                <li>Describe the issue in detail</li>
              </ol>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Requests submitted after 48 hours may not be eligible for refund or replacement.
              </p>

              <h3 className="text-lg font-medium mb-2 mt-4">Refund Process</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Approved refunds will be processed within 5–7 business days</li>
                <li>Refunds are issued to the original payment method</li>
                <li>Shipping costs are non-refundable unless the error was on our part</li>
                <li>Depending on your bank, it may take an additional 5–10 business days for the refund to appear</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Non-Refundable Items</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Products that have been opened or used (unless defective)</li>
                <li>Items purchased during final sale or clearance promotions</li>
                <li>Gift cards or store credit</li>
                <li>Subscription orders after the shipment has been processed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Subscription Orders</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                For subscription orders, please note:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>You may pause, skip, or cancel your subscription at any time before the next billing date</li>
                <li>Once a subscription order has been processed and shipped, it cannot be canceled or refunded</li>
                <li>Manage your subscription through your account dashboard</li>
              </ul>
            </section>

            {/* FAQ Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold m-0">Frequently Asked Questions</h2>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">How long does shipping take?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Domestic orders typically arrive within 5–7 business days with standard shipping. Expedited (3–5 days) and express (1–2 days) options are available at checkout. International orders can take 7–30 business days depending on the destination.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">Do you offer free shipping?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! We offer free standard shipping on all domestic orders over $50. International orders and expedited shipping options have additional fees calculated at checkout.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">How can I track my order?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Once your order ships, you'll receive an email with tracking information. You can also log into your account and view your order history to track shipments. If you checked out as a guest, use the tracking link in your confirmation email.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">What if my package is lost or stolen?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    If tracking shows your package as delivered but you haven't received it, first check with neighbors and your local post office. If the package cannot be located, contact us within 48 hours of the delivery date. We'll work with the carrier to investigate and may offer a replacement or refund at our discretion.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">Can I change my shipping address after placing an order?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Address changes can only be made if the order has not yet been processed. Please contact us immediately at sales@coffeehabesha.com. Once an order has shipped, we cannot modify the delivery address.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">Do you ship to P.O. boxes or APO/FPO addresses?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, we ship to P.O. boxes and military APO/FPO addresses within the United States. Please note that delivery times may be longer for these addresses, and expedited shipping options may not be available.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-left">Why can't I return my coffee?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Coffee is a perishable food product, and we roast fresh to order. For food safety and quality reasons, we cannot accept returns of opened or used products. However, if your order arrived damaged or defective, please contact us within 48 hours and we'll make it right.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger className="text-left">My coffee arrived damaged. What should I do?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We're sorry to hear that! Please contact us at sales@coffeehabesha.com within 48 hours of delivery. Include your order number and photos of the damaged product and packaging. We'll review your request and arrange for a replacement or refund.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger className="text-left">How long do refunds take to process?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Approved refunds are processed within 5–7 business days. Depending on your payment provider and bank, it may take an additional 5–10 business days for the funds to appear in your account.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger className="text-left">Can I cancel my subscription shipment?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can pause, skip, or cancel your subscription at any time before the next billing date through your account dashboard. Once a subscription order has been processed and shipped, it cannot be canceled or refunded. We recommend managing your subscription at least 3 days before your next scheduled shipment.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                For shipping inquiries, damaged orders, or refund requests, please contact us:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Coffee Habesha Customer Support</p>
                <p className="mt-2">
                  <a 
                    href="mailto:sales@coffeehabesha.com" 
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    sales@coffeehabesha.com
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Response time: Within 24–48 business hours
                </p>
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ShippingReturns;
