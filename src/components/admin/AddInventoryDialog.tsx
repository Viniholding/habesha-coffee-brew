import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { logAdminAction } from '@/lib/auditLog';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
}

export default function AddInventoryDialog({ open, onOpenChange, onProductAdded }: AddInventoryDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      price: parseFloat(formData.get('price') as string),
      cost_price: parseFloat(formData.get('cost_price') as string) || null,
      stock_quantity: parseInt(formData.get('stock_quantity') as string) || 100,
      low_stock_threshold: parseInt(formData.get('low_stock_threshold') as string) || 20,
      sku: formData.get('sku') as string || null,
      category: formData.get('category') as string || null,
      supplier_name: formData.get('supplier_name') as string || null,
      supplier_email: formData.get('supplier_email') as string || null,
      image_url: formData.get('image_url') as string || null,
      in_stock: true,
    };

    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;

      await logAdminAction({
        actionType: 'product_created',
        entityType: 'product',
        entityId: data.id,
        newValues: productData,
      });

      toast.success('Product added successfully');
      onOpenChange(false);
      onProductAdded();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" name="name" required />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input id="price" name="price" type="number" step="0.01" required />
            </div>
            
            <div>
              <Label htmlFor="cost_price">Cost Price ($)</Label>
              <Input id="cost_price" name="cost_price" type="number" step="0.01" />
            </div>
            
            <div>
              <Label htmlFor="stock_quantity">Stock Quantity</Label>
              <Input id="stock_quantity" name="stock_quantity" type="number" defaultValue="100" />
            </div>
            
            <div>
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input id="low_stock_threshold" name="low_stock_threshold" type="number" defaultValue="20" />
            </div>
            
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Input id="category" name="category" placeholder="e.g., coffee, accessories" />
            </div>
            
            <div>
              <Label htmlFor="supplier_name">Supplier Name</Label>
              <Input id="supplier_name" name="supplier_name" />
            </div>
            
            <div>
              <Label htmlFor="supplier_email">Supplier Email</Label>
              <Input id="supplier_email" name="supplier_email" type="email" />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" name="image_url" type="url" placeholder="https://..." />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
