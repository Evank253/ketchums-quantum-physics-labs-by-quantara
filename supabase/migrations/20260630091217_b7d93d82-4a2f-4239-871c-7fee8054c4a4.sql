
-- Email-related tables: server-only access enforced structurally.
CREATE POLICY "deny_non_service_all"
  ON public.email_unsubscribe_tokens AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "deny_non_service_all"
  ON public.suppressed_emails AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "deny_non_service_all"
  ON public.email_send_log AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "deny_non_service_all"
  ON public.email_send_state AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- admin_logs: admins (via the permissive policy) plus service_role only.
CREATE POLICY "deny_non_admin_all"
  ON public.admin_logs AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- owner_inventions: admin-only, structurally enforced.
CREATE POLICY "deny_non_admin_all"
  ON public.owner_inventions AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
