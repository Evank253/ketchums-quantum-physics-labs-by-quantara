
-- 1. Realtime topic auth: restrict realtime.messages to authenticated users only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive realtime broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime broadcasts"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can send realtime broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated users can send realtime broadcasts"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. public_achievements: restrict reads to authenticated users (still public to all signed-in users, but blocks anon enumeration)
DROP POLICY IF EXISTS "Public can read achievements" ON public.public_achievements;
DROP POLICY IF EXISTS "Anyone can read achievements" ON public.public_achievements;
DROP POLICY IF EXISTS "achievements_public_select" ON public.public_achievements;

CREATE POLICY "Authenticated users can read achievements"
  ON public.public_achievements
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE SELECT ON public.public_achievements FROM anon;
