import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Package, AlertTriangle, Edit, Eye, Plus } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import AddInventoryDialog from './AddInventoryDialog';

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
  cost_price: number | null;
  supplier_name: string | null;
  supplier_email: string | null;
  sku: string | null;
}

export const InventoryManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { canEdit, isReadOnly } = useAdminRole();

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

  const handleUpdateStock = async (productId: string, newQuantity: number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId);

      if (error) throw error;
      
      toast.success('Stock updated successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData = {
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

      toast.success('Product updated successfully');
      setIsDialogOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${products.reduce((sum, p) => sum + (p.cost_price || p.price) * p.stock_quantity, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
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
                              handleUpdateStock(product.id, newValue);
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
                    <Dialog open={isDialogOpen && editingProduct?.id === product.id} onOpenChange={setIsDialogOpen}>
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
                      <DialogContent>
                      <DialogHeader>
                          <DialogTitle>{isReadOnly ? 'Product Details' : 'Edit Product Details'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveProduct} className="space-y-4">
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
                            <Button type="submit" className="w-full">Save Changes</Button>
                          )}
                        </form>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
