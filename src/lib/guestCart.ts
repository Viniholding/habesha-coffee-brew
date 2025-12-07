// Guest cart management using localStorage
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GuestCartItem {
  productId: string;
  productName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

const GUEST_CART_KEY = "guest_cart";

export const getGuestCart = (): GuestCartItem[] => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

export const saveGuestCart = (cart: GuestCartItem[]): void => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Failed to save guest cart:", error);
  }
};

export const addToGuestCart = (item: Omit<GuestCartItem, "quantity">, quantity: number = 1): void => {
  const cart = getGuestCart();
  const existingIndex = cart.findIndex(i => i.productId === item.productId);

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }

  saveGuestCart(cart);
  toast.success("Added to cart");
};

export const updateGuestCartQuantity = (productId: string, quantity: number): void => {
  const cart = getGuestCart();
  const index = cart.findIndex(i => i.productId === productId);
  
  if (index >= 0) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
    saveGuestCart(cart);
  }
};

export const removeFromGuestCart = (productId: string): void => {
  const cart = getGuestCart().filter(i => i.productId !== productId);
  saveGuestCart(cart);
  toast.success("Item removed");
};

export const clearGuestCart = (): void => {
  localStorage.removeItem(GUEST_CART_KEY);
};

export const getGuestCartTotal = (): { items: number; price: number } => {
  const cart = getGuestCart();
  return {
    items: cart.reduce((sum, item) => sum + item.quantity, 0),
    price: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
};

// Merge guest cart items into user's cart in database
export const mergeGuestCartToUser = async (userId: string): Promise<void> => {
  const guestCart = getGuestCart();
  
  if (guestCart.length === 0) return;

  try {
    // For each guest cart item, add to user's cart
    for (const item of guestCart) {
      // Check if item already exists in user's cart
      const { data: existingItem, error: fetchError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", userId)
        .eq("product_id", item.productId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing cart item:", fetchError);
        continue;
      }

      if (existingItem) {
        // Update quantity if item exists
        await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + item.quantity })
          .eq("id", existingItem.id);
      } else {
        // Insert new item
        await supabase
          .from("cart_items")
          .insert({
            user_id: userId,
            product_id: item.productId,
            quantity: item.quantity,
          });
      }
    }

    // Clear guest cart after successful merge
    clearGuestCart();
    toast.success("Your cart has been synced!");
  } catch (error) {
    console.error("Error merging guest cart:", error);
  }
};
