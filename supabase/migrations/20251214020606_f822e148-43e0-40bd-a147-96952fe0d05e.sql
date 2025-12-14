-- Create coupon audit log table for tracking applications and rejections
CREATE TABLE public.coupon_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  promotion_id UUID REFERENCES public.promotions(id),
  coupon_code TEXT NOT NULL,
  action TEXT NOT NULL, -- 'applied', 'rejected'
  reason_code TEXT, -- 'success', 'invalid_code', 'expired', 'max_uses_exceeded', 'not_subscription_eligible', 'already_used', 'account_restricted'
  order_id UUID REFERENCES public.orders(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  discount_amount NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create account restrictions table for promotional access control
CREATE TABLE public.account_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_promotional_restricted BOOLEAN NOT NULL DEFAULT false,
  restriction_reason TEXT,
  restricted_at TIMESTAMP WITH TIME ZONE,
  restricted_by UUID, -- admin who applied restriction, null if automatic
  abuse_score INTEGER NOT NULL DEFAULT 0,
  early_cancellations INTEGER NOT NULL DEFAULT 0,
  discount_reversals INTEGER NOT NULL DEFAULT 0,
  coupon_rejections INTEGER NOT NULL DEFAULT 0,
  pause_cycles INTEGER NOT NULL DEFAULT 0,
  last_abuse_check_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupon_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS policies for coupon_audit_log
CREATE POLICY "Admins can view all coupon audit logs"
  ON public.coupon_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert coupon audit logs"
  ON public.coupon_audit_log FOR INSERT
  WITH CHECK (true);

-- RLS policies for account_restrictions
CREATE POLICY "Admins can manage account restrictions"
  ON public.account_restrictions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own restrictions"
  ON public.account_restrictions FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_coupon_audit_log_user_id ON public.coupon_audit_log(user_id);
CREATE INDEX idx_coupon_audit_log_created_at ON public.coupon_audit_log(created_at);
CREATE INDEX idx_coupon_audit_log_action ON public.coupon_audit_log(action);
CREATE INDEX idx_account_restrictions_user_id ON public.account_restrictions(user_id);
CREATE INDEX idx_account_restrictions_abuse_score ON public.account_restrictions(abuse_score DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_account_restrictions_updated_at
  BEFORE UPDATE ON public.account_restrictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();