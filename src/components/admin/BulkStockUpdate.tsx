import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, Loader2, Check, AlertCircle } from 'lucide-react';
import { logAdminAction } from '@/lib/auditLog';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
}

interface ParsedRow {
  sku?: string;
  name?: string;
  quantity: number;
  matched?: Product;
  error?: string;
}

interface BulkStockUpdateProps {
  products: Product[];
  onUpdate: () => void;
}

export default function BulkStockUpdate({ products, onUpdate }: BulkStockUpdateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      toast.error('CSV file must have a header row and at least one data row');
      return;
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const skuIndex = header.findIndex(h => h === 'sku' || h === 'product_sku');
    const nameIndex = header.findIndex(h => h === 'name' || h === 'product_name');
    const quantityIndex = header.findIndex(h => h === 'quantity' || h === 'stock_quantity' || h === 'stock');

    if (quantityIndex === -1) {
      toast.error('CSV must have a "quantity" or "stock_quantity" column');
      return;
    }

    if (skuIndex === -1 && nameIndex === -1) {
      toast.error('CSV must have either "sku" or "name" column to identify products');
      return;
    }

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const sku = skuIndex !== -1 ? values[skuIndex] : undefined;
      const name = nameIndex !== -1 ? values[nameIndex] : undefined;
      const quantityStr = values[quantityIndex];
      const quantity = parseInt(quantityStr);

      if (isNaN(quantity)) {
        rows.push({ sku, name, quantity: 0, error: 'Invalid quantity' });
        continue;
      }

      // Try to match product
      let matched: Product | undefined;
      if (sku) {
        matched = products.find(p => p.sku?.toLowerCase() === sku.toLowerCase());
      }
      if (!matched && name) {
        matched = products.find(p => p.name.toLowerCase() === name.toLowerCase());
      }

      rows.push({
        sku,
        name,
        quantity,
        matched,
        error: matched ? undefined : 'Product not found',
      });
    }

    setParsedData(rows);
    setCompleted(false);
  };

  const handleApply = async () => {
    const validRows = parsedData.filter(r => r.matched && !r.error);
    if (validRows.length === 0) {
      toast.error('No valid rows to update');
      return;
    }

    setProcessing(true);
    try {
      for (const row of validRows) {
        if (!row.matched) continue;

        const { error } = await supabase
          .from('products')
          .update({ stock_quantity: row.quantity })
          .eq('id', row.matched.id);

        if (error) throw error;

        await logAdminAction({
          actionType: 'inventory_updated',
          entityType: 'product',
          entityId: row.matched.id,
          oldValues: { stock_quantity: row.matched.stock_quantity },
          newValues: { stock_quantity: row.quantity },
        });
      }

      toast.success(`Updated ${validRows.length} products`);
      setCompleted(true);
      onUpdate();
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Failed to update some products');
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const headers = 'sku,name,quantity';
    const rows = products.map(p => `"${p.sku || ''}","${p.name}",${p.stock_quantity}`);
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportInventory = () => {
    const headers = 'id,sku,name,stock_quantity';
    const rows = products.map(p => `"${p.id}","${p.sku || ''}","${p.name}",${p.stock_quantity}`);
    const csv = [headers, ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setIsOpen(false);
    setParsedData([]);
    setCompleted(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedData.filter(r => r.matched && !r.error).length;
  const errorCount = parsedData.filter(r => r.error).length;

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportInventory}>
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Stock Update</DialogTitle>
            <DialogDescription>
              Upload a CSV file to update stock quantities for multiple products at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {parsedData.length === 0 ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a CSV file with columns: <code className="bg-muted px-1">sku</code> or <code className="bg-muted px-1">name</code>, and <code className="bg-muted px-1">quantity</code>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Select CSV File
                    </Button>
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{parsedData.length} rows</Badge>
                  <Badge variant="default" className="bg-green-500">{validCount} valid</Badge>
                  {errorCount > 0 && (
                    <Badge variant="destructive">{errorCount} errors</Badge>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>SKU/Name</TableHead>
                        <TableHead>New Qty</TableHead>
                        <TableHead>Current</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            {row.error ? (
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {row.matched?.name || row.name || row.sku || '-'}
                              {row.error && (
                                <span className="text-xs text-destructive block">{row.error}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{row.quantity}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {row.matched?.stock_quantity ?? '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => {
                    setParsedData([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}>
                    Upload Different File
                  </Button>
                  <Button 
                    onClick={handleApply} 
                    disabled={validCount === 0 || processing || completed}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : completed ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      `Apply ${validCount} Updates`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
