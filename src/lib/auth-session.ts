// Browser-safe helper: is there a live Supabase session right now?
// Centralizes the guard used before invoking protected ledger server fns,
// so anonymous visitors don't trigger 401s / blank screens.
import { supabase } from "@/integrations/supabase/client";

export async function hasActiveSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session?.access_token);
  } catch {
    return false;
  }
}

export function isAuthRequired(res: unknown): res is { ok: false; code: "AUTH_REQUIRED"; status: 401 } {
  return Boolean(
    res &&
      typeof res === "object" &&
      (res as any).ok === false &&
      (res as any).code === "AUTH_REQUIRED",
  );
}
