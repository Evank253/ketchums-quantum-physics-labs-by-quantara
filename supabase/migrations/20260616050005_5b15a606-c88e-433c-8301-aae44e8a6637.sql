
-- Trigger-only functions: not meant to be invoked directly
REVOKE EXECUTE ON FUNCTION public.block_run_card_mutation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_owner_roles() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_trial_subscription() FROM PUBLIC, anon, authenticated;

-- Server-only helpers (called via service role)
REVOKE EXECUTE ON FUNCTION public.check_user_quota(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_user_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- has_role is invoked by RLS policies; keep authenticated execute for policy evaluation
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- Also set a fixed search_path on touch_updated_at / block_run_card_mutation
-- (already SET in source, but ensure applied at DB level)
ALTER FUNCTION public.block_run_card_mutation() SET search_path = public;
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
ALTER FUNCTION public.grant_owner_roles() SET search_path = public;
ALTER FUNCTION public.create_trial_subscription() SET search_path = public;
