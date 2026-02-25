-- Add SKU column to items table for duplicate checking
ALTER TABLE public.items 
ADD COLUMN sku text UNIQUE;

-- Create function to generate unique SKU
CREATE OR REPLACE FUNCTION public.generate_item_sku()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_sku text;
  sku_exists boolean;
BEGIN
  LOOP
    -- Generate SKU in format: ITEM-YYYYMMDD-RANDOM6
    new_sku := 'ITEM-' || 
               to_char(now(), 'YYYYMMDD') || '-' || 
               upper(substring(md5(random()::text) from 1 for 6));
    
    -- Check if SKU already exists
    SELECT EXISTS(SELECT 1 FROM public.items WHERE sku = new_sku) INTO sku_exists;
    
    -- If doesn't exist, return it
    IF NOT sku_exists THEN
      RETURN new_sku;
    END IF;
  END LOOP;
END;
$$;

-- Create trigger to auto-generate SKU on insert if not provided
CREATE OR REPLACE FUNCTION public.set_item_sku()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := generate_item_sku();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_item_sku
  BEFORE INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_item_sku();