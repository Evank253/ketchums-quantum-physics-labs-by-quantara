
-- 1. Add viewer role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2. Subscriptions table (trial + Stripe)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','starter','pro','institution','expired')),
  status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own subscription" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 3. Annex live-run results
CREATE TABLE IF NOT EXISTS public.annex_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theory_id TEXT NOT NULL,
  theory_name TEXT NOT NULL,
  engine_value DOUBLE PRECISION,
  reference_value DOUBLE PRECISION,
  sigma DOUBLE PRECISION,
  verdict TEXT,
  payload JSONB,
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.annex_runs TO authenticated;
GRANT ALL ON public.annex_runs TO service_role;
ALTER TABLE public.annex_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read annex_runs" ON public.annex_runs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 4. Admin-only logs (audit feed)
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,  -- 'annex_run' | 'auto_mint' | 'cern_dispatch' | 'subscription' | 'system'
  subject TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read admin_logs" ON public.admin_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 5. Tighten existing tables: only owner OR admin can read
DROP POLICY IF EXISTS "Users can view own jobs" ON public.compute_jobs;
CREATE POLICY "owner or admin reads compute_jobs" ON public.compute_jobs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Users can view own run cards" ON public.run_cards;
CREATE POLICY "owner or admin reads run_cards" ON public.run_cards
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- dat_mint_audit: admin-only
ALTER TABLE public.dat_mint_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins read mint audit" ON public.dat_mint_audit;
CREATE POLICY "admins read mint audit" ON public.dat_mint_audit
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 6. Trigger: on signup → create trial subscription
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'trial', 'active', now() + interval '7 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_trial_subscription();

-- 7. Quota check helper (used by submitComputeJob)
CREATE OR REPLACE FUNCTION public.check_user_quota(_user_id UUID)
RETURNS TABLE(allowed BOOLEAN, reason TEXT, plan TEXT, runs_used INT, runs_limit INT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sub RECORD;
  used INT;
  lim INT;
  period_start_date DATE;
BEGIN
  -- Admins + institution role bypass entirely
  IF public.has_role(_user_id,'admin') OR public.has_role(_user_id,'institution') THEN
    RETURN QUERY SELECT true, 'admin/institution bypass', 'institution', 0, -1; RETURN;
  END IF;

  SELECT * INTO sub FROM public.subscriptions WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (user_id, plan, trial_ends_at)
    VALUES (_user_id, 'trial', now() + interval '7 days')
    ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO sub FROM public.subscriptions WHERE user_id = _user_id;
  END IF;

  period_start_date := date_trunc('month', now())::date;
  SELECT COALESCE(SUM(runs_count),0) INTO used
    FROM public.usage_counters
    WHERE user_id = _user_id AND period_start = period_start_date;

  lim := CASE sub.plan
    WHEN 'trial' THEN 5
    WHEN 'starter' THEN 100
    WHEN 'pro' THEN 2000
    WHEN 'institution' THEN -1
    ELSE 0
  END;

  IF sub.plan = 'trial' AND sub.trial_ends_at IS NOT NULL AND now() > sub.trial_ends_at THEN
    RETURN QUERY SELECT false, 'Trial expired. Subscribe to continue.', sub.plan, used, lim; RETURN;
  END IF;

  IF sub.plan = 'expired' THEN
    RETURN QUERY SELECT false, 'Subscription inactive.', sub.plan, used, lim; RETURN;
  END IF;

  IF lim >= 0 AND used >= lim THEN
    RETURN QUERY SELECT false, format('Quota reached (%s/%s this month).', used, lim), sub.plan, used, lim; RETURN;
  END IF;

  RETURN QUERY SELECT true, 'ok', sub.plan, used, lim;
END; $$;

GRANT EXECUTE ON FUNCTION public.check_user_quota(UUID) TO authenticated, service_role;

-- 8. Updated_at trigger for subscriptions
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS subscriptions_touch ON public.subscriptions;
CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
