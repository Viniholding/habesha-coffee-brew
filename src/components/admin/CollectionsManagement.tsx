import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Image, Package } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  show_on_homepage: boolean;
  product_count?: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

const CollectionsManagement = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionProducts, setCollectionProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    is_active: true,
    show_on_homepage: false,
  });

  useEffect(() => {
    fetchCollections();
    fetchProducts();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order');

      if (error) throw error;

      // Get product counts for each collection
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          const { count } = await supabase
            .from('collection_products')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id);
          return { ...collection, product_count: count || 0 };
        })
      );

      setCollections(collectionsWithCounts);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCollectionProducts = async (collectionId: string) => {
    try {
      const { data, error } = await supabase
        .from('collection_products')
        .select('product_id')
        .eq('collection_id', collectionId);

      if (error) throw error;
      setCollectionProducts(data?.map(cp => cp.product_id) || []);
    } catch (error) {
      console.error('Error fetching collection products:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleOpenDialog = (collection?: Collection) => {
    if (collection) {
      setSelectedCollection(collection);
      setFormData({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || '',
        image_url: collection.image_url || '',
        is_active: collection.is_active,
        show_on_homepage: collection.show_on_homepage,
      });
    } else {
      setSelectedCollection(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        is_active: true,
        show_on_homepage: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and slug are required');
      return;
    }

    try {
      if (selectedCollection) {
        const { error } = await supabase
          .from('collections')
          .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            show_on_homepage: formData.show_on_homepage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedCollection.id);

        if (error) throw error;
        toast.success('Collection updated');
      } else {
        const { error } = await supabase
          .from('collections')
          .insert({
            name: formData.name,
            slug: formData.slug,
            description: formData.description || null,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            show_on_homepage: formData.show_on_homepage,
            sort_order: collections.length,
          });

        if (error) throw error;
        toast.success('Collection created');
      }

      setDialogOpen(false);
      fetchCollections();
    } catch (error: any) {
      console.error('Error saving collection:', error);
      toast.error(error.message || 'Failed to save collection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    try {
      const { error } = await supabase.from('collections').delete().eq('id', id);
      if (error) throw error;
      toast.success('Collection deleted');
      fetchCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
  };

  const handleOpenProductsDialog = async (collection: Collection) => {
    setSelectedCollection(collection);
    await fetchCollectionProducts(collection.id);
    setProductsDialogOpen(true);
  };

  const handleToggleProduct = async (productId: string) => {
    if (!selectedCollection) return;

    try {
      if (collectionProducts.includes(productId)) {
        // Remove product from collection
        const { error } = await supabase
          .from('collection_products')
          .delete()
          .eq('collection_id', selectedCollection.id)
          .eq('product_id', productId);

        if (error) throw error;
        setCollectionProducts(prev => prev.filter(id => id !== productId));
      } else {
        // Add product to collection
        const { error } = await supabase
          .from('collection_products')
          .insert({
            collection_id: selectedCollection.id,
            product_id: productId,
            sort_order: collectionProducts.length,
          });

        if (error) throw error;
        setCollectionProducts(prev => [...prev, productId]);
      }
    } catch (error) {
      console.error('Error updating collection products:', error);
      toast.error('Failed to update collection');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Collections</h1>
          <p className="text-muted-foreground mt-1">Organize products into collections for merchandising</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          New Collection
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collections.map((collection) => (
          <Card key={collection.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{collection.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">/{collection.slug}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenProductsDialog(collection)}
                  >
                    <Package className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(collection)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(collection.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {collection.image_url && (
                <img
                  src={collection.image_url}
                  alt={collection.name}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              {collection.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {collection.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant={collection.is_active ? 'default' : 'secondary'}>
                  {collection.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {collection.show_on_homepage && (
                  <Badge variant="outline">Homepage</Badge>
                )}
                <Badge variant="outline">{collection.product_count} products</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {collections.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first collection to organize products
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Collection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCollection ? 'Edit Collection' : 'New Collection'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: selectedCollection ? formData.slug : generateSlug(e.target.value),
                  });
                }}
                placeholder="Best Sellers"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="best-sellers"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Our most popular coffees..."
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show on Homepage</Label>
              <Switch
                checked={formData.show_on_homepage}
                onCheckedChange={(checked) => setFormData({ ...formData, show_on_homepage: checked })}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              {selectedCollection ? 'Save Changes' : 'Create Collection'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Manage Products - {selectedCollection?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Include</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Switch
                        checked={collectionProducts.includes(product.id)}
                        onCheckedChange={() => handleToggleProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${product.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionsManagement;
