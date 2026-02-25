-- Drop existing policy and recreate with proper access for anonymous users
DROP POLICY IF EXISTS "Anyone can view global settings" ON public.global_settings;

-- Create new policy that explicitly allows both anonymous and authenticated users
CREATE POLICY "Public can view global settings"
ON public.global_settings
FOR SELECT
TO anon, authenticated
USING (true);