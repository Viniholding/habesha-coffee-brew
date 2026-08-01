-- 1. Owner-only management of user_roles
CREATE OR REPLACE FUNCTION public.is_owner_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
      AND is_active = true
      AND admin_level = 'owner'
  )
$$;

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Owners can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_owner_admin(auth.uid()));

CREATE POLICY "Owners can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_owner_admin(auth.uid()))
  WITH CHECK (public.is_owner_admin(auth.uid()));

CREATE POLICY "Owners can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_owner_admin(auth.uid()));

-- 2. Prevent forged user attribution on analytics/abandoned carts
DROP POLICY IF EXISTS "System can insert analytics events" ON public.analytics_events;
CREATE POLICY "Clients can insert own analytics events" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND (user_id IS NOT NULL OR session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "System can insert abandoned carts" ON public.abandoned_carts;
CREATE POLICY "Clients can insert own abandoned carts" ON public.abandoned_carts
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND (user_id IS NOT NULL OR session_id IS NOT NULL)
  );

-- 3. Stock notification emails only visible to their owner (or admins)
DROP POLICY IF EXISTS "Users can view their own stock notifications" ON public.stock_notifications;
CREATE POLICY "Users can view their own stock notifications" ON public.stock_notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. Hide cost/supplier/operational columns on products from the public API
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (
  id, name, description, price, image_url, category, in_stock,
  stock_quantity, low_stock_threshold, display_order, created_at, updated_at
) ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

CREATE OR REPLACE VIEW public.admin_products
WITH (security_invoker = false) AS
  SELECT p.* FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin'::app_role);

REVOKE ALL ON public.admin_products FROM anon;
GRANT SELECT ON public.admin_products TO authenticated;
GRANT ALL ON public.admin_products TO service_role;

-- 5. Restrict bucket listing (public object URLs continue to work)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list their own avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can list product images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 6. Lock down SECURITY DEFINER functions that should not be publicly callable
REVOKE ALL ON FUNCTION public.is_owner_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner_admin(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.decrement_product_stock() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_customer_stats() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_level(uuid) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.generate_po_number() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.generate_po_number() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.insert_admin_audit_log(text, text, text, jsonb, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.insert_admin_audit_log(text, text, text, jsonb, jsonb, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.insert_coupon_audit_log(uuid, text, text, text, uuid, uuid, uuid, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.insert_coupon_audit_log(uuid, text, text, text, uuid, uuid, uuid, numeric, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.request_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.confirm_account_deletion(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_account_deletion(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.confirm_account_deletion(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_account_deletion(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancel_account_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_scheduled_deletion() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_scheduled_deletion() TO authenticated, service_role;