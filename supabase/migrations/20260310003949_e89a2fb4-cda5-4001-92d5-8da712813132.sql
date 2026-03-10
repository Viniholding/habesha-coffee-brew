
-- 1. Fix has_role() to check is_active
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

-- 2. Drop suppliers public SELECT policy
DROP POLICY IF EXISTS "Suppliers are viewable by everyone" ON public.suppliers;

-- 3. Drop email templates public read policy
DROP POLICY IF EXISTS "Service role can read templates" ON public.email_templates;

-- 4a. Create SECURITY DEFINER function for admin_audit_log inserts
CREATE OR REPLACE FUNCTION public.insert_admin_audit_log(
  _action_type text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.admin_audit_log (admin_user_id, action_type, entity_type, entity_id, old_values, new_values, metadata)
  VALUES (auth.uid(), _action_type, _entity_type, _entity_id, _old_values, _new_values, _metadata);
END;
$$;

-- 4b. Drop open INSERT on admin_audit_log
DROP POLICY IF EXISTS "System can insert audit logs" ON public.admin_audit_log;

-- 4c. Drop open INSERT on admin_login_attempts (already has log_admin_login_attempt RPC)
DROP POLICY IF EXISTS "System can insert login attempts" ON public.admin_login_attempts;

-- 4d. Create SECURITY DEFINER function for coupon_audit_log inserts
CREATE OR REPLACE FUNCTION public.insert_coupon_audit_log(
  _user_id uuid,
  _coupon_code text,
  _action text,
  _reason_code text DEFAULT NULL,
  _promotion_id uuid DEFAULT NULL,
  _order_id uuid DEFAULT NULL,
  _subscription_id uuid DEFAULT NULL,
  _discount_amount numeric DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.coupon_audit_log (user_id, coupon_code, action, reason_code, promotion_id, order_id, subscription_id, discount_amount, metadata)
  VALUES (_user_id, _coupon_code, _action, _reason_code, _promotion_id, _order_id, _subscription_id, _discount_amount, _metadata);
END;
$$;

-- 4e. Drop open INSERT on coupon_audit_log
DROP POLICY IF EXISTS "System can insert coupon audit logs" ON public.coupon_audit_log;

-- 5. Fix subscription_events INSERT policy - restrict to owned subscriptions
DROP POLICY IF EXISTS "System can insert subscription events" ON public.subscription_events;
CREATE POLICY "Users can insert own subscription events"
  ON public.subscription_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    subscription_id IN (
      SELECT id FROM public.subscriptions WHERE user_id = auth.uid()
    )
  );

-- 6. Create public_products view excluding sensitive columns
CREATE OR REPLACE VIEW public.public_products WITH (security_invoker = false) AS
SELECT id, name, description, price, image_url, category, in_stock, stock_quantity, low_stock_threshold, display_order
FROM public.products;

GRANT SELECT ON public.public_products TO anon, authenticated;

-- Restrict direct products table SELECT to admins only
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Admins can view all products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
