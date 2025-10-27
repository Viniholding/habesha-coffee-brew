import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Process from "@/components/Process";
import Products from "@/components/Products";
import About from "@/components/About";
import CafeComing from "@/components/CafeComing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Products />
      <Process />
      <CafeComing />
      <Footer />
    </div>
  );
};

export default Index;
