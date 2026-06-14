
-- Notification dispatch: remove public read + public insert
DROP POLICY IF EXISTS "dispatch readable" ON public.notification_dispatch;
DROP POLICY IF EXISTS "anyone can enqueue dispatch" ON public.notification_dispatch;

-- Public achievements: remove public insert (keep public select for feed)
DROP POLICY IF EXISTS "Anyone can record an achievement unlock" ON public.public_achievements;

-- Solved theories: remove public insert (keep public select for ledger)
DROP POLICY IF EXISTS "Anyone can record a solve" ON public.solved_theories;

-- Dat claims: remove public read
DROP POLICY IF EXISTS "Claims are publicly readable" ON public.dat_claims;

-- Revoke anon write/read privileges that are no longer needed
REVOKE INSERT, UPDATE, DELETE ON public.notification_dispatch FROM anon;
REVOKE SELECT ON public.notification_dispatch FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.public_achievements FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.solved_theories FROM anon;
REVOKE SELECT ON public.dat_claims FROM anon;

-- service_role keeps full access (bypasses RLS); ensure grants remain
GRANT ALL ON public.notification_dispatch TO service_role;
GRANT ALL ON public.public_achievements TO service_role;
GRANT ALL ON public.solved_theories TO service_role;
GRANT ALL ON public.dat_claims TO service_role;
