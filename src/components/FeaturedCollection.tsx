import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { addToCart } from '@/lib/cart';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
}

const FeaturedCollection = () => {
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    fetchFeaturedCollection();
  }, []);

  const fetchFeaturedCollection = async () => {
    try {
      // Get homepage settings with featured collection
      const { data: settings } = await supabase
        .from('homepage_settings')
        .select('featured_collection_id')
        .limit(1)
        .maybeSingle();

      if (!settings?.featured_collection_id) {
        setLoading(false);
        return;
      }

      // Get the collection details
      const { data: collectionData } = await supabase
        .from('collections')
        .select('*')
        .eq('id', settings.featured_collection_id)
        .eq('is_active', true)
        .single();

      if (!collectionData) {
        setLoading(false);
        return;
      }

      setCollection(collectionData);

      // Get products in this collection
      const { data: collectionProducts } = await supabase
        .from('collection_products')
        .select('product_id, sort_order')
        .eq('collection_id', settings.featured_collection_id)
        .order('sort_order');

      if (collectionProducts && collectionProducts.length > 0) {
        const productIds = collectionProducts.map(cp => cp.product_id);
        
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, price, image_url, description')
          .in('id', productIds)
          .eq('in_stock', true);

        if (productsData) {
          // Sort products according to collection order
          const sortedProducts = productIds
            .map(id => productsData.find(p => p.id === id))
            .filter(Boolean) as Product[];
          setProducts(sortedProducts.slice(0, 4)); // Show max 4 products
        }
      }
    } catch (error) {
      console.error('Error fetching featured collection:', error);
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

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!collection || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{collection.name}</h2>
          {collection.description && (
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {collection.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card 
              key={product.id} 
              className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
              onClick={() => navigate(`/products/${product.id}`)}
            >
              <div className="aspect-square overflow-hidden bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold text-primary">
                    ${product.price.toFixed(2)}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                    disabled={addingToCart === product.id}
                    onClick={(e) => handleAddToCart(product, e)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button 
            variant="outline" 
            size="lg"
            asChild
          >
            <a href="https://www.shop.coffeehabesha.com/shop-coffee-habesha/" target="_blank" rel="noopener noreferrer">View All Products</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollection;
