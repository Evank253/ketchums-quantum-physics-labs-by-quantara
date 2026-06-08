
CREATE POLICY "Audit log is server-only" ON public.dat_mint_audit FOR SELECT USING (false);
