
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.admin_list_cron_jobs()
RETURNS TABLE(jobid bigint, jobname text, schedule text, command text, active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
    SELECT j.jobid, j.jobname, j.schedule, j.command, j.active
    FROM cron.job j
    ORDER BY j.jobname;
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_cron_runs(_limit integer DEFAULT 50)
RETURNS TABLE(jobid bigint, runid bigint, job_pid integer, status text, return_message text, start_time timestamptz, end_time timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
    SELECT r.jobid, r.runid, r.job_pid, r.status, r.return_message, r.start_time, r.end_time
    FROM cron.job_run_details r
    ORDER BY r.start_time DESC
    LIMIT GREATEST(1, LEAST(_limit, 200));
EXCEPTION WHEN undefined_table THEN
  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_cron_jobs() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_cron_runs(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_jobs() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_cron_runs(integer) TO authenticated, service_role;
