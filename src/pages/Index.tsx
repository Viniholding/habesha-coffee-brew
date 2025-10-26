import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Process from "@/components/Process";
import About from "@/components/About";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <Process />
      <About />
      <Footer />
    </div>
  );
};

export default Index;
