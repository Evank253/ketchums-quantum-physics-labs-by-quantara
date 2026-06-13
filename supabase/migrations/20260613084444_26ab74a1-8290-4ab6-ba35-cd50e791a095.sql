
CREATE TABLE IF NOT EXISTS public.notification_dispatch (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  theory        text NOT NULL,
  solver        text NOT NULL,
  recipient     text NOT NULL,
  recipient_kind text NOT NULL,
  email         text NOT NULL,
  subject       text NOT NULL,
  body          text NOT NULL,
  status        text NOT NULL DEFAULT 'queued',
  attempts      int NOT NULL DEFAULT 0,
  error         text,
  sent_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (theory, email)
);

GRANT SELECT, INSERT ON public.notification_dispatch TO anon;
GRANT SELECT, INSERT, UPDATE ON public.notification_dispatch TO authenticated;
GRANT ALL ON public.notification_dispatch TO service_role;

ALTER TABLE public.notification_dispatch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dispatch readable" ON public.notification_dispatch
  FOR SELECT USING (true);

CREATE POLICY "anyone can enqueue dispatch" ON public.notification_dispatch
  FOR INSERT WITH CHECK (
    length(theory) BETWEEN 1 AND 500
    AND length(recipient) BETWEEN 1 AND 200
    AND length(email) BETWEEN 3 AND 320
    AND length(subject) BETWEEN 1 AND 300
    AND length(body) BETWEEN 1 AND 16000
    AND recipient_kind IN ('institution','press')
  );

CREATE INDEX IF NOT EXISTS notification_dispatch_status_idx
  ON public.notification_dispatch (status, created_at DESC);
