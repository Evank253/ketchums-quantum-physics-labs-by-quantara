
-- 1. profiles: wallet binding for Base SIWE
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text UNIQUE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. siwe_nonces: one-time use, 5min TTL
CREATE TABLE IF NOT EXISTS public.siwe_nonces (
  nonce text PRIMARY KEY,
  wallet_address text,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.siwe_nonces TO service_role;
ALTER TABLE public.siwe_nonces ENABLE ROW LEVEL SECURITY;
-- No policies => only service_role (server fns) can touch this.

-- 3. base_payments: USDC payments via Base Pay
CREATE TABLE IF NOT EXISTS public.base_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  wallet_address text NOT NULL,
  payment_id text UNIQUE NOT NULL,
  plan text,
  addon text,
  amount_usd numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  testnet boolean NOT NULL DEFAULT false,
  tx_hash text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.base_payments TO authenticated;
GRANT ALL ON public.base_payments TO service_role;
ALTER TABLE public.base_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own base payments" ON public.base_payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all base payments" ON public.base_payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER base_payments_touch BEFORE UPDATE ON public.base_payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS idx_base_payments_user ON public.base_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_base_payments_wallet ON public.base_payments(wallet_address);

-- 4. credits + addons on subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS credits_remaining integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS credits_granted integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS purchased_addons jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox';

-- 5. Updated quota function: credits-based + new plan names + back-compat with old names
CREATE OR REPLACE FUNCTION public.check_user_quota(_user_id uuid)
RETURNS TABLE(allowed boolean, reason text, plan text, runs_used integer, runs_limit integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sub RECORD;
  effective_plan text;
  lim INT;
BEGIN
  IF public.has_role(_user_id,'admin') OR public.has_role(_user_id,'institution') THEN
    RETURN QUERY SELECT true, 'admin/institution bypass', 'enterprise', 0, -1; RETURN;
  END IF;

  SELECT * INTO sub FROM public.subscriptions WHERE user_id = _user_id;
  IF NOT FOUND THEN
    INSERT INTO public.subscriptions (user_id, plan, status, trial_ends_at, credits_remaining, credits_granted)
    VALUES (_user_id, 'explorer', 'active', now() + interval '7 days', 5, 5)
    ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO sub FROM public.subscriptions WHERE user_id = _user_id;
  END IF;

  -- Back-compat plan mapping
  effective_plan := CASE sub.plan
    WHEN 'trial' THEN 'explorer'
    WHEN 'starter' THEN 'researcher'
    WHEN 'pro' THEN 'professional'
    WHEN 'institution' THEN 'institutional'
    ELSE sub.plan
  END;

  lim := CASE effective_plan
    WHEN 'explorer' THEN 5
    WHEN 'researcher' THEN 100
    WHEN 'professional' THEN 1000
    WHEN 'institutional' THEN 10000
    WHEN 'enterprise' THEN -1
    ELSE 0
  END;

  IF sub.status = 'expired' OR sub.status = 'canceled' THEN
    IF sub.current_period_end IS NULL OR sub.current_period_end < now() THEN
      RETURN QUERY SELECT false, 'Subscription inactive.', effective_plan, 0, lim; RETURN;
    END IF;
  END IF;

  IF effective_plan = 'explorer' AND sub.trial_ends_at IS NOT NULL AND now() > sub.trial_ends_at AND COALESCE(sub.credits_remaining,0) <= 0 THEN
    RETURN QUERY SELECT false, 'Free trial used. Upgrade to continue.', effective_plan, COALESCE(sub.credits_granted,5)-COALESCE(sub.credits_remaining,0), lim; RETURN;
  END IF;

  IF lim >= 0 AND COALESCE(sub.credits_remaining,0) <= 0 THEN
    RETURN QUERY SELECT false, format('No credits remaining (%s plan).', effective_plan), effective_plan, COALESCE(sub.credits_granted,0), lim; RETURN;
  END IF;

  RETURN QUERY SELECT true, 'ok', effective_plan, COALESCE(sub.credits_granted,0)-COALESCE(sub.credits_remaining,0), lim;
END;
$$;

-- 6. Decrement credits atomically (called after a successful run)
CREATE OR REPLACE FUNCTION public.consume_credit(_user_id uuid, _amount integer DEFAULT 1)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE remaining integer;
BEGIN
  IF public.has_role(_user_id,'admin') OR public.has_role(_user_id,'institution') THEN
    RETURN 999999;
  END IF;
  UPDATE public.subscriptions
     SET credits_remaining = GREATEST(0, COALESCE(credits_remaining,0) - _amount),
         updated_at = now()
   WHERE user_id = _user_id
   RETURNING credits_remaining INTO remaining;
  RETURN COALESCE(remaining, 0);
END;
$$;

-- 7. Grant credits (called by Stripe webhook + Base Pay verify on successful payment)
CREATE OR REPLACE FUNCTION public.grant_plan_credits(_user_id uuid, _plan text, _credits integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, credits_remaining, credits_granted)
  VALUES (_user_id, _plan, 'active', _credits, _credits)
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    status = 'active',
    credits_remaining = COALESCE(public.subscriptions.credits_remaining,0) + _credits,
    credits_granted = COALESCE(public.subscriptions.credits_granted,0) + _credits,
    updated_at = now();
END;
$$;
