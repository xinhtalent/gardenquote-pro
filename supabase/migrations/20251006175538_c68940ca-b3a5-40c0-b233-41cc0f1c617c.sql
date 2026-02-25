-- Allow admins to view all user settings
CREATE POLICY "Admins can view all settings"
ON public.settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));