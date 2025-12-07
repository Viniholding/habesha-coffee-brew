-- Add resume_at column for pause scheduling
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS resume_at timestamp with time zone;

-- Create index for efficient querying of subscriptions to resume
CREATE INDEX IF NOT EXISTS idx_subscriptions_resume_at ON public.subscriptions(resume_at) WHERE resume_at IS NOT NULL AND status = 'paused';