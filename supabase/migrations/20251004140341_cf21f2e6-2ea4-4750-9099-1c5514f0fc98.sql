-- Fix security warnings with correct column names

-- Fix generate_quote_code
create or replace function public.generate_quote_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  new_code text;
  code_num int;
begin
  select coalesce(max(cast(substring(code from 4) as int)), 0) + 1
  into code_num
  from quotes;
  
  new_code := 'XQ-' || lpad(code_num::text, 6, '0');
  return new_code;
end;
$$;

-- Fix normalize_phone
create or replace function public.normalize_phone(phone_input text)
returns text
language plpgsql
immutable
set search_path = public
as $$
begin
  return regexp_replace(phone_input, '[^0-9+]', '', 'g');
end;
$$;

-- Fix is_admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Fix owns_customer with correct column name (owner_id)
create or replace function public.owns_customer(customer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.customers
    where id = customer_id
      and owner_id = auth.uid()
  )
$$;

-- Drop the insecure role column from profiles
alter table public.profiles drop column if exists role;