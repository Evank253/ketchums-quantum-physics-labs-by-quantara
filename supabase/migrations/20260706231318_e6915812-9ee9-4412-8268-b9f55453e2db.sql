
DROP POLICY IF EXISTS "anyone can enqueue dispatch" ON public.notification_dispatch;
DROP POLICY IF EXISTS "Anyone can enqueue dispatch" ON public.notification_dispatch;
REVOKE INSERT ON public.notification_dispatch FROM anon, authenticated;
GRANT INSERT ON public.notification_dispatch TO service_role;
CREATE POLICY "service_role can enqueue dispatch"
  ON public.notification_dispatch FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can record an achievement unlock" ON public.public_achievements;
DROP POLICY IF EXISTS "anyone can record an achievement unlock" ON public.public_achievements;
REVOKE INSERT ON public.public_achievements FROM anon, authenticated;
GRANT INSERT ON public.public_achievements TO service_role;
CREATE POLICY "service_role can record achievements"
  ON public.public_achievements FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Users can read their own dat_claims by wallet"
  ON public.dat_claims FOR SELECT TO authenticated
  USING (
    wallet <> '' AND lower(wallet) = lower(COALESCE(
      (SELECT p.wallet_address FROM public.profiles p WHERE p.user_id = auth.uid()),
      ''
    ))
  );

REVOKE EXECUTE ON FUNCTION public.admin_list_cron_runs(integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_cron_jobs() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.promote_user_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.invention_encrypt(text, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.invention_decrypt(bytea, text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.grant_plan_credits(uuid, text, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.consume_credit(uuid, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.cern_pocket_report(text, text) FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.admin_list_cron_runs(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.promote_user_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.invention_encrypt(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.invention_decrypt(bytea, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_plan_credits(uuid, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_credit(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cern_pocket_report(text, text) TO service_role;
