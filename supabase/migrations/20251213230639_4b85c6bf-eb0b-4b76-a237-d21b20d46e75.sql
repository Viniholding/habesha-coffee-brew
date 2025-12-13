-- 1. Create admin_login_attempts table for rate limiting
CREATE TABLE public.admin_login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view login attempts"
ON public.admin_login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert login attempts
CREATE POLICY "System can insert login attempts"
ON public.admin_login_attempts
FOR INSERT
WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX idx_admin_login_attempts_email_time ON public.admin_login_attempts (email, attempted_at DESC);

-- 2. Add last_login_at to user_roles for admin users
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Create function to check rate limiting
CREATE OR REPLACE FUNCTION public.check_admin_login_rate_limit(_email TEXT)
RETURNS TABLE(is_blocked BOOLEAN, attempts_count INTEGER, block_until TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  failed_attempts INTEGER;
  last_failed_attempt TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*), MAX(attempted_at)
  INTO failed_attempts, last_failed_attempt
  FROM admin_login_attempts
  WHERE email = _email
    AND success = false
    AND attempted_at > now() - interval '15 minutes';
  
  -- Block if 5+ failed attempts
  IF failed_attempts >= 5 THEN
    RETURN QUERY SELECT 
      true AS is_blocked,
      failed_attempts AS attempts_count,
      last_failed_attempt + interval '15 minutes' AS block_until;
  ELSE
    RETURN QUERY SELECT 
      false AS is_blocked,
      failed_attempts AS attempts_count,
      NULL::TIMESTAMP WITH TIME ZONE AS block_until;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_admin_login_rate_limit TO anon, authenticated;

-- 4. Create function to log admin login attempt
CREATE OR REPLACE FUNCTION public.log_admin_login_attempt(_email TEXT, _success BOOLEAN, _ip_address TEXT DEFAULT NULL, _user_agent TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_login_attempts (email, success, ip_address, user_agent)
  VALUES (_email, _success, _ip_address, _user_agent);
  
  -- Update last_login_at on successful login
  IF _success THEN
    UPDATE user_roles
    SET last_login_at = now()
    WHERE user_id = (SELECT id FROM auth.users WHERE email = _email LIMIT 1)
      AND role = 'admin';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_admin_login_attempt TO anon, authenticated;

-- 5. Add RLS policy for admins to view all subscriptions (for admin panel)
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Add RLS policy for admins to update all subscriptions
CREATE POLICY "Admins can update all subscriptions"
ON public.subscriptions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Allow admins to view all profiles (for customer management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. Allow admins to view all user roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. Allow admins to update user roles
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));