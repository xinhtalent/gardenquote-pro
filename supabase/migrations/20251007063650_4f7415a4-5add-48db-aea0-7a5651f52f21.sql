-- Create function to auto-restore cancelled quotes when date is updated to valid range
CREATE OR REPLACE FUNCTION public.auto_restore_cancelled_quotes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If status is 'cancelled' and date is being updated to within 30 days from today
  -- and confirmed_at is NULL, then restore to 'pending' status
  IF NEW.status = 'cancelled' 
    AND NEW.date >= CURRENT_DATE 
    AND NEW.date <= (CURRENT_DATE + INTERVAL '30 days')
    AND NEW.confirmed_at IS NULL 
    AND (OLD.date IS DISTINCT FROM NEW.date OR OLD.status IS DISTINCT FROM NEW.status)
  THEN
    NEW.status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run before update on quotes table
DROP TRIGGER IF EXISTS restore_cancelled_quotes_trigger ON public.quotes;
CREATE TRIGGER restore_cancelled_quotes_trigger
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_restore_cancelled_quotes();