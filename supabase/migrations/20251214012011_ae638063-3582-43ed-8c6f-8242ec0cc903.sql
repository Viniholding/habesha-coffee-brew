-- Add subscription discount tracking fields for reversal protection
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS original_price numeric,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS deliveries_completed integer DEFAULT 0;

-- Add subscription link to orders for tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id);

-- Add subscription eligibility flag to promotions for coupon restrictions
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS is_subscription_eligible boolean DEFAULT false;

-- Create index for faster subscription order lookups
CREATE INDEX IF NOT EXISTS idx_orders_subscription_id ON public.orders(subscription_id);

-- Update RLS policy for orders to allow subscription_id updates
-- (Existing policies already allow admin updates)