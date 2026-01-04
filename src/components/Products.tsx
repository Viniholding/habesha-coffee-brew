import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, RefreshCw, Eye, Plus, Minus, PackageCheck, AlertTriangle, XCircle } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { resolveProductImage, defaultProductImage } from "@/lib/productImages";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
}

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [mugSize, setMugSize] = useState<'350ml' | '500ml'>('350ml');
  const [mugColor, setMugColor] = useState<'white' | 'black'>('white');

  const getQuantity = (productId: string) => quantities[productId] || 1;
  
  const updateQuantity = (productId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(10, (prev[productId] || 1) + delta))
    }));
  };

  // Check if product is a coffee mug
  const isCoffeeMug = (product: Product) => 
    product.name.toLowerCase().includes('coffee mug');

  // Get the primary mug product (use 350ml as base, adjust price for 500ml)
  const getMugDisplayProduct = (products: Product[]) => {
    const mugs = products.filter(isCoffeeMug);
    const mug350 = mugs.find(m => m.name.toLowerCase().includes('350ml'));
    const mug500 = mugs.find(m => m.name.toLowerCase().includes('500ml'));
    
    if (mugSize === '500ml' && mug500) return mug500;
    return mug350 || mugs[0];
  };

  // Filter products to show consolidated view
  const getDisplayProducts = (products: Product[]) => {
    const mugs = products.filter(isCoffeeMug);
    const nonMugs = products.filter(p => !isCoffeeMug(p));
    
    // Add only one mug representative if mugs exist
    if (mugs.length > 0) {
      const displayMug = getMugDisplayProduct(products);
      if (displayMug) {
        return [...nonMugs, displayMug];
      }
    }
    return nonMugs;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Get mug image based on selected color
  const getMugImage = (color: 'white' | 'black') => {
    // Use different placeholder images based on color
    return color === 'white' 
      ? 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop' 
      : 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=400&h=400&fit=crop';
  };

  // Get stock status for display
  const getStockStatus = (product: Product) => {
    if (!product.in_stock || product.stock_quantity <= 0) {
      return { label: 'Out of Stock', color: 'text-destructive', icon: XCircle, variant: 'destructive' as const };
    }
    if (product.stock_quantity <= product.low_stock_threshold) {
      return { label: `Only ${product.stock_quantity} left`, color: 'text-amber-500', icon: AlertTriangle, variant: 'secondary' as const };
    }
    return { label: 'In Stock', color: 'text-green-500', icon: PackageCheck, variant: 'secondary' as const };
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, category, in_stock, stock_quantity, low_stock_threshold")
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
    const qty = getQuantity(product.id);
    await addToCart(product.id, qty, {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    });
    setAddingToCart(null);
  };

  const getProductSize = (product: Product): string | null => {
    const name = product.name.toLowerCase();
    if (name.includes('350ml') || name.includes('350 ml')) return '350ml';
    if (name.includes('500ml') || name.includes('500 ml')) return '500ml';
    if (product.category === 'coffee') return '12oz';
    return null;
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
          {getDisplayProducts(products).map((product) => {
            const isThisMug = isCoffeeMug(product);
            const displayProduct = isThisMug ? getMugDisplayProduct(products) : product;
            const productId = displayProduct?.id || product.id;
            
            return (
              <Card 
                key={isThisMug ? 'coffee-mug-consolidated' : product.id}
                className="overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)] group relative cursor-pointer"
                onClick={() => navigate(`/products/${productId}`)}
              >
                {product.category === "coffee" && (
                  <Badge className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground shadow-lg">
                    Coffee
                  </Badge>
                )}
                
                <div className="relative h-80 overflow-hidden bg-card">
                  <img 
                    src={isThisMug ? getMugImage(mugColor) : resolveProductImage(product.image_url)} 
                    alt={isThisMug ? `Coffee Mug - ${mugColor}` : product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <Button 
                      variant="secondary" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/products/${productId}`);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold">{isThisMug ? "Coffee Mug" : product.name}</h3>
                      {(() => {
                        const stockStatus = getStockStatus(displayProduct || product);
                        const StockIcon = stockStatus.icon;
                        return (
                          <Badge variant={stockStatus.variant} className={`${stockStatus.color} flex items-center gap-1`}>
                            <StockIcon className="h-3 w-3" />
                            <span className="text-xs">{stockStatus.label}</span>
                          </Badge>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-primary">{product.category || "Premium Coffee"}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                      {isThisMug 
                        ? "Premium ceramic coffee mug. Available in white and black."
                        : (product.description || "Premium Ethiopian coffee with exceptional flavor notes.")}
                    </p>
                  </div>
                  
                  {/* Mug Size & Color Selectors */}
                  {isThisMug && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Size:</span>
                        <div className="flex gap-2">
                          {(['350ml', '500ml'] as const).map((size) => (
                            <Button
                              key={size}
                              variant={mugSize === size ? "default" : "outline"}
                              size="sm"
                              className="h-8 px-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMugSize(size);
                              }}
                            >
                              {size}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Color:</span>
                        <div className="flex gap-2">
                          {(['white', 'black'] as const).map((color) => (
                            <button
                              key={color}
                              onClick={(e) => {
                                e.stopPropagation();
                                setMugColor(color);
                              }}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                mugColor === color 
                                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                                  : 'hover:scale-110'
                              } ${color === 'white' ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'}`}
                              title={color.charAt(0).toUpperCase() + color.slice(1)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-border space-y-4">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold">
                          ${(displayProduct?.price || product.price).toFixed(2)}
                        </span>
                        {isThisMug ? (
                          <Badge variant="secondary" className="text-xs">
                            {mugSize}
                          </Badge>
                        ) : (
                          getProductSize(product) && (
                            <Badge variant="secondary" className="text-xs">
                              {getProductSize(product)}
                            </Badge>
                          )
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="h-4 w-4 fill-primary" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => updateQuantity(productId, -1, e)}
                          disabled={getQuantity(productId) <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{getQuantity(productId)}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => updateQuantity(productId, 1, e)}
                          disabled={getQuantity(productId) >= 10}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {(() => {
                        const currentProduct = displayProduct || product;
                        const isOutOfStock = !currentProduct.in_stock || currentProduct.stock_quantity <= 0;
                        return (
                          <>
                            <Button 
                              variant="hero" 
                              className={product.category === "coffee" ? "flex-1" : "w-full"} 
                              size="lg"
                              disabled={addingToCart === productId || isOutOfStock}
                              onClick={(e) => handleAddToCart(currentProduct, e)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {isOutOfStock 
                                ? "Out of Stock" 
                                : addingToCart === productId 
                                  ? "Adding..." 
                                  : `Add ${getQuantity(productId) > 1 ? `(${getQuantity(productId)})` : ''} to Cart`}
                            </Button>
                            {product.category === "coffee" && !isOutOfStock && (
                              <Button 
                                variant="outline" 
                                size="lg"
                                onClick={(e) => handleSubscribe(productId, e)}
                                title="Subscribe & Save 10%"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Products;
