-- Create stock notifications table
CREATE TABLE public.stock_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create stock notifications
CREATE POLICY "Anyone can create stock notifications"
ON public.stock_notifications
FOR INSERT
WITH CHECK (true);

-- Users can view their own notifications
CREATE POLICY "Users can view their own stock notifications"
ON public.stock_notifications
FOR SELECT
USING (auth.uid() = user_id OR (user_id IS NULL AND email IS NOT NULL));

-- Admins can manage all notifications
CREATE POLICY "Admins can manage stock notifications"
ON public.stock_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the Hand Coffee Grinder product
INSERT INTO public.products (name, description, price, image_url, category, in_stock, stock_quantity, low_stock_threshold)
VALUES (
  'Hand Coffee Grinder',
  'Premium manual coffee grinder with stainless steel conical burrs. Adjustable grind settings for espresso to French press. Walnut wood handle for comfortable grinding.',
  89.99,
  '/src/assets/hand-grinder-1.png',
  'accessories',
  true,
  25,
  5
);