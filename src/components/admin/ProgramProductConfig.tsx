import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Coffee, Save, Loader2 } from "lucide-react";

interface Program {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  default_product_id: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string | null;
}

const ProgramProductConfig = () => {
  const queryClient = useQueryClient();
  const [editingProgram, setEditingProgram] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string>>({});

  const { data: programs, isLoading: loadingPrograms } = useQuery({
    queryKey: ["admin-subscription-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_programs")
        .select("id, name, description, is_active, default_product_id")
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

  const updateMutation = useMutation({
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

  const handleSave = (programId: string) => {
    const productId = selectedProducts[programId];
    updateMutation.mutate({ 
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
          Configure which coffee product is linked to each subscription program. When customers select a program, they'll be directed to that product.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Subscription Programs
          </CardTitle>
          <CardDescription>
            Assign a default product to each subscription program
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default Product</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs?.map((program) => {
                const isEditing = editingProgram === program.id;
                const isBuildYourOwn = program.name === "Build Your Own";
                
                return (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {program.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant={program.is_active ? "default" : "secondary"}>
                        {program.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isBuildYourOwn ? (
                        <span className="text-muted-foreground italic">Uses quiz selection</span>
                      ) : isEditing ? (
                        <Select
                          value={selectedProducts[program.id] || program.default_product_id || "none"}
                          onValueChange={(value) => setSelectedProducts(prev => ({
                            ...prev,
                            [program.id]: value
                          }))}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No product</SelectItem>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={program.default_product_id ? "" : "text-muted-foreground"}>
                          {getProductName(program.default_product_id)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isBuildYourOwn && (
                        isEditing ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave(program.id)}
                              disabled={updateMutation.isPending}
                            >
                              {updateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingProgram(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingProgram(program.id);
                              setSelectedProducts(prev => ({
                                ...prev,
                                [program.id]: program.default_product_id || "none"
                              }));
                            }}
                          >
                            Edit
                          </Button>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgramProductConfig;
