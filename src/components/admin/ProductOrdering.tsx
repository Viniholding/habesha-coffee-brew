import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GripVertical, Save, RotateCcw } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  display_order: number;
  in_stock: boolean;
}

interface SortableProductProps {
  product: Product;
  isReadOnly: boolean;
}

function SortableProduct({ product, isReadOnly }: SortableProductProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id, disabled: isReadOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-card border rounded-lg ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      {!isReadOnly && (
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            No img
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{product.name}</div>
        <div className="text-sm text-muted-foreground">
          ${product.price.toFixed(2)} • {product.category || 'Uncategorized'}
        </div>
      </div>
      <div className={`text-sm px-2 py-1 rounded ${product.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {product.in_stock ? 'In Stock' : 'Out of Stock'}
      </div>
    </div>
  );
}

export default function ProductOrdering() {
  const [products, setProducts] = useState<Product[]>([]);
  const [originalOrder, setOriginalOrder] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { isReadOnly } = useAdminRole();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, category, display_order, in_stock')
      .order('display_order')
      .order('name');

    if (error) {
      toast.error('Failed to fetch products');
      console.error(error);
    } else {
      const sortedProducts = data || [];
      setProducts(sortedProducts);
      setOriginalOrder(sortedProducts);
    }
    setLoading(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newOrder;
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Update display_order for all products based on their position
    const updates = products.map((product, index) => ({
      id: product.id,
      display_order: index,
    }));

    let hasError = false;
    for (const update of updates) {
      const { error } = await supabase
        .from('products')
        .update({ display_order: update.display_order })
        .eq('id', update.id);

      if (error) {
        console.error('Error updating product order:', error);
        hasError = true;
      }
    }

    if (hasError) {
      toast.error('Failed to save some product orders');
    } else {
      toast.success('Product order saved successfully');
      setOriginalOrder(products);
      setHasChanges(false);
    }
    setSaving(false);
  };

  const handleReset = () => {
    setProducts(originalOrder);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Display Order</h2>
          <p className="text-muted-foreground">Drag and drop to reorder how products appear on the shop page</p>
        </div>
        {!isReadOnly && hasChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products ({products.length})</CardTitle>
          <CardDescription>
            {isReadOnly 
              ? 'You have read-only access. Contact an admin to change product order.'
              : 'Drag products to change their display order on the shop page'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={products.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {products.map((product) => (
                    <SortableProduct
                      key={product.id}
                      product={product}
                      isReadOnly={isReadOnly}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
