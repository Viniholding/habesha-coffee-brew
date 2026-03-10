-- Fix: tighten stock_notifications INSERT policy to require valid product_id and email
DROP POLICY IF EXISTS "Anyone can create stock notifications" ON public.stock_notifications;
CREATE POLICY "Anyone can create stock notifications"
  ON public.stock_notifications
  FOR INSERT
  TO public
  WITH CHECK (
    product_id IS NOT NULL 
    AND email IS NOT NULL 
    AND length(email) > 0
    AND length(email) <= 320
  );