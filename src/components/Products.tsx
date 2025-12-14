import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, RefreshCw, Eye } from "lucide-react";
import productBag from "@/assets/product-bag.jpg";
import { addToCart } from "@/lib/cart";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
}

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, category, in_stock")
        .eq("in_stock", true)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAddingToCart(product.id);
    await addToCart(product.id, 1, {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
    setAddingToCart(null);
  };

  const handleSubscribe = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/products/${productId}?subscribe=true`);
  };

  if (loading) {
    return (
      <section id="products" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="h-80 bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="border-primary text-primary px-4 py-2 text-sm">
            Our Products
          </Badge>
          <h2 className="text-5xl md:text-6xl font-bold">
            Premium Ethiopian Coffee
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the finest coffee beans Ethiopia has to offer. Each variety is crafted 
            with care and dedication to deliver an exceptional coffee experience.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {products.map((product) => (
            <Card 
              key={product.id}
              className="overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] group relative cursor-pointer"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              {product.category === "coffee" && (
                <Badge className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground shadow-lg">
                  Coffee
                </Badge>
              )}
              
              <div className="relative h-80 overflow-hidden bg-card">
                <img 
                  src={product.image_url || productBag} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <Button 
                    variant="secondary" 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/products/${product.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{product.name}</h3>
                  <p className="text-sm text-primary">{product.category || "Premium Coffee"}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                    {product.description || "Premium Ethiopian coffee with exceptional flavor notes."}
                  </p>
                </div>
                
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-4 w-4 fill-primary" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="hero" 
                      className="flex-1" 
                      size="lg"
                      disabled={addingToCart === product.id}
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {addingToCart === product.id ? "Adding..." : "Add to Cart"}
                    </Button>
                    {product.category === "coffee" && (
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={(e) => handleSubscribe(product.id, e)}
                        title="Subscribe & Save 10%"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
