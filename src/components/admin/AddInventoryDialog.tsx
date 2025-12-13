import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductAdded: () => void;
}

const CATEGORIES = [
  'Coffee Beans',
  'Ground Coffee',
  'Equipment',
  'Accessories',
  'Merchandise',
];

export default function AddInventoryDialog({ open, onOpenChange, onProductAdded }: AddInventoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    sku: '',
    stockQuantity: '100',
    lowStockThreshold: '20',
    supplierName: '',
    supplierEmail: '',
    imageUrl: '',
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in required fields (name, price, category)');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          price: parseFloat(formData.price),
          cost_price: formData.costPrice ? parseFloat(formData.costPrice) : null,
          sku: formData.sku || null,
          stock_quantity: parseInt(formData.stockQuantity) || 100,
          low_stock_threshold: parseInt(formData.lowStockThreshold) || 20,
          supplier_name: formData.supplierName || null,
          supplier_email: formData.supplierEmail || null,
          image_url: formData.imageUrl || null,
          in_stock: parseInt(formData.stockQuantity) > 0,
        });

      if (error) throw error;

      // Log audit event
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user?.id,
        action_type: 'product_created',
        entity_type: 'products',
        new_values: { name: formData.name, price: formData.price },
      });

      toast.success('Product added successfully');
      onOpenChange(false);
      onProductAdded();
      resetForm();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      price: '',
      costPrice: '',
      sku: '',
      stockQuantity: '100',
      lowStockThreshold: '20',
      supplierName: '',
      supplierEmail: '',
      imageUrl: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your inventory
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ethiopian Yirgacheffe"
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description..."
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price ($) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="18.99"
              />
            </div>
            <div className="space-y-2">
              <Label>Cost Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="8.00"
              />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="ETH-YRG-001"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Low Stock Threshold</Label>
              <Input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Input
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="Coffee Farm Co."
              />
            </div>
            <div className="space-y-2">
              <Label>Supplier Email</Label>
              <Input
                type="email"
                value={formData.supplierEmail}
                onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
                placeholder="supplier@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image URL</Label>
            <Input
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
