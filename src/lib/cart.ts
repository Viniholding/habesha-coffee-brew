import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AddToCartResult {
  success: boolean;
  requiresAuth: boolean;
}

export const addToCart = async (productId: string, quantity: number = 1): Promise<AddToCartResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Return that auth is required instead of showing toast
      return { success: false, requiresAuth: true };
    }

    // Check if item already exists in cart
    const { data: existingItem, error: fetchError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingItem) {
      // Update quantity if item exists
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id);

      if (updateError) throw updateError;
    } else {
      // Insert new item
      const { error: insertError } = await supabase
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity
        });

      if (insertError) throw insertError;
    }

    toast.success("Added to cart");
    return { success: true, requiresAuth: false };
  } catch (error) {
    console.error("Error adding to cart:", error);
    toast.error("Failed to add to cart");
    return { success: false, requiresAuth: false };
  }
};
