import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Tag, Percent, DollarSign, Eye, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useAdminRole } from "@/hooks/useAdminRole";

interface Promotion {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  current_uses: number;
  max_uses_per_user: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  applies_to: string;
  is_subscription_eligible: boolean | null;
  created_at: string;
}

const PromotionsManagement = () => {
  const { canEdit, isReadOnly } = useAdminRole();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 0,
    max_uses: "",
    max_uses_per_user: 1,
    starts_at: "",
    expires_at: "",
    is_active: true,
    applies_to: "all",
    is_subscription_eligible: false,
  });

  const { data: promotions, isLoading } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Promotion[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("promotions").insert({
        code: data.code.toUpperCase(),
        description: data.description || null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        min_order_amount: data.min_order_amount || null,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        max_uses_per_user: data.max_uses_per_user || null,
        starts_at: data.starts_at || null,
        expires_at: data.expires_at || null,
        is_active: data.is_active,
        applies_to: data.applies_to,
        is_subscription_eligible: data.is_subscription_eligible,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Promotion created successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create promotion");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from("promotions")
        .update({
          code: data.code?.toUpperCase(),
          description: data.description || null,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          min_order_amount: data.min_order_amount || null,
          max_uses: data.max_uses ? parseInt(data.max_uses as string) : null,
          max_uses_per_user: data.max_uses_per_user || null,
          starts_at: data.starts_at || null,
          expires_at: data.expires_at || null,
          is_active: data.is_active,
          applies_to: data.applies_to,
          is_subscription_eligible: data.is_subscription_eligible,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Promotion updated successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update promotion");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Promotion deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete promotion");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_amount: 0,
      max_uses: "",
      max_uses_per_user: 1,
      starts_at: "",
      expires_at: "",
      is_active: true,
      applies_to: "all",
      is_subscription_eligible: false,
    });
    setEditingPromotion(null);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description || "",
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      min_order_amount: promotion.min_order_amount || 0,
      max_uses: promotion.max_uses?.toString() || "",
      max_uses_per_user: promotion.max_uses_per_user || 1,
      starts_at: promotion.starts_at ? promotion.starts_at.split("T")[0] : "",
      expires_at: promotion.expires_at ? promotion.expires_at.split("T")[0] : "",
      is_active: promotion.is_active,
      applies_to: promotion.applies_to,
      is_subscription_eligible: promotion.is_subscription_eligible || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (promotion: Promotion) => {
    if (!promotion.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (promotion.expires_at && new Date(promotion.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (promotion.starts_at && new Date(promotion.starts_at) > new Date()) {
      return <Badge variant="outline">Scheduled</Badge>;
    }
    if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    return <Badge className="bg-green-500">Active</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Promotions & Coupons
        </CardTitle>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., WELCOME20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Welcome discount for new customers"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    {formData.discount_type === "percentage" ? "Discount %" : "Amount ($)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    max={formData.discount_type === "percentage" ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applies To</Label>
                <Select
                  value={formData.applies_to}
                  onValueChange={(value) => setFormData({ ...formData, applies_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="subscription">Subscriptions Only</SelectItem>
                    <SelectItem value="one_time">One-Time Purchases Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Total Uses Limit</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_uses_per_user">Per User Limit</Label>
                  <Input
                    id="max_uses_per_user"
                    type="number"
                    min="1"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData({ ...formData, max_uses_per_user: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Start Date</Label>
                  <Input
                    id="starts_at"
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration Date</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div>
                  <Label htmlFor="is_subscription_eligible" className="text-sm font-medium">
                    Subscription Eligible
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Allow this coupon to be used on subscription purchases
                  </p>
                </div>
                <Switch
                  id="is_subscription_eligible"
                  checked={formData.is_subscription_eligible}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_subscription_eligible: checked })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPromotion ? "Update Promotion" : "Create Promotion"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading promotions...</div>
        ) : !promotions?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No promotions yet. Create your first coupon code!
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Applies To</TableHead>
                <TableHead>Subs Eligible</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    <div>
                      <span className="font-mono font-bold">{promo.code}</span>
                      {promo.description && (
                        <p className="text-xs text-muted-foreground">{promo.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {promo.discount_type === "percentage" ? (
                        <><Percent className="h-3 w-3" />{promo.discount_value}%</>
                      ) : (
                        <><DollarSign className="h-3 w-3" />{promo.discount_value}</>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {promo.current_uses}{promo.max_uses ? ` / ${promo.max_uses}` : ""}
                  </TableCell>
                  <TableCell className="capitalize">{promo.applies_to.replace("_", " ")}</TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {promo.is_subscription_eligible ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {promo.is_subscription_eligible 
                            ? "This coupon can be used on subscription purchases" 
                            : "This coupon cannot be used on subscriptions"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>{getStatusBadge(promo)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit ? (
                        <>
                          <Switch
                            checked={promo.is_active}
                            onCheckedChange={(checked) => 
                              toggleActiveMutation.mutate({ id: promo.id, is_active: checked })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(promo)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this promotion?")) {
                                deleteMutation.mutate(promo.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon" title="View Only">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionsManagement;
