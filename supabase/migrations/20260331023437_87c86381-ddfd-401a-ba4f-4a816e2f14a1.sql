-- Fix 1: Replace overly permissive promotion_uses INSERT policy
DROP POLICY IF EXISTS "System can insert promotion uses" ON public.promotion_uses;

CREATE POLICY "Authenticated users can insert own promotion uses"
ON public.promotion_uses
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()
    ))
    OR
    (subscription_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.subscriptions WHERE id = subscription_id AND user_id = auth.uid()
    ))
  )
);

-- Fix 2: Remove subscriptions from realtime publication (contains sensitive Stripe IDs)
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriptions;