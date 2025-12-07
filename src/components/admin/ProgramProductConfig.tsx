import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Coffee, Save, Loader2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Program {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  default_product_id: string | null;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  category: string | null;
}

interface SortableRowProps {
  program: Program;
  products: Product[];
  isEditing: boolean;
  selectedProduct: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onProductChange: (value: string) => void;
  isSaving: boolean;
  getProductName: (id: string | null) => string;
}

const SortableRow = ({ 
  program, 
  products, 
  isEditing, 
  selectedProduct,
  onEdit,
  onSave,
  onCancel,
  onProductChange,
  isSaving,
  getProductName 
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: program.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isBuildYourOwn = program.name === "Build Your Own";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 border rounded-lg bg-card ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>

      <div className="flex-1 grid grid-cols-4 gap-4 items-center">
        <div>
          <span className="font-medium">{program.name}</span>
          {program.description && (
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {program.description}
            </p>
          )}
        </div>

        <div>
          <Badge variant={program.is_active ? "default" : "secondary"}>
            {program.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div>
          {isBuildYourOwn ? (
            <span className="text-muted-foreground italic text-sm">Uses quiz selection</span>
          ) : isEditing ? (
            <Select value={selectedProduct} onValueChange={onProductChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No product</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className={program.default_product_id ? "" : "text-muted-foreground text-sm"}>
              {getProductName(program.default_product_id)}
            </span>
          )}
        </div>

        <div className="flex justify-end gap-2">
          {!isBuildYourOwn && (
            isEditing ? (
              <>
                <Button size="sm" onClick={onSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={onEdit}>
                Edit
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const ProgramProductConfig = () => {
  const queryClient = useQueryClient();
  const [editingProgram, setEditingProgram] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: programs, isLoading: loadingPrograms } = useQuery({
    queryKey: ["admin-subscription-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_programs")
        .select("id, name, description, is_active, default_product_id, sort_order")
        .order("sort_order");
      
      if (error) throw error;
      return data as Program[];
    },
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category")
        .eq("category", "coffee")
        .order("name");
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ programId, productId }: { programId: string; productId: string | null }) => {
      const { error } = await supabase
        .from("subscription_programs")
        .update({ default_product_id: productId })
        .eq("id", programId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-programs"] });
      toast.success("Program product updated successfully");
      setEditingProgram(null);
    },
    onError: (error) => {
      console.error("Error updating program:", error);
      toast.error("Failed to update program product");
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      for (const update of updates) {
        const { error } = await supabase
          .from("subscription_programs")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscription-programs"] });
      toast.success("Program order updated");
    },
    onError: (error) => {
      console.error("Error updating order:", error);
      toast.error("Failed to update program order");
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && programs) {
      const oldIndex = programs.findIndex((p) => p.id === active.id);
      const newIndex = programs.findIndex((p) => p.id === over.id);

      const newOrder = arrayMove(programs, oldIndex, newIndex);
      const updates = newOrder.map((program, index) => ({
        id: program.id,
        sort_order: index,
      }));

      updateOrderMutation.mutate(updates);
    }
  };

  const handleSave = (programId: string) => {
    const productId = selectedProducts[programId];
    updateProductMutation.mutate({ 
      programId, 
      productId: productId === "none" ? null : productId 
    });
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return "Not configured";
    const product = products?.find(p => p.id === productId);
    return product?.name || "Unknown product";
  };

  const isLoading = loadingPrograms || loadingProducts;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Program Product Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure products and reorder subscription programs using drag-and-drop.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Subscription Programs
          </CardTitle>
          <CardDescription>
            Drag programs to reorder them. Assign a default product to each program.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-[40px_1fr] gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b">
              <div></div>
              <div className="grid grid-cols-4 gap-4">
                <div>Program</div>
                <div>Status</div>
                <div>Default Product</div>
                <div className="text-right">Actions</div>
              </div>
            </div>

            {programs && programs.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={programs.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {programs.map((program) => (
                    <SortableRow
                      key={program.id}
                      program={program}
                      products={products || []}
                      isEditing={editingProgram === program.id}
                      selectedProduct={selectedProducts[program.id] || program.default_product_id || "none"}
                      onEdit={() => {
                        setEditingProgram(program.id);
                        setSelectedProducts(prev => ({
                          ...prev,
                          [program.id]: program.default_product_id || "none"
                        }));
                      }}
                      onSave={() => handleSave(program.id)}
                      onCancel={() => setEditingProgram(null)}
                      onProductChange={(value) => setSelectedProducts(prev => ({
                        ...prev,
                        [program.id]: value
                      }))}
                      isSaving={updateProductMutation.isPending}
                      getProductName={getProductName}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramProductConfig;
