-- Create promotions/coupons table for admin management
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'subscription', 'one_time')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create promotion usage tracking table
CREATE TABLE public.promotion_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_uses ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotions
CREATE POLICY "Admins can manage promotions" 
ON public.promotions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active promotions by code" 
ON public.promotions 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- RLS policies for promotion_uses
CREATE POLICY "Admins can view all promotion uses" 
ON public.promotion_uses 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own promotion uses" 
ON public.promotion_uses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert promotion uses" 
ON public.promotion_uses 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_promotions_code ON public.promotions(code);
CREATE INDEX idx_promotions_active ON public.promotions(is_active, expires_at);
CREATE INDEX idx_promotion_uses_promotion_id ON public.promotion_uses(promotion_id);
CREATE INDEX idx_promotion_uses_user_id ON public.promotion_uses(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_promotions_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();