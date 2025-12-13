-- Create email_templates table for admin customization
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_template TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can manage email templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active templates (for edge functions)
CREATE POLICY "Service role can read templates"
ON public.email_templates
FOR SELECT
USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (template_key, subject, html_template, description) VALUES
(
  'payment_failed',
  'Payment Failed - Action Required',
  '<h1>Payment Failed</h1>
<p>Hi {{firstName}},</p>
<p>We were unable to process your payment for your <strong>{{productName}}</strong> subscription.</p>
<p>This was attempt {{attemptCount}}. Please update your payment method to continue receiving your coffee deliveries.</p>
<p><a href="{{accountUrl}}" style="display: inline-block; background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Update Payment Method</a></p>
<p>If you have any questions, please contact our support team.</p>',
  'Sent when a subscription payment fails'
),
(
  'subscription_auto_paused',
  'Your Subscription Has Been Paused',
  '<h1>Subscription Paused</h1>
<p>Hi {{firstName}},</p>
<p>Due to multiple failed payment attempts, your <strong>{{productName}}</strong> subscription has been automatically paused.</p>
<p>To resume your subscription and continue receiving your coffee deliveries, please update your payment method.</p>
<p><a href="{{accountUrl}}" style="display: inline-block; background-color: #8B4513; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Update Payment Method</a></p>
<p>If you have any questions, please contact our support team.</p>',
  'Sent when subscription is auto-paused after 3 failed payments'
),
(
  'subscription_paused',
  'Your Subscription Has Been Paused',
  '<h1>Subscription Paused</h1>
<p>Hi {{firstName}},</p>
<p>Your {{productName}} subscription has been paused. You won''t be charged until you resume it.</p>
<p>Ready to resume? <a href="{{accountUrl}}">Visit your account</a></p>',
  'Sent when user manually pauses subscription'
),
(
  'renewal_reminder',
  'Your Coffee Delivery is Coming Up!',
  '<h1>Delivery Reminder</h1>
<p>Hi {{firstName}},</p>
<p>Your next {{productName}} delivery is scheduled for <strong>{{deliveryDate}}</strong>.</p>
<h3>Order Details:</h3>
<ul>
  <li><strong>Product:</strong> {{productName}}</li>
  <li><strong>Quantity:</strong> {{quantity}}</li>
  <li><strong>Amount:</strong> ${{amount}}</li>
</ul>
<p>Want to make changes? <a href="{{accountUrl}}">Manage your subscription</a></p>
<p>Need to skip this delivery? You can do that from your account page.</p>',
  'Sent 3 days before subscription renewal'
);

-- Create site_settings table for general configuration
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Public can read settings
CREATE POLICY "Settings are readable"
ON public.site_settings
FOR SELECT
USING (true);

-- Enable realtime for subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;