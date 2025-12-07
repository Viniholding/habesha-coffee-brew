-- Add default_product_id to subscription_programs to link programs to specific products
ALTER TABLE public.subscription_programs 
ADD COLUMN default_product_id uuid REFERENCES public.products(id);

-- Update the programs with their default products based on best matches
UPDATE public.subscription_programs 
SET default_product_id = (SELECT id FROM public.products WHERE name = 'Ethiopian Yirgacheffe' LIMIT 1)
WHERE name = 'Roaster''s Choice';

UPDATE public.subscription_programs 
SET default_product_id = (SELECT id FROM public.products WHERE name = 'Sidamo Dark Roast' LIMIT 1)
WHERE name = 'Espresso Lovers';

UPDATE public.subscription_programs 
SET default_product_id = (SELECT id FROM public.products WHERE name = 'Harar Heritage Blend' LIMIT 1)
WHERE name = 'Best Sellers';

UPDATE public.subscription_programs 
SET default_product_id = (SELECT id FROM public.products WHERE name = 'Limu Organic' LIMIT 1)
WHERE name = 'Seasonal Collection';