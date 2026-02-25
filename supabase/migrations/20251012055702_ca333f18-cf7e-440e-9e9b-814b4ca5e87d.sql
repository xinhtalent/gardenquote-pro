-- Add CASCADE DELETE constraint to quote_items table
-- This ensures that when a quote is deleted, all its items are automatically deleted

-- First, check if the foreign key exists and drop it if it does
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'quote_items_quote_id_fkey'
  ) THEN
    ALTER TABLE public.quote_items 
    DROP CONSTRAINT quote_items_quote_id_fkey;
  END IF;
END $$;

-- Add the foreign key constraint with CASCADE DELETE
ALTER TABLE public.quote_items
ADD CONSTRAINT quote_items_quote_id_fkey
FOREIGN KEY (quote_id)
REFERENCES public.quotes(id)
ON DELETE CASCADE;