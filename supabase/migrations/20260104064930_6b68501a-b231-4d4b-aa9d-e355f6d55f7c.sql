-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  contact_person TEXT,
  lead_time_days INTEGER DEFAULT 7,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage suppliers"
  ON public.suppliers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Suppliers are viewable by everyone"
  ON public.suppliers
  FOR SELECT
  USING (true);

-- Add display_order to products for shop page ordering
ALTER TABLE public.products ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add supplier_id to products (optional reference)
ALTER TABLE public.products ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Create index for display ordering
CREATE INDEX idx_products_display_order ON public.products(display_order);

-- Create trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();