
-- Create a secure promotion validation function that doesn't expose internal fields
CREATE OR REPLACE FUNCTION public.validate_promotion_code(
  _code text,
  _user_id uuid DEFAULT NULL,
  _is_subscription boolean DEFAULT false
)
RETURNS TABLE(
  promotion_id uuid,
  code text,
  discount_type text,
  discount_value numeric,
  min_order_amount numeric,
  is_valid boolean,
  rejection_reason text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promo RECORD;
  user_uses_count integer;
BEGIN
  -- Find the promotion
  SELECT p.* INTO promo
  FROM promotions p
  WHERE p.code = upper(_code)
    AND p.is_active = true
  LIMIT 1;

  IF promo IS NULL THEN
    RETURN QUERY SELECT 
      NULL::uuid, _code, NULL::text, NULL::numeric, NULL::numeric, false, 'invalid_code'::text;
    RETURN;
  END IF;

  -- Check expiration
  IF promo.expires_at IS NOT NULL AND promo.expires_at < now() THEN
    RETURN QUERY SELECT 
      promo.id, promo.code, promo.discount_type, promo.discount_value, promo.min_order_amount, false, 'expired'::text;
    RETURN;
  END IF;

  -- Check not started
  IF promo.starts_at IS NOT NULL AND promo.starts_at > now() THEN
    RETURN QUERY SELECT 
      promo.id, promo.code, promo.discount_type, promo.discount_value, promo.min_order_amount, false, 'not_started'::text;
    RETURN;
  END IF;

  -- Check global usage limit
  IF promo.max_uses IS NOT NULL AND promo.current_uses >= promo.max_uses THEN
    RETURN QUERY SELECT 
      promo.id, promo.code, promo.discount_type, promo.discount_value, promo.min_order_amount, false, 'max_uses_exceeded'::text;
    RETURN;
  END IF;

  -- Check subscription eligibility
  IF _is_subscription AND NOT COALESCE(promo.is_subscription_eligible, false) THEN
    RETURN QUERY SELECT 
      promo.id, promo.code, promo.discount_type, promo.discount_value, promo.min_order_amount, false, 'not_subscription_eligible'::text;
    RETURN;
  END IF;

  -- Check per-user usage limit
  IF _user_id IS NOT NULL AND promo.max_uses_per_user IS NOT NULL THEN
    SELECT COUNT(*) INTO user_uses_count
    FROM promotion_uses pu
    WHERE pu.promotion_id = promo.id
      AND pu.user_id = _user_id;

    IF user_uses_count >= promo.max_uses_per_user THEN
      RETURN QUERY SELECT 
        promo.id, promo.code, promo.discount_type, promo.discount_value, promo.min_order_amount, false, 'already_used'::text;
      RETURN;
    END IF;
  END IF;

  -- Valid!
  RETURN QUERY SELECT 
    promo.id, promo.code, promo.discount_type, promo.discount_value, promo.min_order_amount, true, NULL::text;
END;
$$;
