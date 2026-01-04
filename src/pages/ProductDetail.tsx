import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import RelatedProducts from "@/components/product/RelatedProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, RefreshCw, Star, Package, Truck, Shield, ArrowLeft, Plus, Minus, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { grindOptions, bagSizeOptions, frequencyOptions } from "@/lib/subscriptionProducts";
import { addToCart } from "@/lib/cart";
import { resolveProductImage, grinderImages } from "@/lib/productImages";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
  stock_quantity: number;
}

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchaseType, setPurchaseType] = useState<"one-time" | "subscription">(
    searchParams.get("subscribe") === "true" ? "subscription" : "one-time"
  );
  const [quantity, setQuantity] = useState(1);
  const [grind, setGrind] = useState("whole_bean");
  const [bagSize, setBagSize] = useState("12oz");
  const [frequency, setFrequency] = useState("biweekly");
  const [addingToCart, setAddingToCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("white");

  // Check if product is a coffee (not accessory) - only coffee can be subscribed
  const isCoffee = product?.category === "coffee";
  const isMug = product?.name?.toLowerCase().includes("mug");
  const isGrinder = product?.name?.toLowerCase().includes("hand coffee grinder");

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    if (!productId) return;

    try {
      // Fetch product and its images in parallel
      const [productResult, imagesResult] = await Promise.all([
        supabase.from("products").select("*").eq("id", productId).single(),
        supabase.from("product_images").select("*").eq("product_id", productId).order("sort_order")
      ]);

      if (productResult.error) throw productResult.error;
      setProduct(productResult.data);
      setProductImages(imagesResult.data || []);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Product not found");
    } finally {
      setLoading(false);
    }
  };

  // Get all images for the gallery (product_images table + fallback to main image_url or grinder images)
  const getAllImages = (): { url: string; alt: string }[] => {
    // For hand grinder, use the local grinder images
    if (isGrinder) {
      return grinderImages.map((img, index) => ({
        url: img,
        alt: `Hand Coffee Grinder - View ${index + 1}`
      }));
    }
    
    if (productImages.length > 0) {
      return productImages.map(img => ({
        url: resolveProductImage(img.image_url),
        alt: img.alt_text || product?.name || "Product image"
      }));
    }
    // Fallback to main product image
    return [{
      url: resolveProductImage(product?.image_url || null),
      alt: product?.name || "Product image"
    }];
  };

  const images = getAllImages();

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, images.length]);

  const getBagMultiplier = () => {
    const option = bagSizeOptions.find(o => o.value === bagSize);
    return option?.priceMultiplier || 1;
  };

  const calculatePrice = () => {
    if (!product) return 0;
    const basePrice = product.price * getBagMultiplier() * quantity;
    if (purchaseType === "subscription") {
      return basePrice * 0.9; // 10% subscriber discount
    }
    return basePrice;
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (purchaseType === "subscription") {
      // Map product name to product ID for subscription
      const productIdMap: Record<string, string> = {
        "Ethiopian Yirgacheffe": "ethiopian-yirgacheffe",
        "Sidamo Dark Roast": "sidamo-dark-roast",
        "Harar Heritage Blend": "harar-heritage-blend",
        "Limu Organic": "limu-organic",
      };

      const subscriptionProductId = productIdMap[product.name] || "ethiopian-yirgacheffe";

      const params = new URLSearchParams({
        product: subscriptionProductId,
        grind,
        bagSize,
        quantity: String(quantity),
        frequency,
        type: "regular",
      });

      navigate(`/subscription/review?${params.toString()}`);
      return;
    }

    // One-time purchase - add to cart (works for guests and logged-in users)
    setAddingToCart(true);
    try {
      const result = await addToCart(product.id, quantity, {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
      });
      if (result.isGuestCart) {
        toast.success("Added to cart! Continue shopping or checkout as guest.");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 container mx-auto px-4">
          <div className="animate-pulse grid md:grid-cols-2 gap-12">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button onClick={() => navigate("/products")} className="mt-4">
            Back to Products
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <Button
            variant="ghost"
            className="mb-6 gap-2"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Button>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Image Gallery */}
            <div className="relative space-y-4">
              <div 
                className="aspect-square rounded-lg overflow-hidden bg-card border cursor-zoom-in group relative"
                onDoubleClick={() => setLightboxOpen(true)}
              >
                <img
                  src={images[selectedImageIndex]?.url}
                  alt={images[selectedImageIndex]?.alt}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 pointer-events-none">
                  <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
                    <ZoomIn className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </div>
              {!product.in_stock && (
                <Badge variant="destructive" className="absolute top-4 left-4">
                  Out of Stock
                </Badge>
              )}
              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="flex gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index 
                          ? 'border-primary ring-2 ring-primary/30' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="w-full h-full object-contain bg-card"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

              {/* Lightbox Dialog */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
                <button
                  onClick={() => setLightboxOpen(false)}
                  className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
                {/* Arrow navigation buttons */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Previous image"
                    >
                      <ArrowLeft className="h-6 w-6 text-white" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-16 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="Next image"
                    >
                      <ArrowLeft className="h-6 w-6 text-white rotate-180" />
                    </button>
                  </>
                )}
                <div className="relative w-full h-[80vh] flex items-center justify-center p-4">
                  <img
                    src={images[selectedImageIndex]?.url}
                    alt={images[selectedImageIndex]?.alt}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex flex-col items-center gap-2 pb-4">
                    <span className="text-white/60 text-sm">Use arrow keys to navigate</span>
                    <div className="flex gap-2 justify-center">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                            selectedImageIndex === index 
                              ? 'border-primary ring-2 ring-primary/30' 
                              : 'border-white/20 hover:border-white/50'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.alt}
                            className="w-full h-full object-contain bg-black"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <Badge variant="outline" className="mb-2">
                  {product.category || "Coffee"}
                </Badge>
                <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center text-primary">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-primary" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">(128 reviews)</span>
                </div>
                <p className="text-muted-foreground text-lg">
                  {product.description || "Premium Ethiopian coffee with exceptional flavor notes."}
                </p>
              </div>

              {/* Color selector for mugs */}
              {isMug && (
                <div>
                  <Label className="text-base font-medium">Color</Label>
                  <RadioGroup
                    value={selectedColor}
                    onValueChange={setSelectedColor}
                    className="flex gap-3 mt-2"
                  >
                    {["white", "black"].map((color) => (
                      <div key={color}>
                        <RadioGroupItem
                          value={color}
                          id={`color-${color}`}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={`color-${color}`}
                          className={`flex items-center gap-2 rounded-md border-2 border-muted bg-card px-4 py-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer`}
                        >
                          <span 
                            className={`w-5 h-5 rounded-full border ${color === 'white' ? 'bg-white border-gray-300' : 'bg-gray-900 border-gray-700'}`} 
                          />
                          <span className="capitalize font-medium">{color}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Purchase Type Tabs */}
              <Tabs value={purchaseType} onValueChange={(v) => setPurchaseType(v as "one-time" | "subscription")}>
                <TabsList className={`grid w-full ${isCoffee ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <TabsTrigger value="one-time" className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    One-Time Purchase
                  </TabsTrigger>
                  {isCoffee && (
                    <TabsTrigger value="subscription" className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Subscribe & Save 10%
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="one-time" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      {/* Quantity */}
                      <div>
                        <Label>Quantity</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantity(quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg">Total</span>
                          <span className="text-3xl font-bold">${calculatePrice().toFixed(2)}</span>
                        </div>
                        <Button
                          variant="hero"
                          size="lg"
                          className="w-full"
                          disabled={!product.in_stock || addingToCart}
                          onClick={handleAddToCart}
                        >
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          {addingToCart ? "Adding..." : "Add to Cart"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-4 mt-4">
                  <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
                    <CardContent className="pt-6 space-y-4">
                      {/* Grind Type */}
                      <div>
                        <Label>Grind Type</Label>
                        <Select value={grind} onValueChange={setGrind}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {grindOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bag Size */}
                      <div>
                        <Label>Bag Size</Label>
                        <RadioGroup
                          value={bagSize}
                          onValueChange={setBagSize}
                          className="grid grid-cols-3 gap-2 mt-2"
                        >
                          {bagSizeOptions.map((option) => (
                            <div key={option.value}>
                              <RadioGroupItem
                                value={option.value}
                                id={`size-${option.value}`}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={`size-${option.value}`}
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <span className="font-medium">{option.label}</span>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Frequency */}
                      <div>
                        <Label>Delivery Frequency</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencyOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <Label>Quantity per Delivery</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantity(Math.min(5, quantity + 1))}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <span>Regular Price</span>
                          <span className="line-through text-muted-foreground">
                            ${(product.price * getBagMultiplier() * quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-medium flex items-center gap-2">
                            Subscriber Price
                            <Badge variant="secondary" className="text-xs">10% OFF</Badge>
                          </span>
                          <span className="text-3xl font-bold text-primary">
                            ${calculatePrice().toFixed(2)}
                          </span>
                        </div>
                        <Button
                          variant="hero"
                          size="lg"
                          className="w-full"
                          disabled={!product.in_stock}
                          onClick={handleAddToCart}
                        >
                          <RefreshCw className="h-5 w-5 mr-2" />
                          Subscribe Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <span className="text-sm text-muted-foreground">Free Shipping $35+</span>
                </div>
                <div className="text-center">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <span className="text-sm text-muted-foreground">Fast Delivery</span>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <span className="text-sm text-muted-foreground">Satisfaction Guarantee</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {product && (
            <RelatedProducts 
              currentProductId={product.id} 
              category={product.category} 
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetail;
