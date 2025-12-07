import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Can I pause or skip a delivery?",
    answer: "Yes! You can pause your subscription or skip individual deliveries anytime from your account dashboard. There's no penalty or extra fees for skipping or pausing.",
  },
  {
    question: "How do I change my delivery frequency?",
    answer: "You can adjust your delivery frequency (weekly, bi-weekly, monthly, etc.) from your subscription settings in your account. Changes take effect on your next scheduled delivery.",
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Absolutely. You can cancel your subscription at any time with no cancellation fees. Your current subscription will remain active until the end of your billing period.",
  },
  {
    question: "When will I be charged?",
    answer: "You'll be charged when you first subscribe, then on a recurring basis based on your selected frequency. You'll always receive an email notification before each charge.",
  },
  {
    question: "How does shipping work?",
    answer: "All subscription orders include free shipping. Orders are typically roasted and shipped within 1-2 business days, and delivery takes 2-5 business days depending on your location.",
  },
  {
    question: "Can I change the coffee or grind in my subscription?",
    answer: "Yes! You can change your coffee selection, grind type, bag size, or quantity at any time from your account. Changes apply to your next delivery.",
  },
  {
    question: "Do you offer gift subscriptions?",
    answer: "Yes! Gift subscriptions are available for 3, 6, or 12 months. The recipient will receive a notification and can manage their deliveries. Contact us for details.",
  },
  {
    question: "What if I'm not satisfied with my coffee?",
    answer: "We stand behind our coffee 100%. If you're not satisfied, contact us and we'll make it right with a replacement or refund.",
  },
];

const SubscriptionFAQ = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="border-primary text-primary mb-4">
            FAQ
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Common Questions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about our subscription program.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionFAQ;
