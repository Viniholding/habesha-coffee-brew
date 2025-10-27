import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

const Contact = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-foreground">
              Get in Touch
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions about our coffee? Want to place an order? We'd love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-6 text-foreground">
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Email</p>
                      <p className="text-muted-foreground">info@coffeehabesha.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Phone</p>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Location</p>
                      <p className="text-muted-foreground">
                        Sourced from Ethiopian Highlands<br />
                        Delivered Worldwide
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h4 className="font-semibold text-lg mb-2 text-foreground">
                  Business Hours
                </h4>
                <p className="text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM<br />
                  Saturday: 10:00 AM - 4:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </div>

            <div className="bg-card p-8 rounded-lg border border-border shadow-lg">
              <h3 className="text-2xl font-semibold mb-6 text-foreground">
                Send us a Message
              </h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Name
                  </label>
                  <Input placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Email
                  </label>
                  <Input type="email" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Subject
                  </label>
                  <Input placeholder="What's this about?" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">
                    Message
                  </label>
                  <Textarea 
                    placeholder="Tell us more..." 
                    className="min-h-[120px]"
                  />
                </div>
                <Button variant="hero" size="lg" className="w-full">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
