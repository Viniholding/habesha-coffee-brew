-- Add new shipping tracking fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS carrier_code TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.orders.tracking_url IS 'Full URL to carrier tracking page (auto-generated or manual)';
COMMENT ON COLUMN public.orders.shipped_at IS 'Timestamp when order was marked as shipped';
COMMENT ON COLUMN public.orders.carrier_code IS 'Internal carrier code (e.g. ups, usps, fedex)';