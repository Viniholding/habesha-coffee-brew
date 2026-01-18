-- Create receiving log table for audit tracking
CREATE TABLE public.purchase_order_receiving_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity_received INTEGER NOT NULL,
  received_by UUID NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_order_receiving_log ENABLE ROW LEVEL SECURITY;

-- Create policies - admins only
CREATE POLICY "Admins can view receiving log"
  ON public.purchase_order_receiving_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can insert receiving log"
  ON public.purchase_order_receiving_log
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX idx_receiving_log_po_id ON public.purchase_order_receiving_log(purchase_order_id);
CREATE INDEX idx_receiving_log_received_at ON public.purchase_order_receiving_log(received_at);
CREATE INDEX idx_receiving_log_received_by ON public.purchase_order_receiving_log(received_by);