import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LegalBreadcrumb from "@/components/legal/LegalBreadcrumb";
import LegalPageWrapper from "@/components/legal/LegalPageWrapper";
import TableOfContents from "@/components/legal/TableOfContents";
import { Helmet } from "react-helmet-async";
import { Mail } from "lucide-react";

const tocItems = [
  { id: "information-collect", title: "1. Information We Collect", level: 2 },
  { id: "how-we-use", title: "2. How We Use Your Information", level: 2 },
  { id: "legal-basis", title: "3. Legal Basis for Processing (GDPR)", level: 2 },
  { id: "sharing", title: "4. Sharing Your Information", level: 2 },
  { id: "privacy-rights", title: "5. Your Privacy Rights", level: 2 },
  { id: "cookies", title: "6. Cookies and Tracking Technologies", level: 2 },
  { id: "data-retention", title: "7. Data Retention", level: 2 },
  { id: "data-security", title: "8. Data Security", level: 2 },
  { id: "international-transfers", title: "9. International Data Transfers", level: 2 },
  { id: "childrens-privacy", title: "10. Children's Privacy", level: 2 },
  { id: "changes", title: "11. Changes to This Policy", level: 2 },
  { id: "contact", title: "12. Contact Us", level: 2 },
];

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | Coffee Habesha</title>
        <meta name="description" content="Learn how Coffee Habesha collects, uses, and protects your personal information under GDPR and CCPA." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <LegalBreadcrumb currentPage="Privacy Policy" />
          
          <LegalPageWrapper>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: December 14, 2025</p>
          
            <TableOfContents items={tocItems} />
          
          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <p className="text-muted-foreground leading-relaxed">
              Coffee Habesha LLC ("we," "us," or "our") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
            </p>

            <section id="information-collect">
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect information you provide directly to us and information collected automatically when you use our website.
              </p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">Information You Provide</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Name, email address, phone number</li>
                <li>Billing and shipping address</li>
                <li>Payment information (processed securely by our payment provider)</li>
                <li>Order history and preferences</li>
                <li>Account credentials (if you create an account)</li>
                <li>Communications you send to us</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">Information Collected Automatically</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Device information (browser type, operating system)</li>
                <li>IP address and approximate location</li>
                <li>Pages visited and time spent on site</li>
                <li>Referring website or source</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section id="how-we-use">
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use the information we collect for the following purposes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Process and fulfill your orders</li>
                <li>Send order confirmations, shipping updates, and receipts</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our website, products, and services</li>
                <li>Send promotional communications (with your consent)</li>
                <li>Detect and prevent fraud or unauthorized access</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section id="legal-basis">
              <h2 className="text-xl font-semibold mb-3">3. Legal Basis for Processing (GDPR)</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                If you are in the European Economic Area (EEA), we process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Contract:</strong> To fulfill orders and provide services you requested</li>
                <li><strong>Consent:</strong> For marketing communications and non-essential cookies</li>
                <li><strong>Legitimate Interests:</strong> To improve our services and prevent fraud</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </section>

            <section id="sharing">
              <h2 className="text-xl font-semibold mb-3">4. Sharing Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We do not sell or rent your personal information. We may share your data with:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Service Providers:</strong> Payment processors, shipping carriers, email services, and hosting providers who assist in our operations</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                All third-party service providers are contractually obligated to protect your data and use it only for specified purposes.
              </p>
            </section>

            <section id="privacy-rights">
              <h2 className="text-xl font-semibold mb-3">5. Your Privacy Rights</h2>
              
              <h3 className="text-lg font-medium mb-2 mt-4">For All Users</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li>Opt out of marketing emails via the unsubscribe link</li>
                <li>Request access to your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and data</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">GDPR Rights (EEA Residents)</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Right of Access:</strong> Obtain a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>

              <h3 className="text-lg font-medium mb-2 mt-4">CCPA Rights (California Residents)</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Right to Know:</strong> Request disclosure of personal information collected</li>
                <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt out of the sale of personal information (we do not sell your data)</li>
                <li><strong>Right to Non-Discrimination:</strong> Exercise your rights without discriminatory treatment</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:sales@coffeehabesha.com" className="text-primary hover:underline">sales@coffeehabesha.com</a>.
              </p>
            </section>

            <section id="cookies">
              <h2 className="text-xl font-semibold mb-3">6. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use cookies and similar technologies to enhance your experience. Types of cookies we use:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
                <li><strong>Essential Cookies:</strong> Required for website functionality (cart, checkout)</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                You can manage cookie preferences through your browser settings. See our{" "}
                <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a> for more details.
              </p>
            </section>

            <section id="data-retention">
              <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal data only as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Order records are typically retained for 7 years for tax and legal compliance. You may request deletion of your account at any time.
              </p>
            </section>

            <section id="data-security">
              <h2 className="text-xl font-semibold mb-3">8. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section id="international-transfers">
              <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you are located outside the United States, your data may be transferred to and processed in the United States. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
              </p>
            </section>

            <section id="childrens-privacy">
              <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our website is not intended for children under 16 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
              </p>
            </section>

            <section id="changes">
              <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of material changes by posting the updated policy on our website with a new "Last Updated" date. Your continued use of the website after changes are posted constitutes acceptance of the revised policy.
              </p>
            </section>

            <section id="contact">
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">Coffee Habesha LLC</p>
                <p className="text-muted-foreground">Data Protection Inquiries</p>
                <p className="mt-2">
                  <a 
                    href="mailto:sales@coffeehabesha.com" 
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <Mail className="h-4 w-4" />
                    sales@coffeehabesha.com
                  </a>
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                For EEA residents: You have the right to lodge a complaint with your local data protection authority if you believe your rights have been violated.
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

export default PrivacyPolicy;