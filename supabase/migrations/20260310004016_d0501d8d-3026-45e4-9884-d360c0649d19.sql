
-- Revert products approach: the view adds complexity. Instead, keep public SELECT 
-- and fix client code to not request sensitive columns.
DROP VIEW IF EXISTS public.public_products;

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;

-- Re-add public SELECT (needed for storefront)
CREATE POLICY "Products are viewable by everyone"
  ON public.products
  FOR SELECT
  USING (true);
