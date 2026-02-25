-- Add missing company fields to global_settings table
ALTER TABLE public.global_settings
ADD COLUMN company_tagline text,
ADD COLUMN company_contact text,
ADD COLUMN company_address text,
ADD COLUMN company_tax_code text,
ADD COLUMN company_email text,
ADD COLUMN company_website text;