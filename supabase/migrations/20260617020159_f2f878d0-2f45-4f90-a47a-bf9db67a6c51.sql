
-- 1) Fix exposed public_achievements: remove public-role read policy, keep authenticated.
DROP POLICY IF EXISTS "Achievements are publicly readable" ON public.public_achievements;
REVOKE SELECT ON public.public_achievements FROM anon;

-- 2) Cold-compute warmup cache (AI data cleaner fuels this)
CREATE TABLE IF NOT EXISTS public.compute_warmup_cache (
  cache_key   text PRIMARY KEY,
  model       text NOT NULL,
  payload     jsonb NOT NULL,
  hit_count   integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.compute_warmup_cache TO authenticated;
GRANT ALL ON public.compute_warmup_cache TO service_role;
ALTER TABLE public.compute_warmup_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warmup admin read" ON public.compute_warmup_cache
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_warmup_touch BEFORE UPDATE ON public.compute_warmup_cache
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
