import { useState, useEffect } from 'react';
import { Coffee, Play, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AnimatedTutorial from '@/components/learn/AnimatedTutorial';
import VideoCarousel, { Video } from '@/components/learn/VideoCarousel';
import coffeeCeremonyImage from '@/assets/jebena-pour.png';
import { supabase } from '@/integrations/supabase/client';

export default function Learn() {
  const [videos, setVideos] = useState<Video[]>([
    { id: '1', title: 'Traditional Coffee Ceremony', url: 'https://www.youtube.com/embed/GfEh2CqdXt8?rel=0', description: 'Witness the full Ethiopian coffee ceremony ritual' }
  ]);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'learn_page_videos')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        const parsed = typeof data.setting_value === 'string' 
          ? JSON.parse(data.setting_value) 
          : data.setting_value;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVideos(parsed);
        }
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Quote Section - Top */}
      <section className="w-full bg-gradient-to-b from-background to-muted/30 py-20 md:py-32 mt-20 print:hidden">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="relative rounded-2xl overflow-hidden">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coffeeCeremonyImage})` }}
            >
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <blockquote className="relative z-10 text-2xl md:text-3xl font-serif italic text-white border-l-4 border-primary pl-8 py-12 pr-8 hover:border-l-8 transition-all duration-300">
              "Coffee is our bread, our culture, our connection. It is the thread that weaves through every moment of Ethiopian life."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Animated Tutorial Section (includes Three Sacred Rounds as Step 4) */}
      <section className="w-full bg-card py-20 md:py-32 print:py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16 print:mb-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-card-foreground mb-4 print:text-3xl">
              Make Coffee the <span className="italic text-primary">Habesha</span> Way
            </h2>
            <p className="text-xl md:text-2xl text-card-foreground/70 font-accent italic print:text-lg">
              The traditional art of Ethiopian coffee — from roasting to the three sacred rounds
            </p>
            
            {/* Print Button */}
            <div className="mt-8 print:hidden">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handlePrint}
                className="gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Printer className="w-5 h-5" />
                Print Tutorial Guide
              </Button>
            </div>
          </div>

          {/* Printable Header */}
          <div className="hidden print:block print:mb-8 print:text-center print:border-b print:border-border print:pb-6">
            <h1 className="text-2xl font-bold">Coffee Habesha</h1>
            <p className="text-sm text-muted-foreground">Traditional Ethiopian Coffee Tutorial</p>
          </div>

          {/* Animated Tutorial */}
          <div className="print:hidden">
            <AnimatedTutorial />
          </div>

          {/* Print-only static tutorial */}
          <div className="hidden print:block print:space-y-6">
            {[
              { number: 1, title: "Set the Mood — Coffee Time Is Sacred", description: "Find your coziest spot — Light your etan (frankincense), grab your Jebena, and gather your people." },
              { number: 2, title: "Roast with Rhythm", description: "Traditionally, you'd roast green beans until your kitchen smells like paradise." },
              { number: 3, title: "Grind It the Traditional Way", description: "Add your ground coffee to the Jebena, fill with water, and simmer slowly." },
              { number: 4, title: "The Jebena Magic — Three Sacred Rounds", description: "Serve with fendisha (popcorn) or kolo. Abol: Bold & Beautiful (first pour). Tona: Smooth & Social (second pour). Baraka: Light & Blessed (final pour)." }
            ].map((step) => (
              <div key={step.number} className="flex gap-4 print:page-break-inside-avoid">
                <span className="text-2xl font-bold text-primary">{step.number}.</span>
                <div>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="w-full bg-card py-16 md:py-24 print:hidden">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary mb-6">
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Watch & Learn</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Experience the Ethiopian Coffee Ceremony
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Witness the beauty and tradition of an authentic Ethiopian coffee ceremony — a ritual that has brought people together for centuries.
            </p>
          </div>

          <VideoCarousel videos={videos} />
        </div>
      </section>

      {/* CTA Section - Bottom */}
      <section className="w-full bg-muted/20 py-20 md:py-24 print:hidden">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <p className="text-2xl md:text-3xl text-foreground mb-8 font-medium">
            Experience the authentic taste of tradition with Coffee Habesha
          </p>
          <Button 
            variant="hero" 
            size="lg" 
            asChild 
            className="hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 group text-lg px-8 py-6"
          >
            <a href="/products" className="flex items-center gap-3">
              Explore Our Coffee Selection
              <Coffee className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
            </a>
          </Button>
        </div>
      </section>

      {/* Printable Footer */}
      <div className="hidden print:block print:mt-12 print:text-center print:text-sm print:text-muted-foreground">
        <p>www.coffeehabesha.com • Experience the authentic taste of tradition</p>
      </div>

      <Footer />
    </div>
  );
}
