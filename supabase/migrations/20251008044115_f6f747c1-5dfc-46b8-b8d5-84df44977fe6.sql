-- Drop the old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create new function with phone support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN new;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Sync existing data: Update profiles.phone from auth.users
UPDATE public.profiles
SET phone = auth.users.raw_user_meta_data->>'phone'
FROM auth.users
WHERE profiles.id = auth.users.id
  AND profiles.phone IS NULL
  AND auth.users.raw_user_meta_data->>'phone' IS NOT NULL;

-- Drop creator_email column from settings
ALTER TABLE public.settings DROP COLUMN IF EXISTS creator_email;