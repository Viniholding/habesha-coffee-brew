-- =========================================================
-- 1. Durable, database-backed rate limiting
-- =========================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rate_limit_counters_unique_window UNIQUE (bucket_key, window_start)
);

-- Backend-only table: no anon/authenticated grants at all.
GRANT ALL ON public.rate_limit_counters TO service_role;

ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limit counters"
  ON public.rate_limit_counters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS rate_limit_counters_expires_at_idx
  ON public.rate_limit_counters (expires_at);

CREATE TRIGGER update_rate_limit_counters_updated_at
  BEFORE UPDATE ON public.rate_limit_counters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic check-and-consume. Returns whether the request is allowed.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _bucket_key text,
  _max_requests integer,
  _window_seconds integer
)
RETURNS TABLE(allowed boolean, remaining integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  win_start timestamptz;
  win_end timestamptz;
  new_count integer;
BEGIN
  IF _bucket_key IS NULL OR length(_bucket_key) = 0 OR length(_bucket_key) > 300 THEN
    RAISE EXCEPTION 'Invalid rate limit bucket key';
  END IF;
  IF _max_requests IS NULL OR _max_requests < 1 OR _window_seconds IS NULL OR _window_seconds < 1 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration';
  END IF;

  -- Fixed window aligned to the window size
  win_start := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);
  win_end := win_start + make_interval(secs => _window_seconds);

  INSERT INTO public.rate_limit_counters (bucket_key, window_start, request_count, expires_at)
  VALUES (_bucket_key, win_start, 1, win_end)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET request_count = public.rate_limit_counters.request_count + 1,
                updated_at = now()
  RETURNING request_count INTO new_count;

  -- Opportunistic cleanup of expired rows
  IF random() < 0.02 THEN
    DELETE FROM public.rate_limit_counters WHERE expires_at < now() - interval '1 hour';
  END IF;

  RETURN QUERY SELECT (new_count <= _max_requests),
                      GREATEST(0, _max_requests - new_count),
                      win_end;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;

-- =========================================================
-- 2. Extend admin_audit_log to cover user + system actions
-- =========================================================
ALTER TABLE public.admin_audit_log
  ALTER COLUMN admin_user_id DROP NOT NULL;

ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS actor_type text NOT NULL DEFAULT 'admin';

ALTER TABLE public.admin_audit_log
  ADD CONSTRAINT admin_audit_log_actor_type_check
  CHECK (actor_type IN ('admin', 'user', 'system'));

CREATE INDEX IF NOT EXISTS admin_audit_log_actor_type_created_idx
  ON public.admin_audit_log (actor_type, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_audit_log_entity_idx
  ON public.admin_audit_log (entity_type, entity_id);

-- Backend-side audit writer for edge functions (service role only).
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _actor_type text,
  _actor_user_id uuid,
  _action_type text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL,
  _metadata jsonb DEFAULT NULL,
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF _actor_type NOT IN ('admin', 'user', 'system') THEN
    RAISE EXCEPTION 'Invalid actor_type';
  END IF;
  IF _action_type IS NULL OR length(trim(_action_type)) = 0 OR length(_action_type) > 100 THEN
    RAISE EXCEPTION 'Invalid action_type';
  END IF;

  INSERT INTO public.admin_audit_log (
    admin_user_id, actor_type, action_type, entity_type, entity_id,
    old_values, new_values, metadata, ip_address, user_agent
  )
  VALUES (
    _actor_user_id, _actor_type, _action_type, _entity_type, left(_entity_id, 200),
    _old_values, _new_values, _metadata, left(_ip_address, 100), left(_user_agent, 300)
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(text, uuid, text, text, text, jsonb, jsonb, jsonb, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, uuid, text, text, text, jsonb, jsonb, jsonb, text, text) TO service_role;

-- Signed-in users may record their own sensitive actions (orders, subscriptions,
-- stock notification signups) but can never forge the actor identity.
CREATE OR REPLACE FUNCTION public.log_user_action(
  _action_type text,
  _entity_type text DEFAULT NULL,
  _entity_id text DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _action_type IS NULL OR length(trim(_action_type)) = 0 OR length(_action_type) > 100 THEN
    RAISE EXCEPTION 'Invalid action_type';
  END IF;

  INSERT INTO public.admin_audit_log (
    admin_user_id, actor_type, action_type, entity_type, entity_id, metadata
  )
  VALUES (
    auth.uid(), 'user', _action_type, _entity_type, left(_entity_id, 200), _metadata
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_user_action(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_user_action(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_action(text, text, text, jsonb) TO service_role;