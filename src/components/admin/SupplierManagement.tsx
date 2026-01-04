import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Mail, Phone, MapPin, Clock, Search } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';

interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  lead_time_days: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person: string;
  lead_time_days: number;
  notes: string;
  is_active: boolean;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  contact_person: '',
  lead_time_days: 7,
  notes: '',
  is_active: true,
};

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const { isReadOnly } = useAdminRole();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      toast.error('Failed to fetch suppliers');
      console.error(error);
    } else {
      setSuppliers(data || []);
    }
    setLoading(false);
  };

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        contact_person: supplier.contact_person || '',
        lead_time_days: supplier.lead_time_days,
        notes: supplier.notes || '',
        is_active: supplier.is_active,
      });
    } else {
      setEditingSupplier(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    setSaving(true);
    const supplierData = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      contact_person: formData.contact_person.trim() || null,
      lead_time_days: formData.lead_time_days,
      notes: formData.notes.trim() || null,
      is_active: formData.is_active,
    };

    if (editingSupplier) {
      const { error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', editingSupplier.id);

      if (error) {
        toast.error('Failed to update supplier');
        console.error(error);
      } else {
        toast.success('Supplier updated successfully');
        setDialogOpen(false);
        fetchSuppliers();
      }
    } else {
      const { error } = await supabase
        .from('suppliers')
        .insert(supplierData);

      if (error) {
        toast.error('Failed to create supplier');
        console.error(error);
      } else {
        toast.success('Supplier created successfully');
        setDialogOpen(false);
        fetchSuppliers();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete "${supplier.name}"?`)) return;

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', supplier.id);

    if (error) {
      toast.error('Failed to delete supplier');
      console.error(error);
    } else {
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    }
  };

  const handleSendReorderEmail = async (supplier: Supplier) => {
    if (!supplier.email) {
      toast.error('Supplier has no email address');
      return;
    }

    // Get products that need reordering for this supplier
    const { data: products, error } = await supabase
      .from('products')
      .select('name, sku, stock_quantity, reorder_point')
      .eq('supplier_id', supplier.id)
      .lt('stock_quantity', supabase.rpc as unknown as number);

    if (error) {
      console.error(error);
    }

    // For now, open email client with pre-filled content
    const subject = encodeURIComponent(`Reorder Request - ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(
      `Dear ${supplier.contact_person || supplier.name},\n\n` +
      `We would like to place a reorder for the following items:\n\n` +
      `[Please add items here]\n\n` +
      `Please confirm availability and expected delivery date.\n\n` +
      `Best regards`
    );
    
    window.open(`mailto:${supplier.email}?subject=${subject}&body=${body}`);
    toast.success('Opening email client...');
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Supplier Management</h2>
          <p className="text-muted-foreground">Manage your suppliers and automate reorder communications</p>
        </div>
        {!isReadOnly && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No suppliers found matching your search' : 'No suppliers yet. Add your first supplier to get started.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Lead Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.contact_person && (
                          <div className="text-sm text-muted-foreground">{supplier.contact_person}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {supplier.lead_time_days} days
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {supplier.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendReorderEmail(supplier)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        {!isReadOnly && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(supplier)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(supplier)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
            <DialogDescription>
              {editingSupplier ? 'Update supplier information' : 'Add a new supplier to your system'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter supplier name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="supplier@email.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Primary contact name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lead_time">Lead Time (days)</Label>
              <Input
                id="lead_time"
                type="number"
                min={1}
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value) || 7 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this supplier"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingSupplier ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
