-- Add new admin roles (keep existing 'admin' and 'user', add 'owner', 'manager', 'support')
-- Note: We'll use a text field for more flexibility instead of enum

-- Create collections table for merchandising
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  show_on_homepage BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_products junction table
CREATE TABLE public.collection_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, product_id)
);

-- Create homepage_settings table for hero and featured content
CREATE TABLE public.homepage_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  hero_button_text TEXT,
  hero_button_link TEXT,
  featured_collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Add VIP and admin role fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS lifetime_value NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_orders INTEGER NOT NULL DEFAULT 0;

-- Add admin_level to user_roles for granular permissions
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS admin_level TEXT CHECK (admin_level IN ('owner', 'manager', 'support'));

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Collections are viewable by everyone"
ON public.collections FOR SELECT
USING (true);

CREATE POLICY "Admins can manage collections"
ON public.collections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Collection products policies
CREATE POLICY "Collection products are viewable by everyone"
ON public.collection_products FOR SELECT
USING (true);

CREATE POLICY "Admins can manage collection products"
ON public.collection_products FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Homepage settings policies
CREATE POLICY "Homepage settings are viewable by everyone"
ON public.homepage_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage homepage settings"
ON public.homepage_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to check admin level
CREATE OR REPLACE FUNCTION public.get_admin_level(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT admin_level
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = 'admin'::app_role
  LIMIT 1
$$;

-- Create function to calculate and update VIP status
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  customer_ltv NUMERIC;
  customer_orders INTEGER;
  is_now_vip BOOLEAN;
BEGIN
  -- Calculate LTV and order count for the customer
  SELECT 
    COALESCE(SUM(total), 0),
    COUNT(*)
  INTO customer_ltv, customer_orders
  FROM public.orders
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);
  
  -- Determine VIP status (LTV >= 300 OR 5+ orders)
  is_now_vip := (customer_ltv >= 300 OR customer_orders >= 5);
  
  -- Update profile
  UPDATE public.profiles
  SET 
    lifetime_value = customer_ltv,
    total_orders = customer_orders,
    is_vip = is_now_vip
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to update customer stats when orders change
CREATE TRIGGER update_customer_stats_on_order
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_stats();

-- Insert default homepage settings
INSERT INTO public.homepage_settings (id, hero_title, hero_subtitle, hero_button_text, hero_button_link)
VALUES (
  gen_random_uuid(),
  'Experience the Birthplace of Coffee',
  'Premium single-origin Ethiopian coffee, ethically sourced and freshly roasted',
  'Shop Now',
  '/products'
);