
-- 1. chat_messages: restrict public read to authenticated only
DROP POLICY IF EXISTS "chat_messages_select_all" ON public.chat_messages;
DROP POLICY IF EXISTS "Anyone can read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_read" ON public.chat_messages;

CREATE POLICY "Authenticated users can read chat"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.chat_messages FROM anon;

-- 2. notification_dispatch: explicit deny for anon/authenticated; service role bypasses RLS
REVOKE ALL ON public.notification_dispatch FROM anon, authenticated;
GRANT ALL ON public.notification_dispatch TO service_role;

CREATE POLICY "No client access to notification_dispatch"
  ON public.notification_dispatch FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 3. Lock down internal email queue helpers to service_role only
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- 4. Set search_path on remaining SECURITY DEFINER / trigger functions that lack it
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
