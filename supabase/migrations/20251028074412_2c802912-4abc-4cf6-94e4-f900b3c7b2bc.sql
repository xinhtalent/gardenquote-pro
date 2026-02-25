-- Disable RLS for webauthn tables since they are only accessed via Service Role in Edge Functions
ALTER TABLE public.webauthn_credentials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.webauthn_challenges DISABLE ROW LEVEL SECURITY;