-- Add payment information snapshot columns to quotes table
ALTER TABLE public.quotes 
ADD COLUMN payment_bank_name TEXT,
ADD COLUMN payment_account_number TEXT,
ADD COLUMN payment_account_name TEXT;

COMMENT ON COLUMN public.quotes.payment_bank_name IS 'Snapshot of bank name at quote creation time';
COMMENT ON COLUMN public.quotes.payment_account_number IS 'Snapshot of account number at quote creation time';
COMMENT ON COLUMN public.quotes.payment_account_name IS 'Snapshot of account name at quote creation time';