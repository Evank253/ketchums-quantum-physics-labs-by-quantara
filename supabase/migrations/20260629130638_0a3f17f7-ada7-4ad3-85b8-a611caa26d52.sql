
CREATE TABLE public.owner_inventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  problem TEXT,
  materials JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  safety TEXT,
  legal TEXT,
  civilization TEXT,
  report_md TEXT NOT NULL,
  emailed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.owner_inventions TO authenticated;
GRANT ALL ON public.owner_inventions TO service_role;

ALTER TABLE public.owner_inventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read owner inventions"
  ON public.owner_inventions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Schedule discovery every 30 minutes via pg_cron hitting the public route
DO $$
DECLARE
  v_url text := 'https://project--c3270ea2-02ec-4c05-8ee1-5dbf80b96149.lovable.app/api/public/inventions/run';
  v_key text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN v_key := NULL; END;

  PERFORM cron.unschedule('owner-inventions-discover') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'owner-inventions-discover'
  );

  PERFORM cron.schedule(
    'owner-inventions-discover',
    '*/30 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('content-type','application/json','apikey', %L),
        body := '{}'::jsonb
      );
    $job$, v_url, COALESCE(v_key,''))
  );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
