-- Create inventory audit log table
CREATE TABLE public.inventory_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  admin_user_id UUID NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('manual_adjustment', 'bulk_update', 'order_fulfillment', 'stock_correction', 'initial_stock', 'return', 'damaged', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view inventory audit logs"
ON public.inventory_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert inventory audit logs"
ON public.inventory_audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_inventory_audit_log_product_id ON public.inventory_audit_log(product_id);
CREATE INDEX idx_inventory_audit_log_created_at ON public.inventory_audit_log(created_at DESC);
CREATE INDEX idx_inventory_audit_log_change_type ON public.inventory_audit_log(change_type);

-- Add reorder columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS avg_daily_sales NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_sales_calculation TIMESTAMP WITH TIME ZONE;