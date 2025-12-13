-- 1. Fix referrals table - drop overly permissive policy and create secure RPC function
DROP POLICY IF EXISTS "Anyone can check referral codes" ON public.referrals;

-- Create a secure RPC function for code validation only
CREATE OR REPLACE FUNCTION public.validate_referral_code(_code TEXT)
RETURNS TABLE(is_valid BOOLEAN, referee_discount_percent INTEGER)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (status IN ('pending', 'active') AND (expires_at IS NULL OR expires_at > now())),
    referee_discount_percent
  FROM referrals
  WHERE referral_code = _code;
$$;

-- Grant execute to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.validate_referral_code TO authenticated, anon;

-- 2. Add missing DELETE policy for delivery_preferences
CREATE POLICY "Users can delete their own delivery preferences"
ON public.delivery_preferences
FOR DELETE
USING (auth.uid() = user_id);

-- 3. Add product_id to order_items for secure stock management
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'order_items' 
    AND column_name = 'product_id'
  ) THEN
    ALTER TABLE public.order_items 
    ADD COLUMN product_id UUID REFERENCES public.products(id);
  END IF;
END $$;

-- 4. Update decrement_product_stock function with better security
CREATE OR REPLACE FUNCTION public.decrement_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  item RECORD;
BEGIN
  -- Only decrement stock for new orders
  IF TG_OP = 'INSERT' THEN
    -- Get all items for this order and decrement stock
    FOR item IN 
      SELECT 
        COALESCE(product_id, (SELECT id FROM products WHERE name = product_name LIMIT 1)) as pid,
        quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      -- Validate positive quantity (max 100 per item for safety)
      IF item.quantity IS NOT NULL AND item.quantity > 0 AND item.quantity <= 100 THEN
        UPDATE products 
        SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
        WHERE id = item.pid;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;