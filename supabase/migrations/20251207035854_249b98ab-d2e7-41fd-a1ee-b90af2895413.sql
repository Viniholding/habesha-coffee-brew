-- Add email_shipping_updates column to notification_preferences
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS email_shipping_updates boolean NOT NULL DEFAULT true;