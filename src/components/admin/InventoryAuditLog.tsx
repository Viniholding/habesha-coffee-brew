import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Calendar as CalendarIcon,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  product_id: string;
  admin_user_id: string;
  previous_quantity: number;
  new_quantity: number;
  quantity_change: number;
  change_type: string;
  notes: string | null;
  created_at: string;
  products: {
    name: string;
    sku: string | null;
  } | null;
}

const changeTypeLabels: Record<string, string> = {
  manual_adjustment: "Manual Adjustment",
  bulk_update: "Bulk Update",
  order_fulfillment: "Order Fulfillment",
  stock_correction: "Stock Correction",
  initial_stock: "Initial Stock",
  return: "Return",
  damaged: "Damaged",
  other: "Other",
};

const changeTypeColors: Record<string, string> = {
  manual_adjustment: "bg-blue-100 text-blue-800",
  bulk_update: "bg-purple-100 text-purple-800",
  order_fulfillment: "bg-green-100 text-green-800",
  stock_correction: "bg-yellow-100 text-yellow-800",
  initial_stock: "bg-gray-100 text-gray-800",
  return: "bg-teal-100 text-teal-800",
  damaged: "bg-red-100 text-red-800",
  other: "bg-gray-100 text-gray-800",
};

export function InventoryAuditLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [changeTypeFilter, setChangeTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ["inventory-audit-log", searchQuery, changeTypeFilter, dateFrom, dateTo, page],
    queryFn: async () => {
      let query = supabase
        .from("inventory_audit_log")
        .select(`
          *,
          products (name, sku)
        `)
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (changeTypeFilter && changeTypeFilter !== "all") {
        query = query.eq("change_type", changeTypeFilter);
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by search query on client side (product name/sku)
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return (data as AuditLogEntry[]).filter(
          (log) =>
            log.products?.name?.toLowerCase().includes(lowerQuery) ||
            log.products?.sku?.toLowerCase().includes(lowerQuery) ||
            log.notes?.toLowerCase().includes(lowerQuery)
        );
      }

      return data as AuditLogEntry[];
    },
  });

  const { data: totalCount } = useQuery({
    queryKey: ["inventory-audit-log-count", changeTypeFilter, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("inventory_audit_log")
        .select("id", { count: "exact", head: true });

      if (changeTypeFilter && changeTypeFilter !== "all") {
        query = query.eq("change_type", changeTypeFilter);
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  const clearFilters = () => {
    setSearchQuery("");
    setChangeTypeFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setPage(0);
  };

  const exportToCSV = () => {
    if (!auditLogs || auditLogs.length === 0) return;

    const headers = ["Date", "Product", "SKU", "Previous Qty", "New Qty", "Change", "Type", "Notes"];
    const rows = auditLogs.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.products?.name || "Unknown",
      log.products?.sku || "",
      log.previous_quantity,
      log.new_quantity,
      log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change,
      changeTypeLabels[log.change_type] || log.change_type,
      log.notes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `inventory-audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  const hasActiveFilters = searchQuery || changeTypeFilter !== "all" || dateFrom || dateTo;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Inventory Audit Log
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!auditLogs?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name, SKU, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-[180px]">
            <label className="text-sm font-medium mb-1 block">Change Type</label>
            <Select value={changeTypeFilter} onValueChange={setChangeTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(changeTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[160px]">
            <label className="text-sm font-medium mb-1 block">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Select"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="w-[160px]">
            <label className="text-sm font-medium mb-1 block">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "Select"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {auditLogs?.length || 0} of {totalCount || 0} entries
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-center">Previous</TableHead>
                <TableHead className="text-center">Change</TableHead>
                <TableHead className="text-center">New</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading audit log...
                  </TableCell>
                </TableRow>
              ) : auditLogs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No audit log entries found
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "MMM d, yyyy")}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "h:mm a")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{log.products?.name || "Unknown Product"}</div>
                      {log.products?.sku && (
                        <div className="text-xs text-muted-foreground">SKU: {log.products.sku}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {log.previous_quantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {log.quantity_change > 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        ) : log.quantity_change < 0 ? (
                          <ArrowDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-400" />
                        )}
                        <span
                          className={cn(
                            "font-mono font-medium",
                            log.quantity_change > 0 && "text-green-600",
                            log.quantity_change < 0 && "text-red-600"
                          )}
                        >
                          {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-medium">
                      {log.new_quantity}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", changeTypeColors[log.change_type])}>
                        {changeTypeLabels[log.change_type] || log.change_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={log.notes || undefined}>
                      {log.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
