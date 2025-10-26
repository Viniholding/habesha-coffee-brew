import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, CheckCircle2 } from "lucide-react";
import productBag from "@/assets/product-bag.jpg";
import groundCoffee from "@/assets/ground-coffee.jpg";
import wholeBeans from "@/assets/whole-beans.jpg";

const products = [
  {
    id: 1,
    name: "Premium Whole Bean",
    subtitle: "Ethiopian Arabica - Single Origin",
    price: 24.99,
    weight: "12 oz (340g)",
    image: wholeBeans,
    featured: true,
    description: "Our signature whole bean coffee, perfect for those who want to grind fresh at home. Complex flavor notes with hints of berry and chocolate.",
    features: [
      "100% Arabica Beans",
      "Hand-picked & Selected",
      "Small Batch Roasted",
      "Single Origin Ethiopia",
    ],
  },
  {
    id: 2,
    name: "Ground Coffee",
    subtitle: "Medium Roast - Ready to Brew",
    price: 22.99,
    weight: "12 oz (340g)",
    image: groundCoffee,
    featured: false,
    description: "Expertly ground to perfection, ready for your preferred brewing method. Smooth, balanced flavor with elegant notes.",
    features: [
      "Freshly Ground",
      "Medium Roast Profile",
      "Versatile Brewing",
      "Rich Aroma",
    ],
  },
  {
    id: 3,
    name: "Premium Gift Set",
    subtitle: "Complete Coffee Experience",
    price: 44.99,
    weight: "24 oz total (680g)",
    image: productBag,
    featured: true,
    description: "The perfect gift for coffee lovers. Includes both whole bean and ground varieties, beautifully packaged.",
    features: [
      "2 Premium Varieties",
      "Gift-Ready Packaging",
      "Tasting Notes Included",
      "Best Value",
    ],
  },
];

const Products = () => {
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
              className="overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] group relative"
            >
              {product.featured && (
                <Badge className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground shadow-lg">
                  Popular
                </Badge>
              )}
              
              <div className="relative h-80 overflow-hidden bg-card">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{product.name}</h3>
                  <p className="text-sm text-primary">{product.subtitle}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-border space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-bold">${product.price}</span>
                      <span className="text-muted-foreground ml-2 text-sm">{product.weight}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                    </div>
                  </div>
                  
                  <Button 
                    variant="hero" 
                    className="w-full" 
                    size="lg"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center space-y-6">
          <h3 className="text-3xl font-bold">Why Choose Coffee Habesha?</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-4xl mb-3">🌱</div>
              <h4 className="font-bold text-lg">Sustainably Sourced</h4>
              <p className="text-muted-foreground text-sm">
                Direct partnerships with Ethiopian farmers ensuring fair practices and quality
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl mb-3">🔥</div>
              <h4 className="font-bold text-lg">Small Batch Roasted</h4>
              <p className="text-muted-foreground text-sm">
                Every batch is carefully roasted to unlock maximum flavor and aroma
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl mb-3">📦</div>
              <h4 className="font-bold text-lg">Fresh Delivery</h4>
              <p className="text-muted-foreground text-sm">
                Roasted to order and shipped quickly to ensure peak freshness
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Products;
