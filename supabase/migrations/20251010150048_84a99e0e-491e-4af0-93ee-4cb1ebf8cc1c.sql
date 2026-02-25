-- Add discount_percent and vat_percent columns to quotes table
ALTER TABLE public.quotes
ADD COLUMN discount_percent numeric DEFAULT NULL,
ADD COLUMN vat_percent numeric DEFAULT NULL;

COMMENT ON COLUMN public.quotes.discount_percent IS 'Discount percentage applied to the quote';
COMMENT ON COLUMN public.quotes.vat_percent IS 'VAT percentage applied to the quote';