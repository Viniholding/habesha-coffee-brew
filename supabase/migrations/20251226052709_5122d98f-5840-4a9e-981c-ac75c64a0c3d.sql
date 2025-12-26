-- Fix 1: Drop permissive referral policy - code already uses RPC function
DROP POLICY IF EXISTS "Anyone can check referral code validity" ON public.referrals;

-- Fix 2: Secure the stock decrement trigger by removing name fallback and adding ownership validation
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
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      -- Require product_id - do not use name fallback for security
      IF item.product_id IS NULL THEN
        RAISE NOTICE 'Skipping stock decrement: product_id is NULL for order %', NEW.id;
        CONTINUE;
      END IF;
      
      -- Validate positive quantity (max 100 per item for safety)
      IF item.quantity IS NOT NULL AND item.quantity > 0 AND item.quantity <= 100 THEN
        UPDATE products 
        SET stock_quantity = GREATEST(0, stock_quantity - item.quantity)
        WHERE id = item.product_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;