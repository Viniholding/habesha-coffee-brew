import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, AlertTriangle, Edit, Eye, Plus, Upload, X, Loader2, DollarSign, TrendingDown, History } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import AddInventoryDialog from './AddInventoryDialog';
import BulkStockUpdate from './BulkStockUpdate';
import InventoryFilters from './InventoryFilters';
import ProductImageGallery from './ProductImageGallery';
import { InventoryAuditLog } from './InventoryAuditLog';
import { logAdminAction } from '@/lib/auditLog';
import { Checkbox } from '@/components/ui/checkbox';

// Helper function to log inventory changes
export const logInventoryChange = async (
  productId: string,
  previousQuantity: number,
  newQuantity: number,
  changeType: string,
  notes?: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('inventory_audit_log').insert({
      product_id: productId,
      admin_user_id: user.id,
      previous_quantity: previousQuantity,
      new_quantity: newQuantity,
      quantity_change: newQuantity - previousQuantity,
      change_type: changeType,
      notes: notes || null,
    });

    if (error) {
      console.error('Failed to log inventory change:', error);
    }
  } catch (error) {
    console.error('Error logging inventory change:', error);
  }
};

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
  cost_price: number | null;
  supplier_name: string | null;
  supplier_email: string | null;
  sku: string | null;
  category: string | null;
}

