CREATE TABLE public.solved_theories (
  id uuid primary key default gen_random_uuid(),
  theory text not null,
  solver text not null default 'Quantara',
  abstract text,
  math text,
  transcript text,
  source text not null default 'web',
  created_at timestamptz not null default now()
);

GRANT SELECT, INSERT ON public.solved_theories TO anon;
GRANT SELECT, INSERT ON public.solved_theories TO authenticated;
GRANT ALL ON public.solved_theories TO service_role;

ALTER TABLE public.solved_theories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solved theories are publicly readable"
  ON public.solved_theories FOR SELECT
  USING (true);

CREATE POLICY "Anyone can record a solve"
  ON public.solved_theories FOR INSERT
  WITH CHECK (
    length(theory) between 1 and 500
    AND length(coalesce(abstract,'')) <= 4000
    AND length(coalesce(math,'')) <= 16000
    AND length(coalesce(transcript,'')) <= 32000
  );

CREATE INDEX solved_theories_created_at_idx ON public.solved_theories (created_at DESC);