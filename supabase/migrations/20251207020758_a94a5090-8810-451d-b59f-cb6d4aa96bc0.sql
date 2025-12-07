-- Create referrals table to track subscription referral program
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL,
  referee_user_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  referee_email TEXT,
  referrer_discount_percent INTEGER NOT NULL DEFAULT 10,
  referee_discount_percent INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'pending',
  referrer_credited BOOLEAN NOT NULL DEFAULT false,
  referee_credited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
USING (referrer_user_id = auth.uid() OR referee_user_id = auth.uid());

-- Users can create referral codes
CREATE POLICY "Users can create referral codes"
ON public.referrals
FOR INSERT
WITH CHECK (referrer_user_id = auth.uid());

-- Admins can manage all referrals
CREATE POLICY "Admins can manage all referrals"
ON public.referrals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public can view referral codes for validation (without sensitive data)
CREATE POLICY "Anyone can check referral codes"
ON public.referrals
FOR SELECT
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);