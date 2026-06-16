
-- ============================================================================
-- INSTITUTIONAL RESEARCH PLATFORM (separate from $DAT token system)
-- ============================================================================

-- 1) Role enum + user_roles table -------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('free', 'pro', 'institution', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Security-definer role check (used inside RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Compute jobs -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compute_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  engine_result jsonb,
  codata_result jsonb,
  literature_result jsonb,
  sigma numeric,
  verdict text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT, INSERT ON public.compute_jobs TO authenticated;
GRANT ALL ON public.compute_jobs TO service_role;

ALTER TABLE public.compute_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own jobs" ON public.compute_jobs;
CREATE POLICY "Users can view their own jobs"
  ON public.compute_jobs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can submit jobs" ON public.compute_jobs;
CREATE POLICY "Users can submit jobs"
  ON public.compute_jobs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3) Run cards (immutable) --------------------------------------------------
CREATE TABLE IF NOT EXISTS public.run_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.compute_jobs(id) ON DELETE CASCADE,
  run_id text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_hash text NOT NULL,
  output_hash text NOT NULL,
  backend_version text NOT NULL,
  seed bigint,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.run_cards TO authenticated;
GRANT ALL ON public.run_cards TO service_role;

ALTER TABLE public.run_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own run cards" ON public.run_cards;
CREATE POLICY "Users can view their own run cards"
  ON public.run_cards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Immutability: block UPDATE / DELETE for non-service callers.
CREATE OR REPLACE FUNCTION public.block_run_card_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'run_cards are append-only';
END;
$$;

DROP TRIGGER IF EXISTS run_cards_no_update ON public.run_cards;
CREATE TRIGGER run_cards_no_update
  BEFORE UPDATE ON public.run_cards
  FOR EACH ROW EXECUTE FUNCTION public.block_run_card_mutation();

DROP TRIGGER IF EXISTS run_cards_no_delete ON public.run_cards;
CREATE TRIGGER run_cards_no_delete
  BEFORE DELETE ON public.run_cards
  FOR EACH ROW EXECUTE FUNCTION public.block_run_card_mutation();

-- 4) Institution API keys ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash text NOT NULL UNIQUE,
  label text NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.institution_api_keys TO authenticated;
GRANT ALL ON public.institution_api_keys TO service_role;

ALTER TABLE public.institution_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their api keys" ON public.institution_api_keys;
CREATE POLICY "Owners can view their api keys"
  ON public.institution_api_keys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Institutions can create keys" ON public.institution_api_keys;
CREATE POLICY "Institutions can create keys"
  ON public.institution_api_keys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'institution'));

DROP POLICY IF EXISTS "Owners can revoke their api keys" ON public.institution_api_keys;
CREATE POLICY "Owners can revoke their api keys"
  ON public.institution_api_keys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5) Usage counters ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  runs_count integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, period_start)
);

GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage" ON public.usage_counters;
CREATE POLICY "Users can view their own usage"
  ON public.usage_counters FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 6) Admin-only role promote helper -----------------------------------------
CREATE OR REPLACE FUNCTION public.promote_user_role(_target_user uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_user_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.promote_user_role(uuid, public.app_role) TO authenticated;
