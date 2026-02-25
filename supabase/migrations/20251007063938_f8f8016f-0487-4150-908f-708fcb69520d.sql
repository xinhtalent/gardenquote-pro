-- Fix the auto-restore logic to match the auto-expire logic
-- A quote should be 'pending' if created within last 30 days from quote date
-- A quote should be 'cancelled' if created more than 30 days ago from quote date

DROP FUNCTION IF EXISTS public.auto_restore_cancelled_quotes() CASCADE;

CREATE OR REPLACE FUNCTION public.auto_restore_cancelled_quotes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If status is 'cancelled' and date is being updated to be within valid range (>= 30 days ago from today)
  -- and confirmed_at is NULL, then restore to 'pending' status
  IF NEW.status = 'cancelled' 
    AND NEW.date >= (CURRENT_DATE - INTERVAL '30 days')
    AND NEW.confirmed_at IS NULL 
    AND (OLD.date IS DISTINCT FROM NEW.date)
  THEN
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER restore_cancelled_quotes_trigger
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_restore_cancelled_quotes();