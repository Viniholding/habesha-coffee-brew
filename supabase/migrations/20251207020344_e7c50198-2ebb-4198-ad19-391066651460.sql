-- Create subscription_addons table for one-time add-on items to next shipment
CREATE TABLE public.subscription_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.subscription_addons ENABLE ROW LEVEL SECURITY;

-- Users can view their own add-ons
CREATE POLICY "Users can view their own subscription addons"
ON public.subscription_addons
FOR SELECT
USING (
  subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
  )
);

-- Users can create add-ons for their subscriptions
CREATE POLICY "Users can create subscription addons"
ON public.subscription_addons
FOR INSERT
WITH CHECK (
  subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
  )
);

-- Users can delete pending add-ons
CREATE POLICY "Users can delete pending addons"
ON public.subscription_addons
FOR DELETE
USING (
  status = 'pending' AND
  subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
  )
);

-- Admins can manage all add-ons
CREATE POLICY "Admins can manage all addons"
ON public.subscription_addons
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));