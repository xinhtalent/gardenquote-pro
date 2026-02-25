-- Function to auto-transfer quotes when customer is reassigned
CREATE OR REPLACE FUNCTION public.transfer_quotes_on_customer_reassign()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if user_id actually changed
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    -- Transfer all quotes of this customer to the new agent
    UPDATE public.quotes
    SET user_id = NEW.user_id
    WHERE customer_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-transfer quotes when customer is reassigned
CREATE TRIGGER on_customer_reassign
  AFTER UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.transfer_quotes_on_customer_reassign();