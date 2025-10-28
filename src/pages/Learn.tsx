import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Learn = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        {/* Content */}
        <div className="container mx-auto px-4 z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-1000">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              Learn
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover the art and science of exceptional coffee
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Learn;
