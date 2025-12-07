// Guest cart management using localStorage
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
