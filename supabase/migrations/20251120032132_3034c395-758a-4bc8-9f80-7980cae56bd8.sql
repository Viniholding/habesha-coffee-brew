-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS policy: Only admins can insert roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Only admins can delete roles
CREATE POLICY "Admins can delete roles"
  ON public.user_roles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add inventory management columns to products table
ALTER TABLE public.products
ADD COLUMN stock_quantity INTEGER NOT NULL DEFAULT 100,
ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 20,
ADD COLUMN supplier_name TEXT,
ADD COLUMN supplier_email TEXT,
ADD COLUMN cost_price NUMERIC(10,2),
ADD COLUMN sku TEXT UNIQUE;

-- Create index for better performance on stock queries
CREATE INDEX idx_products_stock ON public.products(stock_quantity);

-- RLS policy: Admins can update products
CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Admins can insert products
CREATE POLICY "Admins can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Admins can delete products
CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.orders
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS policy: Admins can update orders
CREATE POLICY "Admins can update orders"
  ON public.orders
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to automatically decrement stock when order is placed
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
      SELECT product_name, quantity 
      FROM order_items 
      WHERE order_id = NEW.id
    LOOP
      UPDATE products 
      SET stock_quantity = stock_quantity - item.quantity
      WHERE name = item.product_name;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for stock management
CREATE TRIGGER update_stock_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_product_stock();