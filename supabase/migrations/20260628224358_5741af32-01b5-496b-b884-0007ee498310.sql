
-- 1. notification_dispatch: hard lockdown
REVOKE ALL ON public.notification_dispatch FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.notification_dispatch TO service_role;
DROP POLICY IF EXISTS "No client access to notification_dispatch" ON public.notification_dispatch;
DROP POLICY IF EXISTS "deny client writes notification_dispatch" ON public.notification_dispatch;
CREATE POLICY "notification_dispatch_deny_all"
  ON public.notification_dispatch AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- 2. public_achievements: keep authenticated read, hard-deny all client writes
REVOKE INSERT, UPDATE, DELETE ON public.public_achievements FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.public_achievements TO authenticated;
GRANT ALL ON public.public_achievements TO service_role;
DROP POLICY IF EXISTS "deny client writes public_achievements" ON public.public_achievements;
DROP POLICY IF EXISTS "deny client updates public_achievements" ON public.public_achievements;
DROP POLICY IF EXISTS "deny client deletes public_achievements" ON public.public_achievements;
CREATE POLICY "public_achievements_deny_client_writes"
  ON public.public_achievements AS RESTRICTIVE
  FOR INSERT TO anon, authenticated
  WITH CHECK (false);
CREATE POLICY "public_achievements_deny_client_updates"
  ON public.public_achievements AS RESTRICTIVE
  FOR UPDATE TO anon, authenticated
  USING (false) WITH CHECK (false);
CREATE POLICY "public_achievements_deny_client_deletes"
  ON public.public_achievements AS RESTRICTIVE
  FOR DELETE TO anon, authenticated
  USING (false);

-- 3. dat_claims: server-side only. Hard-deny client access via restrictive policy
REVOKE ALL ON public.dat_claims FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.dat_claims TO service_role;
DROP POLICY IF EXISTS "dat_claims admin read" ON public.dat_claims;
DROP POLICY IF EXISTS "deny client writes dat_claims" ON public.dat_claims;
CREATE POLICY "dat_claims_admin_read"
  ON public.dat_claims
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "dat_claims_deny_client_writes"
  ON public.dat_claims AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
COMMENT ON TABLE public.dat_claims IS
  'Server-side only. Writes occur via service_role from edge/server functions. Authenticated admins may read; no end-user-scoped access path is intended.';

-- 4. Revoke EXECUTE on internal SECURITY DEFINER admin functions
REVOKE EXECUTE ON FUNCTION public.admin_list_cron_jobs() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_list_cron_runs(integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_quarantined(text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_runs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_quarantined(text) TO service_role;
