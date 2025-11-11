import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface SearchBarProps {
  isMobile?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SearchBar = ({ isMobile = false, onOpenChange }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchQuery.length > 1) {
      searchProducts(searchQuery);
    } else {
      setProducts([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isDialogOpen) {
      // Focus input when dialog opens
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Clear search when dialog closes
      setSearchQuery("");
      setProducts([]);
    }
    onOpenChange?.(isDialogOpen);
  }, [isDialogOpen, onOpenChange]);

  const searchProducts = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, category")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("in_stock", true)
        .limit(5);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  const handleSelectProduct = (productId: string) => {
    navigate(`/products?id=${productId}`);
    setSearchQuery("");
    setIsDialogOpen(false);
  };

  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        className="relative"
        aria-label="Search products"
      >
        <Search className="h-5 w-5" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Search Products</DialogTitle>
          </DialogHeader>
          
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={handleClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {products.length > 0 && (
              <Command className="border-0">
                <CommandList>
                  <CommandGroup heading="Products">
                    {products.map((product) => (
                      <CommandItem
                        key={product.id}
                        onSelect={() => handleSelectProduct(product.id)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-sm text-primary font-semibold">
                              ${product.price}
                            </span>
                          </div>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}

            {searchQuery.length > 1 && products.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No products found.
              </div>
            )}

            {searchQuery.length <= 1 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Type to search for products...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchBar;