export const InventoryManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canEdit, isReadOnly } = useAdminRole();

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  // Filter products
  const filteredProducts = products.filter(p => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(query) && 
          !(p.sku?.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    // Stock filter
    if (stockFilter === 'low' && p.stock_quantity > p.low_stock_threshold) return false;
    if (stockFilter === 'out' && p.stock_quantity > 0) return false;
    if (stockFilter === 'in' && p.stock_quantity <= 0) return false;
    
    // Category filter
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    
    return true;
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string, newQuantity: number, oldQuantity: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId);

      if (error) throw error;
      
      // Log to inventory audit log
      await logInventoryChange(
        productId,
        oldQuantity,
        newQuantity,
        'manual_adjustment',
        `Stock updated from ${oldQuantity} to ${newQuantity}`
      );
      
      await logAdminAction({
        actionType: 'inventory_updated',
        entityType: 'product',
        entityId: productId,
        oldValues: { stock_quantity: oldQuantity },
        newValues: { stock_quantity: newQuantity },
      });
      
      toast.success('Stock updated successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setNewImageFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const uploadImage = async (productId: string): Promise<string | null> => {
    if (!newImageFile) return null;

    setUploadingImage(true);
    try {
      const fileExt = newImageFile.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, newImageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const clearImageSelection = () => {
    setNewImageFile(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Upload new image if selected
    let imageUrl = editingProduct?.image_url;
    if (newImageFile && editingProduct) {
      const uploadedUrl = await uploadImage(editingProduct.id);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    const productData = {
      description: formData.get('description') as string || null,
      image_url: imageUrl,
      stock_quantity: parseInt(formData.get('stock_quantity') as string),
      low_stock_threshold: parseInt(formData.get('low_stock_threshold') as string),
      cost_price: parseFloat(formData.get('cost_price') as string) || null,
      supplier_name: formData.get('supplier_name') as string || null,
      supplier_email: formData.get('supplier_email') as string || null,
      sku: formData.get('sku') as string || null,
    };

    try {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct?.id);

      if (error) throw error;

      await logAdminAction({
        actionType: 'product_updated',
        entityType: 'product',
        entityId: editingProduct?.id,
        newValues: productData,
      });

      toast.success('Product updated successfully');
      setIsDialogOpen(false);
      setEditingProduct(null);
      clearImageSelection();
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      clearImageSelection();
    }
  };

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold);
  const outOfStockProducts = products.filter(p => p.stock_quantity <= 0);
  const totalStockValue = products.reduce((sum, p) => sum + (p.cost_price || p.price) * p.stock_quantity, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.stock_quantity, 0);

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStockFilter('all');
    setCategoryFilter('all');
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">{totalUnits.toLocaleString()} total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">At cost price</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Inventory and Audit Log */}
      <Tabs defaultValue="inventory" className="w-full">
        <TabsList>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="audit-log" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Inventory ({filteredProducts.length})</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {canEdit && (
                    <>
                      <BulkStockUpdate products={products} onUpdate={fetchProducts} />
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
          {/* Filters */}
          <InventoryFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            stockFilter={stockFilter}
            onStockFilterChange={setStockFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            categories={categories}
            onClearFilters={clearFilters}
          />

          <AddInventoryDialog 
            open={isAddDialogOpen} 
            onOpenChange={setIsAddDialogOpen} 
            onProductAdded={fetchProducts}
          />

          {/* Selected Products Actions */}
          {selectedProducts.size > 0 && canEdit && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedProducts.size} selected</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProducts(new Set())}
              >
                Clear selection
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                {canEdit && (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                      onCheckedChange={toggleAllProducts}
                    />
                  </TableHead>
                )}
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    No products found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    {canEdit && (
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => toggleProductSelection(product.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="outline">{product.category}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>
                    <div className="flex items-center gap-2">
                      {isReadOnly ? (
                        <span className="font-mono">{product.stock_quantity}</span>
                      ) : (
                        <Input
                          type="number"
                          defaultValue={product.stock_quantity}
                          className="w-20"
                          onBlur={(e) => {
                            const newValue = parseInt(e.target.value);
                            if (newValue !== product.stock_quantity) {
                              handleUpdateStock(product.id, newValue, product.stock_quantity);
                            }
                          }}
                        />
                      )}
                      {product.stock_quantity <= product.low_stock_threshold && (
                        <Badge variant="destructive">Low</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{product.low_stock_threshold}</TableCell>
                  <TableCell>{product.supplier_name || '-'}</TableCell>
                  <TableCell>
                    <Dialog open={isDialogOpen && editingProduct?.id === product.id} onOpenChange={handleDialogClose}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                          title={isReadOnly ? 'View Details' : 'Edit'}
                        >
                          {isReadOnly ? <Eye className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                          <DialogTitle>{isReadOnly ? 'Product Details' : 'Edit Product Details'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
                          {/* Product Image */}
                          <div>
                            <Label>Product Image</Label>
                            <div className="mt-2 space-y-3">
                              {/* Current/Preview Image */}
                              <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden border">
                                {(previewImage || editingProduct?.image_url) ? (
                                  <img
                                    src={previewImage || editingProduct?.image_url || ''}
                                    alt={editingProduct?.name || 'Product'}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <Package className="h-12 w-12" />
                                  </div>
                                )}
                                {previewImage && !isReadOnly && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={clearImageSelection}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              {/* Upload Button */}
                              {!isReadOnly && (
                                <div>
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    id="product-image-upload"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                  >
                                    {uploadingImage ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        {previewImage ? 'Change Image' : 'Upload Image'}
                                      </>
                                    )}
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Max file size: 5MB. Supported: JPG, PNG, WebP
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Product Image Gallery */}
                          {editingProduct && (
                            <ProductImageGallery
                              productId={editingProduct.id}
                              isReadOnly={isReadOnly}
                            />
                          )}

                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              name="description"
                              defaultValue={editingProduct?.description || ''}
                              rows={3}
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="stock_quantity">Stock Quantity</Label>
                            <Input
                              id="stock_quantity"
                              name="stock_quantity"
                              type="number"
                              defaultValue={editingProduct?.stock_quantity}
                              required
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                            <Input
                              id="low_stock_threshold"
                              name="low_stock_threshold"
                              type="number"
                              defaultValue={editingProduct?.low_stock_threshold}
                              required
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cost_price">Cost Price</Label>
                            <Input
                              id="cost_price"
                              name="cost_price"
                              type="number"
                              step="0.01"
                              defaultValue={editingProduct?.cost_price || ''}
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="sku">SKU</Label>
                            <Input
                              id="sku"
                              name="sku"
                              defaultValue={editingProduct?.sku || ''}
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="supplier_name">Supplier Name</Label>
                            <Input
                              id="supplier_name"
                              name="supplier_name"
                              defaultValue={editingProduct?.supplier_name || ''}
                              disabled={isReadOnly}
                            />
                          </div>
                          <div>
                            <Label htmlFor="supplier_email">Supplier Email</Label>
                            <Input
                              id="supplier_email"
                              name="supplier_email"
                              type="email"
                              defaultValue={editingProduct?.supplier_email || ''}
                              disabled={isReadOnly}
                            />
                          </div>
                          {canEdit && (
                            <Button type="submit" className="w-full" disabled={uploadingImage}>
                              {uploadingImage ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                'Save Changes'
                              )}
                            </Button>
                          )}
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="audit-log" className="mt-4">
          <InventoryAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
};
