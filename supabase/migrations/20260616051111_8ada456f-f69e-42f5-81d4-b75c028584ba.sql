
REVOKE EXECUTE ON FUNCTION public.audit_row() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_alert() FROM anon, authenticated, PUBLIC;
-- is_quarantined is read by app code; keep it callable but only by service-role + signed-in users
REVOKE EXECUTE ON FUNCTION public.is_quarantined(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_quarantined(text) TO authenticated, service_role;
