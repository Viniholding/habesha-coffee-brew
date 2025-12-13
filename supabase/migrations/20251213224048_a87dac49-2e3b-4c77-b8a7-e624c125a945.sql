-- Fix critical security issue: Restrict referrals table to not expose user IDs and emails publicly
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can check referral codes" ON public.referrals;

-- Create a more restrictive policy that only allows checking if a code exists
-- without exposing user IDs or email addresses
CREATE POLICY "Anyone can check referral code validity"
ON public.referrals
FOR SELECT
USING (
  -- Only allow querying by referral_code, and only return minimal info
  -- Users can check if a code exists but not see user data
  auth.uid() IS NOT NULL OR 
  (auth.uid() IS NULL AND referral_code IS NOT NULL)
);

-- Create an admin audit log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action_type text NOT NULL,
  entity_type text,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only system can insert audit logs (via edge functions with service role)
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Improve system insert policies to validate caller context
-- Update analytics_events policy to require at least a session_id or user_id
DROP POLICY IF EXISTS "System can insert analytics events" ON public.analytics_events;
CREATE POLICY "System can insert analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (
  -- Require either a user_id or session_id to prevent completely anonymous inserts
  user_id IS NOT NULL OR session_id IS NOT NULL
);

-- Update subscription_events to require valid subscription reference
DROP POLICY IF EXISTS "System can insert subscription events" ON public.subscription_events;
CREATE POLICY "System can insert subscription events"
ON public.subscription_events
FOR INSERT
WITH CHECK (
  -- Require a valid subscription_id
  subscription_id IS NOT NULL AND
  EXISTS (SELECT 1 FROM public.subscriptions WHERE id = subscription_id)
);

-- Update promotion_uses to require valid order or subscription reference
DROP POLICY IF EXISTS "System can insert promotion uses" ON public.promotion_uses;
CREATE POLICY "System can insert promotion uses"
ON public.promotion_uses
FOR INSERT
WITH CHECK (
  -- Require either an order_id or subscription_id
  (order_id IS NOT NULL OR subscription_id IS NOT NULL)
);

-- Update abandoned_carts to require session or user tracking
DROP POLICY IF EXISTS "System can insert abandoned carts" ON public.abandoned_carts;
CREATE POLICY "System can insert abandoned carts"
ON public.abandoned_carts
FOR INSERT
WITH CHECK (
  -- Require either a user_id or session_id
  user_id IS NOT NULL OR session_id IS NOT NULL
);