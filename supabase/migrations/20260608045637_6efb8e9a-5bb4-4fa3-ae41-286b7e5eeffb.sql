
-- $DAT claim ledger and mint audit log
CREATE TABLE public.dat_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  reason_key text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','confirmed','failed')),
  tx_hash text,
  block_number bigint,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- one-time claim prevention: same wallet + same reason_key can only exist once (when key set)
CREATE UNIQUE INDEX dat_claims_wallet_reason_key_uq
  ON public.dat_claims (lower(wallet), reason_key)
  WHERE reason_key IS NOT NULL;
CREATE INDEX dat_claims_wallet_idx ON public.dat_claims (lower(wallet), created_at DESC);
CREATE INDEX dat_claims_tx_uq ON public.dat_claims (tx_hash) WHERE tx_hash IS NOT NULL;

GRANT SELECT ON public.dat_claims TO anon;
GRANT SELECT ON public.dat_claims TO authenticated;
GRANT ALL ON public.dat_claims TO service_role;
ALTER TABLE public.dat_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Claims are publicly readable" ON public.dat_claims FOR SELECT USING (true);

-- Full audit log: every attempt, success or failure, with payload + error
CREATE TABLE public.dat_mint_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet text,
  action text NOT NULL,
  status text NOT NULL,
  payload jsonb,
  result jsonb,
  error text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX dat_mint_audit_wallet_idx ON public.dat_mint_audit (lower(wallet), created_at DESC);

GRANT ALL ON public.dat_mint_audit TO service_role;
ALTER TABLE public.dat_mint_audit ENABLE ROW LEVEL SECURITY;
-- no public policies; only server-side admin client may read this
