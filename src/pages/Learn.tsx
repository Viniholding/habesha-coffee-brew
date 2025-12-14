import { useState, useEffect } from 'react';
import { Coffee, Play, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AnimatedTutorial from '@/components/learn/AnimatedTutorial';
import coffeeCeremonyImage from '@/assets/coffee-ceremony.png';
import { supabase } from '@/integrations/supabase/client';

const sacredRounds = [
  {
    name: "Abol",
    subtitle: "Bold & Beautiful",
    description: "The first round — strong, rich, and full of life. This is where the conversation begins and the magic unfolds."
  },
  {
    name: "Tona",
    subtitle: "Smooth & Social",
    description: "The second round — mellower and more refined. Perfect for deep conversations and strengthening bonds."
  },
  {
    name: "Baraka",
    subtitle: "Light & Blessed",
    description: "The third round — gentle and blessed. A moment of gratitude, reflection, and heartfelt connection."
  }
];

export default function Learn() {
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/GfEh2CqdXt8?rel=0');

  useEffect(() => {
    fetchVideoUrl();
  }, []);

  const fetchVideoUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'learn_page_video_url')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        const url = typeof data.setting_value === 'string' 
          ? data.setting_value.replace(/"/g, '')
          : String(data.setting_value).replace(/"/g, '');
        if (url) setVideoUrl(url);
      }
    } catch (error) {
      console.error('Error fetching video URL:', error);
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

      {/* Animated Tutorial Section */}
      <section className="w-full bg-card py-20 md:py-32 print:py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16 print:mb-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-card-foreground mb-4 print:text-3xl">
              Make Coffee the <span className="italic text-primary">Habesha</span> Way
            </h2>
            <p className="text-xl md:text-2xl text-card-foreground/70 font-accent italic print:text-lg">
              The traditional art of Ethiopian coffee
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
              { number: 4, title: "The Jebena Magic", description: "Serve with fendisha (popcorn) or kolo, and enjoy three rounds." }
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
      <section className="w-full bg-muted/20 py-16 md:py-24 print:hidden">
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

          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black/5">
            <iframe
              className="absolute inset-0 w-full h-full"
              src={videoUrl}
              title="Ethiopian Coffee Ceremony"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <p className="text-center text-muted-foreground mt-6 text-sm">
            Video: Traditional Ethiopian Coffee Ceremony
          </p>
        </div>
      </section>

      {/* Three Sacred Rounds Section */}
      <section className="w-full bg-gradient-to-b from-card to-muted/30 py-20 md:py-32 print:hidden">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground animate-fade-in">
              The Three Sacred Rounds
            </h2>
            <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Each round tells a story, each cup brings us closer
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {sacredRounds.map((round, idx) => (
              <div 
                key={round.name}
                className="text-center space-y-4 p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 group"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
                  <Coffee className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <h3 className="text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{round.name}</h3>
                <p className="text-primary font-semibold text-lg">{round.subtitle}</p>
                <p className="text-muted-foreground leading-relaxed">
                  {round.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Printable Sacred Rounds */}
      <div className="hidden print:block print:mt-12 print:border-t print:border-border print:pt-8">
        <h2 className="text-xl font-bold mb-6 text-center">The Three Sacred Rounds</h2>
        <div className="grid grid-cols-3 gap-4">
          {sacredRounds.map((round) => (
            <div key={round.name} className="text-center p-4 border border-border rounded-lg">
              <h3 className="font-bold text-lg">{round.name}</h3>
              <p className="text-sm font-medium text-primary">{round.subtitle}</p>
              <p className="text-xs mt-2">{round.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section - Bottom */}
      <section className="w-full bg-background py-20 md:py-24 print:hidden">
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
