import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Check, Star } from "lucide-react";
import { toast } from "sonner";

interface Address {
  id: string;
  address_type: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
}

interface CheckoutAddressFormProps {
  userId: string | null;
  selectedAddressId: string | null;
  onAddressSelect: (addressId: string | null, addressData?: any) => void;
  guestMode?: boolean;
}

const CheckoutAddressForm = ({
  userId,
  selectedAddressId,
  onAddressSelect,
  guestMode = false,
}: CheckoutAddressFormProps) => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    full_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    phone: "",
  });

  useEffect(() => {
    if (userId && !guestMode) {
      fetchAddresses();
    } else {
      setLoading(false);
      setShowNewForm(true);
    }
  }, [userId, guestMode]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .eq("address_type", "shipping")
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
      
      // Auto-select default address
      const defaultAddr = data?.find(a => a.is_default);
      if (defaultAddr && !selectedAddressId) {
        onAddressSelect(defaultAddr.id);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAddressChange = (field: string, value: string) => {
    const updated = { ...newAddress, [field]: value };
    setNewAddress(updated);
    
    // For guest mode, pass the address data up
    if (guestMode) {
      onAddressSelect(null, updated);
    }
  };

  const handleSaveNewAddress = async () => {
    if (!userId) return;

    const { full_name, address_line1, city, state, postal_code } = newAddress;
    if (!full_name || !address_line1 || !city || !state || !postal_code) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: userId,
          address_type: "shipping",
          full_name: newAddress.full_name,
          address_line1: newAddress.address_line1,
          address_line2: newAddress.address_line2 || null,
          city: newAddress.city,
          state: newAddress.state,
          postal_code: newAddress.postal_code,
          phone: newAddress.phone || null,
          country: "US",
          is_default: addresses.length === 0,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Address saved");
      setShowNewForm(false);
      await fetchAddresses();
      onAddressSelect(data.id);
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
  };

  const isNewAddressValid = () => {
    const { full_name, address_line1, city, state, postal_code } = newAddress;
    return full_name && address_line1 && city && state && postal_code;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Shipping Address
        </CardTitle>
        <CardDescription>
          Where should we deliver your order?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing addresses */}
        {!guestMode && addresses.length > 0 && !showNewForm && (
          <RadioGroup
            value={selectedAddressId || ""}
            onValueChange={(val) => onAddressSelect(val)}
            className="space-y-3"
          >
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedAddressId === address.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => onAddressSelect(address.id)}
              >
                <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{address.full_name}</span>
                    {address.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-muted-foreground">{address.phone}</p>
                  )}
                </Label>
                {selectedAddressId === address.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Add new address button */}
        {!guestMode && addresses.length > 0 && !showNewForm && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowNewForm(true)}
          >
            <Plus className="h-4 w-4" />
            Add New Address
          </Button>
        )}

        {/* New address form */}
        {(showNewForm || guestMode || addresses.length === 0) && (
          <div className="space-y-4">
            {!guestMode && addresses.length > 0 && (
              <div className="flex justify-between items-center">
                <h4 className="font-medium">New Address</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={newAddress.full_name}
                  onChange={(e) => handleNewAddressChange("full_name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_line1">Street Address *</Label>
                <Input
                  id="address_line1"
                  value={newAddress.address_line1}
                  onChange={(e) => handleNewAddressChange("address_line1", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address_line2">Apartment, suite, etc.</Label>
                <Input
                  id="address_line2"
                  value={newAddress.address_line2}
                  onChange={(e) => handleNewAddressChange("address_line2", e.target.value)}
                  placeholder="Apt 4B"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => handleNewAddressChange("city", e.target.value)}
                  placeholder="New York"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={newAddress.state}
                  onChange={(e) => handleNewAddressChange("state", e.target.value)}
                  placeholder="NY"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">ZIP Code *</Label>
                <Input
                  id="postal_code"
                  value={newAddress.postal_code}
                  onChange={(e) => handleNewAddressChange("postal_code", e.target.value)}
                  placeholder="10001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newAddress.phone}
                  onChange={(e) => handleNewAddressChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {!guestMode && (
              <Button
                className="w-full"
                onClick={handleSaveNewAddress}
                disabled={!isNewAddressValid()}
              >
                Save & Use This Address
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckoutAddressForm;
