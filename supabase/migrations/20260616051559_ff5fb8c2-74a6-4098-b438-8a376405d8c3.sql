
-- 1. dat_claims: explicit admin-only read (service role still bypasses RLS for server fns)
CREATE POLICY "dat_claims admin read" ON public.dat_claims
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 2. system_quarantine: drop public-read, allow authenticated only
DROP POLICY IF EXISTS "quarantine public read" ON public.system_quarantine;
REVOKE SELECT ON public.system_quarantine FROM anon;
CREATE POLICY "quarantine auth read" ON public.system_quarantine
  FOR SELECT TO authenticated USING (true);

-- 3. feedback: remove anon submission path
DROP POLICY IF EXISTS "feedback submit any" ON public.feedback;
CREATE POLICY "feedback submit authenticated" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
REVOKE INSERT ON public.feedback FROM anon;
