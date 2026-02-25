-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'agent');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Update items table RLS: Make items PUBLIC (everyone can access)
DROP POLICY IF EXISTS "Users can view their own items" ON public.items;
DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;

CREATE POLICY "Anyone authenticated can view items"
  ON public.items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can insert items"
  ON public.items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update items"
  ON public.items FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone authenticated can delete items"
  ON public.items FOR DELETE
  TO authenticated
  USING (true);

-- Update customers RLS: Owner OR Admin can access
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;

CREATE POLICY "Users can view their own customers or admins can view all"
  ON public.customers FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own customers"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customers or admins can update all"
  ON public.customers FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own customers or admins can delete all"
  ON public.customers FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Update quotes RLS: Owner OR Admin can access
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;

CREATE POLICY "Users can view their own quotes or admins can view all"
  ON public.quotes FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes or admins can update all"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own quotes or admins can delete all"
  ON public.quotes FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Update quote_items RLS to work with new quotes policies
DROP POLICY IF EXISTS "Users can view quote items for their quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can insert quote items for their quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can update quote items for their quotes" ON public.quote_items;
DROP POLICY IF EXISTS "Users can delete quote items for their quotes" ON public.quote_items;

CREATE POLICY "Users can view quote items for accessible quotes"
  ON public.quote_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can insert quote items for accessible quotes"
  ON public.quote_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can update quote items for accessible quotes"
  ON public.quote_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can delete quote items for accessible quotes"
  ON public.quote_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM quotes
      WHERE quotes.id = quote_items.quote_id
      AND (quotes.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Add app_name to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS app_name TEXT DEFAULT 'Hệ thống báo giá';

-- Create global_settings table for admin-only settings (logo, company name, app name)
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_logo_url TEXT,
  company_name TEXT,
  app_name TEXT DEFAULT 'Hệ thống báo giá',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Only one row allowed in global_settings
CREATE UNIQUE INDEX IF NOT EXISTS global_settings_singleton ON public.global_settings ((true));

-- RLS for global_settings: Everyone can read, only admin can modify
CREATE POLICY "Anyone can view global settings"
  ON public.global_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert global settings"
  ON public.global_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update global settings"
  ON public.global_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for global_settings updated_at
CREATE TRIGGER update_global_settings_updated_at
  BEFORE UPDATE ON public.global_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default global_settings if not exists
INSERT INTO public.global_settings (company_name, app_name)
VALUES ('Công ty', 'Hệ thống báo giá')
ON CONFLICT DO NOTHING;

-- Trigger to auto-assign agent role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agent');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();