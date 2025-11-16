-- Add carrier field to orders table
ALTER TABLE orders 
ADD COLUMN carrier text;

COMMENT ON COLUMN orders.carrier IS 'Shipping carrier (e.g., USPS, FedEx, UPS, DHL, etc.)';