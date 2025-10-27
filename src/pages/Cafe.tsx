import Navigation from "@/components/Navigation";
import CafeComing from "@/components/CafeComing";
import Footer from "@/components/Footer";

const Cafe = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20">
        <CafeComing />
      </div>
      <Footer />
    </div>
  );
};

export default Cafe;
