-- Add confirmed_at column to quotes table to track payment confirmation time
ALTER TABLE public.quotes
ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create function to auto-expire pending quotes after 30 days
CREATE OR REPLACE FUNCTION public.auto_expire_pending_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.quotes
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND date < (CURRENT_DATE - INTERVAL '30 days')
    AND confirmed_at IS NULL;
END;
$$;