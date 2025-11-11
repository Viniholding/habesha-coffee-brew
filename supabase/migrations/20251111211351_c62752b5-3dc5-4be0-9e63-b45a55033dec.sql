-- ─────────────────────────────────────────────────────────────────────────────
-- Your existing hard-delete function (unchanged)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.cart_items WHERE user_id = current_user_id;
  DELETE FROM public.order_issues WHERE user_id = current_user_id;
  DELETE FROM public.order_items WHERE order_id IN (
    SELECT id FROM public.orders WHERE user_id = current_user_id
  );
  DELETE FROM public.orders WHERE user_id = current_user_id;
  DELETE FROM public.subscriptions WHERE user_id = current_user_id;
  DELETE FROM public.addresses WHERE user_id = current_user_id;
  DELETE FROM public.payment_methods WHERE user_id = current_user_id;
  DELETE FROM public.notification_preferences WHERE user_id = current_user_id;
  DELETE FROM public.delivery_preferences WHERE user_id = current_user_id;
  DELETE FROM public.profiles WHERE id = current_user_id;
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Backing table for the two-step confirmation flow (unchanged if you already added it)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token        uuid NOT NULL UNIQUE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','expired','cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  completed_at timestamptz
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='account_deletion_requests' AND policyname='owner_can_view'
  ) THEN
    CREATE POLICY owner_can_view ON public.account_deletion_requests
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_delreq_user_status
  ON public.account_deletion_requests(user_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: request token when user opens the Delete Account sub-tab
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  tkn uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.account_deletion_requests
     SET status = 'expired'
   WHERE user_id = uid
     AND status = 'pending';

  tkn := gen_random_uuid();

  INSERT INTO public.account_deletion_requests(user_id, token, expires_at)
  VALUES (uid, tkn, now() + interval '30 minutes');

  RETURN tkn;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: confirm; now requires the user to:
--   • type the exact word DELETE
--   • have re-authenticated (password) in the last X minutes (default 10)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirm_account_deletion(
  _token uuid,
  _confirmation_text text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  req record;
  last_login timestamptz;
  require_recent_login interval := interval '10 minutes'; -- adjust as needed
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Require the destructive phrase
  IF _confirmation_text IS DISTINCT FROM 'DELETE' THEN
    RAISE EXCEPTION 'Confirmation text must be exactly "DELETE"';
  END IF;

  -- Validate token ownership & status
  SELECT *
    INTO req
    FROM public.account_deletion_requests
   WHERE token = _token
     AND user_id = uid
   LIMIT 1;

  IF req IS NULL THEN
    RAISE EXCEPTION 'Invalid or unauthorized deletion token';
  END IF;

  IF req.status <> 'pending' THEN
    RAISE EXCEPTION 'Deletion request is not pending';
  END IF;

  IF now() > req.expires_at THEN
    UPDATE public.account_deletion_requests
       SET status = 'expired'
     WHERE id = req.id;
    RAISE EXCEPTION 'Deletion token has expired';
  END IF;

  -- Enforce recent password confirmation via recent sign-in timestamp
  SELECT u.last_sign_in_at
    INTO last_login
    FROM auth.users u
   WHERE u.id = uid;

  IF last_login IS NULL OR now() - last_login > require_recent_login THEN
    RAISE EXCEPTION 'Recent password confirmation required. Please sign in again and retry.';
  END IF;

  -- Perform the hard delete
  PERFORM public.delete_user();

  -- Best-effort: mark request completed
  UPDATE public.account_deletion_requests
     SET status = 'completed',
         completed_at = now()
   WHERE id = req.id;
END;
$$;

