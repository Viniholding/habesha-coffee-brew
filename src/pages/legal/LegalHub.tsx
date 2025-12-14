import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LegalBreadcrumb from "@/components/legal/LegalBreadcrumb";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { 
  FileText, 
  Shield, 
  Cookie, 
  Accessibility, 
  AlertTriangle, 
  Truck,
  ExternalLink 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const legalPages = [
  {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal information under GDPR and CCPA.",
    href: "/privacy-policy",
    icon: Shield,
    lastUpdated: "December 14, 2025",
  },
  {
    title: "Terms of Use",
    description: "The terms and conditions for using the Coffee Habesha website and services.",
    href: "/terms-of-use",
    icon: FileText,
    lastUpdated: "December 14, 2025",
  },
  {
    title: "Shipping & Returns",
    description: "Delivery information, return policies, and refund conditions.",
    href: "/shipping-returns",
    icon: Truck,
    lastUpdated: "December 14, 2025",
  },
  {
    title: "Cookie Policy",
    description: "How we use cookies and similar tracking technologies on our website.",
    href: "/cookie-policy",
    icon: Cookie,
    lastUpdated: "December 14, 2025",
  },
  {
    title: "Accessibility",
    description: "Our commitment to digital accessibility and how to request accommodations.",
    href: "/accessibility",
    icon: Accessibility,
    lastUpdated: "December 14, 2025",
  },
  {
    title: "Disclaimer",
    description: "Important legal disclaimers about our products and website content.",
    href: "/disclaimer",
    icon: AlertTriangle,
    lastUpdated: "December 14, 2025",
  },
];

const LegalHub = () => {
  return (
    <>
      <Helmet>
        <title>Legal Information | Coffee Habesha</title>
        <meta name="description" content="Access all Coffee Habesha legal documents including Privacy Policy, Terms of Use, Shipping & Returns, Cookie Policy, and more." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
          <LegalBreadcrumb currentPage="Legal Information" />
          
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Legal Information</h1>
            <p className="text-muted-foreground">
              Access all our legal documents and policies in one place. These documents govern your use of our website and services.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {legalPages.map((page) => {
              const IconComponent = page.icon;
              return (
                <Link key={page.href} to={page.href} className="group">
                  <Card className="h-full transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-primary/10 rounded-lg mb-2">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {page.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-2">
                        {page.description}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground">
                        Last updated: {page.lastUpdated}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="mt-12 p-6 bg-muted/50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Need Help?</h2>
            <p className="text-muted-foreground text-sm mb-4">
              If you have questions about any of our policies or need assistance understanding your rights, 
              please don't hesitate to contact us.
            </p>
            <a 
              href="mailto:sales@coffeehabesha.com" 
              className="text-primary hover:underline text-sm font-medium"
            >
              Contact Legal Team →
            </a>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LegalHub;