import Navigation from "@/components/Navigation";
import Products from "@/components/Products";
import Footer from "@/components/Footer";

const ProductsPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20">
        <Products />
      </div>
      <Footer />
    </div>
  );
};

export default ProductsPage;
