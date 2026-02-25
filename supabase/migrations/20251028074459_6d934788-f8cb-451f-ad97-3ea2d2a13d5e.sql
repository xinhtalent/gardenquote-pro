-- Re-enable RLS for security compliance
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies - these tables should only be accessed via Service Role in Edge Functions
-- No direct client access allowed

CREATE POLICY "No client access to webauthn_credentials"
ON public.webauthn_credentials
FOR ALL
USING (false)
WITH CHECK (false);

CREATE POLICY "No client access to webauthn_challenges"
ON public.webauthn_challenges
FOR ALL
USING (false)
WITH CHECK (false);