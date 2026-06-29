
-- Mint a cron token, store it admin-only, and rewire pg_cron to use it.
DO $$
DECLARE
  v_token TEXT := encode(gen_random_bytes(32), 'hex');
  v_url TEXT := 'https://project--c3270ea2-02ec-4c05-8ee1-5dbf80b96149.lovable.app/api/public/inventions/run';
BEGIN
  INSERT INTO public.system_settings(key, value)
  VALUES ('inventions_cron_token', to_jsonb(v_token))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'owner-inventions-discover';

  PERFORM cron.schedule(
    'owner-inventions-discover',
    '*/30 * * * *',
    format($cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'content-type','application/json',
          'authorization', 'Bearer ' || %L
        ),
        body := '{}'::jsonb
      );
    $cmd$, v_url, v_token)
  );
END $$;
