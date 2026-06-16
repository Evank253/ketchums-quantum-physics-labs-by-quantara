-- Auto-promote owner emails to admin + institution on signup, and backfill if they already exist.
CREATE OR REPLACE FUNCTION public.grant_owner_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) IN ('evan.ketchum2026@outlook.com','evan.ketchum2000@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'institution')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_owner ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_owner
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_owner_roles();

-- Backfill in case the accounts already exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) IN ('evan.ketchum2026@outlook.com','evan.ketchum2000@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'institution'::app_role FROM auth.users
WHERE lower(email) IN ('evan.ketchum2026@outlook.com','evan.ketchum2000@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;