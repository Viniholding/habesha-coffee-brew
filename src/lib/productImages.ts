// Local product image imports for assets stored in src/assets
import coffeeScoopImg from '@/assets/coffee-scoop.png';
import productBagImg from '@/assets/product-bag.jpg';
import coffeeHararImg from '@/assets/coffee-harar.jpg';
import coffeeSidamoImg from '@/assets/coffee-sidamo.jpg';
import coffeeYirgacheffeImg from '@/assets/coffee-yirgacheffe.jpg';

// Map of local asset paths to their imported modules
const localAssets: Record<string, string> = {
  '/src/assets/coffee-scoop.png': coffeeScoopImg,
  '/src/assets/product-bag.jpg': productBagImg,
  '/src/assets/coffee-harar.jpg': coffeeHararImg,
  '/src/assets/coffee-sidamo.jpg': coffeeSidamoImg,
  '/src/assets/coffee-yirgacheffe.jpg': coffeeYirgacheffeImg,
};

/**
 * Resolves a product image URL. If it's a local asset path, returns the imported module.
 * Otherwise returns the URL as-is (for external URLs or Supabase storage).
 */
export function resolveProductImage(imageUrl: string | null, fallback: string = productBagImg): string {
  if (!imageUrl) return fallback;
  
  // Check if it's a local asset path
  if (localAssets[imageUrl]) {
    return localAssets[imageUrl];
  }
  
  // Return the URL as-is for external URLs
  return imageUrl;
}

export { productBagImg as defaultProductImage };
