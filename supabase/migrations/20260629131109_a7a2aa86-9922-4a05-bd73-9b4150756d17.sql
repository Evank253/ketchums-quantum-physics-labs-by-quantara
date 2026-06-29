
-- pgcrypto for symmetric encryption of invention reports
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 1. INBOX MESSAGING
-- =========================================================
CREATE TABLE public.inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX inbox_messages_recipient_idx ON public.inbox_messages(recipient_id, created_at DESC);
CREATE INDEX inbox_messages_sender_idx ON public.inbox_messages(sender_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.inbox_messages TO authenticated;
GRANT ALL ON public.inbox_messages TO service_role;

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own inbox (received or sent)"
  ON public.inbox_messages FOR SELECT TO authenticated
  USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "Users send as themselves"
  ON public.inbox_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND sender_id <> recipient_id);

CREATE POLICY "Recipient may mark read"
  ON public.inbox_messages FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

CREATE TRIGGER inbox_messages_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.inbox_messages
  FOR EACH ROW EXECUTE FUNCTION public.audit_row();

-- =========================================================
-- 2. ADMIN RUN CONTROLS (system_settings)
-- =========================================================
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read settings"
  ON public.system_settings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write settings"
  ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.system_settings(key, value) VALUES
  ('inventions_enabled', 'true'::jsonb),
  ('inventions_min_interval_seconds', '300'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TRIGGER system_settings_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_row();

-- =========================================================
-- 3. ENCRYPT DISCOVERY STORAGE
-- =========================================================
ALTER TABLE public.owner_inventions
  ADD COLUMN IF NOT EXISTS report_md_enc BYTEA,
  ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- Security-definer helpers: caller must be admin and supply the runtime key.
CREATE OR REPLACE FUNCTION public.invention_encrypt(_plaintext TEXT, _key TEXT)
RETURNS BYTEA
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  IF _key IS NULL OR length(_key) < 32 THEN
    RAISE EXCEPTION 'invalid key';
  END IF;
  RETURN pgp_sym_encrypt(_plaintext, _key);
END $$;

CREATE OR REPLACE FUNCTION public.invention_decrypt(_cipher BYTEA, _key TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  IF _cipher IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(_cipher, _key);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END $$;

REVOKE EXECUTE ON FUNCTION public.invention_encrypt(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.invention_decrypt(BYTEA, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invention_encrypt(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.invention_decrypt(BYTEA, TEXT) TO service_role;

-- Audit trigger on owner_inventions
DROP TRIGGER IF EXISTS owner_inventions_audit ON public.owner_inventions;
CREATE TRIGGER owner_inventions_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.owner_inventions
  FOR EACH ROW EXECUTE FUNCTION public.audit_row();
