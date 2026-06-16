
-- Fix mutable search_path on the immutability trigger function
CREATE OR REPLACE FUNCTION public.block_run_card_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'run_cards are append-only';
END;
$$;

-- Explicit admin-management policies so the linter sees a policy on every op
DROP POLICY IF EXISTS "Admins manage run cards" ON public.run_cards;
CREATE POLICY "Admins manage run cards"
  ON public.run_cards FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage usage counters" ON public.usage_counters;
CREATE POLICY "Admins manage usage counters"
  ON public.usage_counters FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
