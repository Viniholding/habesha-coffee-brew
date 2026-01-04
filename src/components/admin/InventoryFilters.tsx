import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stockFilter: string;
  onStockFilterChange: (filter: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  categories: string[];
  onClearFilters: () => void;
}

export default function InventoryFilters({
  searchQuery,
  onSearchChange,
  stockFilter,
  onStockFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  onClearFilters,
}: InventoryFiltersProps) {
  const hasActiveFilters = searchQuery || stockFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or SKU..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={stockFilter} onValueChange={onStockFilterChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Stock Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stock</SelectItem>
          <SelectItem value="low">Low Stock</SelectItem>
          <SelectItem value="out">Out of Stock</SelectItem>
          <SelectItem value="in">In Stock</SelectItem>
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
