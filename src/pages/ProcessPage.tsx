import Navigation from "@/components/Navigation";
import Process from "@/components/Process";
import Footer from "@/components/Footer";

const ProcessPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20">
        <Process />
      </div>
      <Footer />
    </div>
  );
};

export default ProcessPage;
