-- Restrict WebAuthn challenge storage to trusted server-side code.
REVOKE ALL PRIVILEGES ON TABLE public.webauthn_challenges FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webauthn_challenges TO service_role;
