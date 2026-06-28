
-- notification_dispatch: server-side writes only
REVOKE INSERT, UPDATE, DELETE ON public.notification_dispatch FROM anon, authenticated;
GRANT ALL ON public.notification_dispatch TO service_role;
DROP POLICY IF EXISTS "deny client writes notification_dispatch" ON public.notification_dispatch;
CREATE POLICY "deny client writes notification_dispatch"
  ON public.notification_dispatch
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- dat_claims: server-side only; admin SELECT preserved
REVOKE INSERT, UPDATE, DELETE ON public.dat_claims FROM anon, authenticated;
GRANT ALL ON public.dat_claims TO service_role;
DROP POLICY IF EXISTS "deny client writes dat_claims" ON public.dat_claims;
CREATE POLICY "deny client writes dat_claims"
  ON public.dat_claims
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (
    -- allow existing admin SELECT path; restrict writes only
    (SELECT current_setting('request.method', true)) IS NULL
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (false);

-- public_achievements: server-side writes only; authenticated SELECT preserved
REVOKE INSERT, UPDATE, DELETE ON public.public_achievements FROM anon, authenticated;
GRANT ALL ON public.public_achievements TO service_role;
DROP POLICY IF EXISTS "deny client writes public_achievements" ON public.public_achievements;
CREATE POLICY "deny client writes public_achievements"
  ON public.public_achievements
  AS RESTRICTIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);
DROP POLICY IF EXISTS "deny client updates public_achievements" ON public.public_achievements;
CREATE POLICY "deny client updates public_achievements"
  ON public.public_achievements
  AS RESTRICTIVE
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
DROP POLICY IF EXISTS "deny client deletes public_achievements" ON public.public_achievements;
CREATE POLICY "deny client deletes public_achievements"
  ON public.public_achievements
  AS RESTRICTIVE
  FOR DELETE
  TO anon, authenticated
  USING (false);
