-- Create analytics_events table for event tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_segments table
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create segment_members table (computed/cached membership)
CREATE TABLE public.segment_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id UUID NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(segment_id, user_id)
);

-- Create abandoned_carts table
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  email TEXT,
  cart_value NUMERIC DEFAULT 0,
  items JSONB DEFAULT '[]',
  last_step TEXT DEFAULT 'cart_viewed',
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  recovered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segment_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Analytics events policies - system can insert, admins can read
CREATE POLICY "System can insert analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view analytics events"
ON public.analytics_events FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Customer segments policies - admins only
CREATE POLICY "Admins can manage segments"
ON public.customer_segments FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Segment members policies - admins only
CREATE POLICY "Admins can manage segment members"
ON public.segment_members FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Abandoned carts policies
CREATE POLICY "System can insert abandoned carts"
ON public.abandoned_carts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own abandoned carts"
ON public.abandoned_carts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage abandoned carts"
ON public.abandoned_carts FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add index for analytics queries
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX idx_abandoned_carts_session ON public.abandoned_carts(session_id);
CREATE INDEX idx_abandoned_carts_last_activity ON public.abandoned_carts(last_activity_at);

-- Add trigger for updated_at on customer_segments
CREATE TRIGGER update_customer_segments_updated_at
BEFORE UPDATE ON public.customer_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();