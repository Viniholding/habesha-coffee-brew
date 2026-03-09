import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, RefreshCw, Eye, Plus, Minus, PackageCheck, AlertTriangle, XCircle, Bell, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Search, DollarSign, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { addToCart } from "@/lib/cart";
import { resolveProductImage, grinderImages } from "@/lib/productImages";
import { toast } from "sonner";

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

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock-first' | 'out-of-stock-first';
type CategoryFilter = 'all' | 'coffee' | 'accessories';

const Products = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [mugSize, setMugSize] = useState<'350ml' | '500ml'>('350ml');
  const [mugColor, setMugColor] = useState<'white' | 'black'>('white');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [notifyEmail, setNotifyEmail] = useState<Record<string, string>>({});
  const [notifyingProduct, setNotifyingProduct] = useState<string | null>(null);
  const [grinderImageIndex, setGrinderImageIndex] = useState(0);

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

  // Check if product is the hand grinder
  const isHandGrinder = (product: Product) =>
    product.name.toLowerCase().includes('hand coffee grinder');

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

  // Filter products by category
  const filterByCategory = (products: Product[]) => {
    if (categoryFilter === 'all') return products;
    if (categoryFilter === 'coffee') {
      return products.filter(p => p.category === 'coffee');
    }
    // accessories = everything that's not coffee
    return products.filter(p => p.category !== 'coffee');
  };

  // Filter products by search query
  const filterBySearch = (products: Product[]) => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.description && p.description.toLowerCase().includes(query))
    );
  };

  // Filter products by price range
  const filterByPrice = (products: Product[]) => {
    return products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
  };

  // Sort products
  const sortProducts = (products: Product[]) => {
    const sorted = [...products];
    switch (sortBy) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'stock-first':
        return sorted.sort((a, b) => {
          if (a.in_stock && !b.in_stock) return -1;
          if (!a.in_stock && b.in_stock) return 1;
          return b.stock_quantity - a.stock_quantity;
        });
      case 'out-of-stock-first':
        return sorted.sort((a, b) => {
          if (!a.in_stock && b.in_stock) return -1;
          if (a.in_stock && !b.in_stock) return 1;
          return a.stock_quantity - b.stock_quantity;
        });
      default:
        return sorted;
    }
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
        .select("id, name, description, price, image_url, category, in_stock, stock_quantity, low_stock_threshold, display_order")
        .order("display_order")
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

  const handleNotifyMe = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = notifyEmail[productId];
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setNotifyingProduct(productId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('stock_notifications')
        .insert({
          product_id: productId,
          email: email,
          user_id: user?.id || null
        });
      
      if (error) throw error;
      toast.success("We'll notify you when this item is back in stock!");
      setNotifyEmail(prev => ({ ...prev, [productId]: '' }));
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setNotifyingProduct(null);
    }
  };

  const cycleGrinderImage = (direction: 'next' | 'prev', e: React.MouseEvent) => {
    e.stopPropagation();
    setGrinderImageIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % grinderImages.length;
      } else {
        return prev === 0 ? grinderImages.length - 1 : prev - 1;
      }
    });
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

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Filter & Sorting Options */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="coffee">Coffee</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div className="flex items-center gap-3 min-w-[280px]">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  min={0}
                  max={200}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Clear All Filters Button */}
            {(searchQuery || categoryFilter !== 'all' || priceRange[0] !== 0 || priceRange[1] !== 200) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setPriceRange([0, 200]);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="stock-first">In Stock First</SelectItem>
                <SelectItem value="out-of-stock-first">Out of Stock First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {(() => {
            const filteredProducts = sortProducts(filterByPrice(filterBySearch(filterByCategory(getDisplayProducts(products)))));
            
            if (filteredProducts.length === 0) {
              return (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-muted rounded-full p-6 mb-4">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    We couldn't find any products matching your current filters. Try adjusting your search or filters.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setPriceRange([0, 200]);
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              );
            }
            
            return filteredProducts.map((product) => {
            const isThisMug = isCoffeeMug(product);
            const isThisGrinder = isHandGrinder(product);
            const displayProduct = isThisMug ? getMugDisplayProduct(products) : product;
            const productId = displayProduct?.id || product.id;
            const currentProduct = displayProduct || product;
            const isOutOfStock = !currentProduct.in_stock || currentProduct.stock_quantity <= 0;
            
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
                    src={isThisGrinder ? grinderImages[grinderImageIndex] : (isThisMug ? getMugImage(mugColor) : resolveProductImage(product.image_url))} 
                    alt={isThisGrinder ? `Hand Coffee Grinder - Image ${grinderImageIndex + 1}` : (isThisMug ? `Coffee Mug - ${mugColor}` : product.name)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Grinder image navigation - always visible */}
                  {isThisGrinder && (
                    <>
                      <button
                        onClick={(e) => cycleGrinderImage('prev', e)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background rounded-full p-2 shadow-md transition-colors z-10"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => cycleGrinderImage('next', e)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/90 hover:bg-background rounded-full p-2 shadow-md transition-colors z-10"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {grinderImages.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setGrinderImageIndex(idx);
                            }}
                            className={`w-2.5 h-2.5 rounded-full transition-all shadow-sm ${
                              idx === grinderImageIndex ? 'bg-primary w-5' : 'bg-background/80 hover:bg-background'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
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
                      {isOutOfStock ? (
                        <div className="w-full space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              value={notifyEmail[productId] || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                setNotifyEmail(prev => ({ ...prev, [productId]: e.target.value }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              size="lg"
                              disabled={notifyingProduct === productId}
                              onClick={(e) => handleNotifyMe(productId, e)}
                            >
                              <Bell className="h-4 w-4 mr-2" />
                              {notifyingProduct === productId ? 'Saving...' : 'Notify Me'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button 
                            variant="hero" 
                            className={product.category === "coffee" ? "flex-1" : "w-full"} 
                            size="lg"
                            disabled={addingToCart === productId}
                            onClick={(e) => handleAddToCart(currentProduct, e)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {addingToCart === productId 
                              ? "Adding..." 
                              : `Add ${getQuantity(productId) > 1 ? `(${getQuantity(productId)})` : ''} to Cart`}
                          </Button>
                          {product.category === "coffee" && (
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
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          });
        })()}
        </div>
      </div>
    </section>
  );
};

export default Products;
