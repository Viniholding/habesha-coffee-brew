import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface SearchBarProps {
  isMobile?: boolean;
}

const SearchBar = ({ isMobile = false }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      searchProducts(searchQuery);
      setIsOpen(true);
    } else {
      setProducts([]);
      setIsOpen(false);
    }
  }, [searchQuery]);

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
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setIsOpen(false);
  };

  const focusSearch = () => {
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className={`relative ${isMobile ? 'w-full' : 'w-64 lg:w-80'}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length > 1 && setIsOpen(true)}
          className="pl-10 pr-10 bg-muted/50 border-border/50 focus:bg-background transition-colors"
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

      {isOpen && products.length > 0 && (
        <Command className="absolute top-full mt-2 w-full rounded-lg border border-border shadow-lg bg-popover z-50 animate-in fade-in-50 slide-in-from-top-2">
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

      {isOpen && searchQuery.length > 1 && products.length === 0 && (
        <Command className="absolute top-full mt-2 w-full rounded-lg border border-border shadow-lg bg-popover z-50">
          <CommandEmpty>No products found.</CommandEmpty>
        </Command>
      )}
    </div>
  );
};

export default SearchBar;
