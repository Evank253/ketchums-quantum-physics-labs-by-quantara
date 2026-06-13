
DELETE FROM public.solved_theories a
USING public.solved_theories b
WHERE a.theory = b.theory
  AND a.created_at > b.created_at;

-- handle exact-tie created_at duplicates
DELETE FROM public.solved_theories a
USING public.solved_theories b
WHERE a.theory = b.theory
  AND a.created_at = b.created_at
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS solved_theories_theory_unique
  ON public.solved_theories (theory);
