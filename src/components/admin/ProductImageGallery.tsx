import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X, Loader2, GripVertical, Trash2 } from 'lucide-react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface ProductImageGalleryProps {
  productId: string;
  isReadOnly: boolean;
}

interface SortableImageProps {
  image: ProductImage;
  onDelete: (id: string) => void;
  isReadOnly: boolean;
  isDeleting: boolean;
}

const SortableImage = ({ image, onDelete, isReadOnly, isDeleting }: SortableImageProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-muted rounded-lg overflow-hidden border aspect-square"
    >
      <img
        src={image.image_url}
        alt={image.alt_text || 'Product image'}
        className="w-full h-full object-cover"
      />
      {!isReadOnly && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute top-1 left-1 p-1 bg-background/80 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
          </Button>
        </>
      )}
    </div>
  );
};

export default function ProductImageGallery({ productId, isReadOnly }: ProductImageGalleryProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 5MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            image_url: publicUrl,
            alt_text: file.name,
            sort_order: images.length + i,
          });

        if (insertError) {
          toast.error(`Failed to save ${file.name}`);
        }
      }

      toast.success('Images uploaded successfully');
      fetchImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageId: string) => {
    setDeletingId(imageId);
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      setImages(newImages);

      // Update sort orders in database
      try {
        for (let i = 0; i < newImages.length; i++) {
          await supabase
            .from('product_images')
            .update({ sort_order: i })
            .eq('id', newImages[i].id);
        }
      } catch (error) {
        console.error('Failed to update order:', error);
        fetchImages(); // Revert on error
      }
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading images...</div>;
  }

  return (
    <div className="space-y-3">
      <Label>Product Images ({images.length})</Label>
      
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 gap-2">
              {images.map((image) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  onDelete={handleDelete}
                  isReadOnly={isReadOnly}
                  isDeleting={deletingId === image.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {images.length === 0 && (
        <div className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
          No additional images
        </div>
      )}

      {!isReadOnly && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Add Images
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Drag images to reorder. Max 5MB each.
          </p>
        </div>
      )}
    </div>
  );
}
