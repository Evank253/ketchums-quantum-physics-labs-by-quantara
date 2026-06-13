CREATE TABLE public.public_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  achievement_id text NOT NULL,
  title text NOT NULL,
  description text,
  tier text NOT NULL DEFAULT 'bronze',
  reward integer NOT NULL DEFAULT 0,
  operator text,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX public_achievements_achievement_id_idx ON public.public_achievements (achievement_id);
CREATE INDEX public_achievements_unlocked_at_idx ON public.public_achievements (unlocked_at DESC);

GRANT SELECT, INSERT ON public.public_achievements TO anon;
GRANT SELECT, INSERT ON public.public_achievements TO authenticated;
GRANT ALL ON public.public_achievements TO service_role;

ALTER TABLE public.public_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are publicly readable"
  ON public.public_achievements FOR SELECT
  USING (true);

CREATE POLICY "Anyone can record an achievement unlock"
  ON public.public_achievements FOR INSERT
  WITH CHECK (
    length(achievement_id) BETWEEN 1 AND 100
    AND length(title) BETWEEN 1 AND 200
    AND length(COALESCE(description, '')) <= 1000
    AND tier IN ('bronze','silver','gold','mythic')
    AND reward >= 0 AND reward <= 1000000
    AND length(COALESCE(operator, '')) <= 100
  );