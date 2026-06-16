
REVOKE EXECUTE ON FUNCTION public.check_user_quota(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_credit(uuid, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.grant_plan_credits(uuid, text, integer) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_user_quota(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_credit(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_plan_credits(uuid, text, integer) TO service_role;

-- siwe_nonces: intentionally server-only. Add explicit deny-all so linter is satisfied.
CREATE POLICY "Deny all client access" ON public.siwe_nonces FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
