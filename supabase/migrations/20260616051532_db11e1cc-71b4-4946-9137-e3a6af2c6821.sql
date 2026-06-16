
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing job if present, then re-create
DO $$
BEGIN
  PERFORM cron.unschedule('nexus-healer-run');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'nexus-healer-run',
  '*/15 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://project--mbxuchfemhfzfpyeujol.lovable.app/api/public/healer/run',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ieHVjaGZlbWhmemZweWV1am9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Nzk4OTAsImV4cCI6MjA5NjQ1NTg5MH0.8MGPpHAgIVFn6w-cX0AzFjYwveejDKGfj1Cv7bGQLj4'
    ),
    body := jsonb_build_object('trigger', 'cron')
  );
  $job$
);
