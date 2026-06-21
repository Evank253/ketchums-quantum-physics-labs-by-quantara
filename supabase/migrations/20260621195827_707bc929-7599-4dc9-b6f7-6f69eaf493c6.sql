
-- Restrict system_quarantine SELECT to admins only
DROP POLICY IF EXISTS "quarantine auth read" ON public.system_quarantine;
CREATE POLICY "quarantine admin read"
  ON public.system_quarantine FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Explicit deny on dat_mint_audit writes for non-service roles
CREATE POLICY "dat_mint_audit deny insert"
  ON public.dat_mint_audit AS RESTRICTIVE FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "dat_mint_audit deny update"
  ON public.dat_mint_audit AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "dat_mint_audit deny delete"
  ON public.dat_mint_audit AS RESTRICTIVE FOR DELETE
  TO anon, authenticated
  USING (false);
