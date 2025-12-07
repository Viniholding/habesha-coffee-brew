-- Create subscription programs table for admin-defined programs
CREATE TABLE public.subscription_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription events log table
CREATE TABLE public.subscription_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- created, paused, resumed, skipped, updated, cancelled, payment_failed, payment_success
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Add new columns to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS grind TEXT DEFAULT 'whole_bean',
ADD COLUMN IF NOT EXISTS bag_size TEXT DEFAULT '12oz',
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES public.subscription_programs(id),
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gift_recipient_email TEXT,
ADD COLUMN IF NOT EXISTS gift_recipient_name TEXT,
ADD COLUMN IF NOT EXISTS gift_message TEXT,
ADD COLUMN IF NOT EXISTS gift_end_date DATE,
ADD COLUMN IF NOT EXISTS is_prepaid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prepaid_months INTEGER,
ADD COLUMN IF NOT EXISTS prepaid_end_date DATE,
ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_order_id UUID,
ADD COLUMN IF NOT EXISTS shipping_address_id UUID REFERENCES public.addresses(id),
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id);

-- Enable RLS on new tables
ALTER TABLE public.subscription_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_programs (public read, admin write)
CREATE POLICY "Programs are viewable by everyone"
ON public.subscription_programs
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage programs"
ON public.subscription_programs
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS policies for subscription_events
CREATE POLICY "Users can view their own subscription events"
ON public.subscription_events
FOR SELECT
USING (
  subscription_id IN (
    SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all subscription events"
ON public.subscription_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert subscription events"
ON public.subscription_events
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at on subscription_programs
CREATE TRIGGER update_subscription_programs_updated_at
BEFORE UPDATE ON public.subscription_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription programs
INSERT INTO public.subscription_programs (name, description, sort_order) VALUES
('Roaster''s Choice', 'Our roasters select the best single origins each month. Perfect for adventurous coffee lovers.', 1),
('Espresso Lovers', 'Rich, bold espresso blends crafted for the perfect shot every time.', 2),
('Best Sellers', 'Our most popular coffees, delivered to your door.', 3),
('Seasonal Collection', 'Limited edition coffees that celebrate each season''s finest harvests.', 4),
('Build Your Own', 'Create your perfect subscription with any coffee you choose.', 5);