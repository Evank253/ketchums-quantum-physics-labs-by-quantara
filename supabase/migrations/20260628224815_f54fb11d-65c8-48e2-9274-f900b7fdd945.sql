
-- 1. dat_claims: allow user-scoped reads via profile wallet
CREATE POLICY "dat_claims_owner_read"
  ON public.dat_claims
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.wallet_address IS NOT NULL
        AND lower(p.wallet_address) = lower(public.dat_claims.wallet)
    )
  );
GRANT SELECT ON public.dat_claims TO authenticated;

-- 2. realtime.messages: drop wide policies, add topic-scoped ones
DROP POLICY IF EXISTS "Authenticated users can receive realtime broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send realtime broadcasts" ON realtime.messages;

-- Public chat + feedback broadcasts: any signed-in user may receive
CREATE POLICY "realtime_recv_public_topics"
  ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() IN ('chat', 'feedback', 'public_achievements')
    OR realtime.topic() LIKE 'chat:%'
    OR realtime.topic() LIKE 'public:%'
  );

-- User-scoped topics: only the owner of the topic may receive
CREATE POLICY "realtime_recv_user_topics"
  ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    realtime.topic() = ('user:' || auth.uid()::text)
    OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  );

-- Admin-only sensitive topics
CREATE POLICY "realtime_recv_admin_topics"
  ON realtime.messages
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND (
      realtime.topic() LIKE 'admin:%'
      OR realtime.topic() LIKE 'security:%'
      OR realtime.topic() LIKE 'audit:%'
    )
  );

-- No client sends. All broadcasts must originate from server / triggers (service_role).
CREATE POLICY "realtime_send_deny_clients"
  ON realtime.messages AS RESTRICTIVE
  FOR INSERT TO anon, authenticated
  WITH CHECK (false);

-- 3. Defense-in-depth: re-revoke INSERTs on email queue + achievement ledger
REVOKE INSERT, UPDATE, DELETE ON public.notification_dispatch FROM anon, authenticated, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.public_achievements FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
