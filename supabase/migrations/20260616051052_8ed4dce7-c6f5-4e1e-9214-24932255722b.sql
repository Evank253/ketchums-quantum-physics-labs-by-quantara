
-- 1. Realtime hardening: drop the anon-readable chat policy
DROP POLICY IF EXISTS "chat read all" ON public.chat_messages;
REVOKE SELECT ON public.chat_messages FROM anon;

-- 2. security_findings
CREATE TABLE IF NOT EXISTS public.security_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,                -- 'wiz' | 'supabase' | 'self_test' | 'healer'
  external_id text,                    -- scanner internal id if any
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  title text NOT NULL,
  description text,
  affected_resource text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','quarantined','fixing','fixed','ignored')),
  fix_strategy text,
  fix_log jsonb DEFAULT '[]'::jsonb,
  payload jsonb DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, external_id)
);
GRANT SELECT ON public.security_findings TO authenticated;
GRANT ALL ON public.security_findings TO service_role;
ALTER TABLE public.security_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "findings admin read" ON public.security_findings
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_security_findings_touch BEFORE UPDATE ON public.security_findings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. security_alerts (admin inbox)
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL CHECK (severity IN ('info','warn','critical')),
  source text NOT NULL,
  title text NOT NULL,
  body text,
  payload jsonb DEFAULT '{}'::jsonb,
  finding_id uuid REFERENCES public.security_findings(id) ON DELETE SET NULL,
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts admin read" ON public.security_alerts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "alerts admin mark read" ON public.security_alerts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_security_alerts_unread ON public.security_alerts(created_at DESC) WHERE read_at IS NULL;

-- 4. audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  table_name text NOT NULL,
  op text NOT NULL,                    -- INSERT/UPDATE/DELETE
  actor_id uuid,                       -- auth.uid()
  row_id text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_audit_log_table_time ON public.audit_log(table_name, created_at DESC);

-- 5. system_quarantine (kill-switch flags healer can flip)
CREATE TABLE IF NOT EXISTS public.system_quarantine (
  key text PRIMARY KEY,                -- e.g. 'chat_messages', 'dat_mint', 'feedback'
  active boolean NOT NULL DEFAULT false,
  reason text,
  triggered_by text,                   -- 'healer' | 'admin:<uid>'
  triggered_at timestamptz,
  cleared_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_quarantine TO authenticated, anon;
GRANT ALL ON public.system_quarantine TO service_role;
ALTER TABLE public.system_quarantine ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quarantine public read" ON public.system_quarantine
  FOR SELECT USING (true);
CREATE TRIGGER trg_system_quarantine_touch BEFORE UPDATE ON public.system_quarantine
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. is_quarantined() helper for policies / app code
CREATE OR REPLACE FUNCTION public.is_quarantined(_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT active FROM public.system_quarantine WHERE key = _key), false);
$$;
REVOKE EXECUTE ON FUNCTION public.is_quarantined(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_quarantined(text) TO authenticated, anon, service_role;

-- Apply quarantine to chat insertions (auth users only, and not quarantined)
DROP POLICY IF EXISTS "chat insert own" ON public.chat_messages;
CREATE POLICY "chat insert own" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_quarantined('chat_messages'));

-- 7. Generic audit trigger
CREATE OR REPLACE FUNCTION public.audit_row()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor uuid := NULL;
  v_row_id text;
BEGIN
  BEGIN v_actor := auth.uid(); EXCEPTION WHEN OTHERS THEN v_actor := NULL; END;
  IF TG_OP = 'DELETE' THEN
    v_row_id := COALESCE(OLD->>'id', NULL);
    INSERT INTO public.audit_log(table_name, op, actor_id, row_id, old_data)
      VALUES (TG_TABLE_NAME, TG_OP, v_actor, (to_jsonb(OLD)->>'id'), to_jsonb(OLD));
    RETURN OLD;
  ELSE
    INSERT INTO public.audit_log(table_name, op, actor_id, row_id, old_data, new_data)
      VALUES (TG_TABLE_NAME, TG_OP, v_actor, (to_jsonb(NEW)->>'id'),
        CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) END, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.audit_row() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_row();

DROP TRIGGER IF EXISTS trg_audit_dat_claims ON public.dat_claims;
CREATE TRIGGER trg_audit_dat_claims
  AFTER INSERT OR UPDATE OR DELETE ON public.dat_claims
  FOR EACH ROW EXECUTE FUNCTION public.audit_row();

DROP TRIGGER IF EXISTS trg_audit_feedback ON public.feedback;
CREATE TRIGGER trg_audit_feedback
  AFTER UPDATE OR DELETE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.audit_row();

DROP TRIGGER IF EXISTS trg_audit_quarantine ON public.system_quarantine;
CREATE TRIGGER trg_audit_quarantine
  AFTER INSERT OR UPDATE OR DELETE ON public.system_quarantine
  FOR EACH ROW EXECUTE FUNCTION public.audit_row();

-- 8. Email-on-critical-alert: when a critical alert lands, enqueue an email
--    to known admin addresses via the existing pgmq queue.
CREATE OR REPLACE FUNCTION public.notify_admins_on_alert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq AS $$
DECLARE
  v_email text;
  v_admin_emails text[] := ARRAY['evan.ketchum2026@outlook.com','evan.ketchum2000@gmail.com'];
BEGIN
  IF NEW.severity <> 'critical' THEN RETURN NEW; END IF;
  FOREACH v_email IN ARRAY v_admin_emails LOOP
    PERFORM public.enqueue_email('transactional_emails', jsonb_build_object(
      'to', v_email,
      'subject', '[SECURITY ' || upper(NEW.severity) || '] ' || NEW.title,
      'html', '<h2>Security alert</h2><p><b>' || NEW.title || '</b></p><p>' || COALESCE(NEW.body,'') || '</p><pre>' || COALESCE(NEW.payload::text,'{}') || '</pre>',
      'text', NEW.title || E'\n\n' || COALESCE(NEW.body,'') || E'\n\n' || COALESCE(NEW.payload::text,'{}'),
      'template_name', 'security_alert',
      'source', NEW.source,
      'alert_id', NEW.id
    ));
  END LOOP;
  UPDATE public.security_alerts SET emailed_at = now() WHERE id = NEW.id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_alert() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_security_alerts_email ON public.security_alerts;
CREATE TRIGGER trg_security_alerts_email
  AFTER INSERT ON public.security_alerts
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_alert();

-- 9. Seed quarantine keys we know about (idempotent)
INSERT INTO public.system_quarantine(key, active, reason) VALUES
  ('chat_messages', false, NULL),
  ('feedback', false, NULL),
  ('dat_mint', false, NULL),
  ('ledger_writes', false, NULL)
ON CONFLICT (key) DO NOTHING;
