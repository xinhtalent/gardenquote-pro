-- Add company_email and company_website fields to settings table
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS company_email text,
ADD COLUMN IF NOT EXISTS company_website text;