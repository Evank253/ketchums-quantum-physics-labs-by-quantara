// Server-only auth helpers shared by ledger write fns. Returning structured
// 401 instead of throwing keeps anonymous callers from blanking the screen.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type AuthRequiredError = {
  ok: false;
  code: "AUTH_REQUIRED";
  status: 401;
  message: string;
};

export const AUTH_REQUIRED: AuthRequiredError = {
  ok: false,
  code: "AUTH_REQUIRED",
  status: 401,
  message: "Sign in required to write to the public ledger.",
};

/** Validate a bearer token from a Request without throwing. Returns the user
 *  id on success, or null on missing/invalid auth (with safe metadata log). */
export async function validateBearerFromRequest(
  fnName: string,
  request: Request | undefined,
): Promise<string | null> {
  const authHeader = request?.headers?.get?.("authorization") ?? null;
  const ua = request?.headers?.get?.("user-agent") ?? null;
  const reqId = request?.headers?.get?.("x-request-id") ?? null;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn(
      "[ledger-auth] missing bearer",
      JSON.stringify({
        fn: fnName,
        method: request?.method,
        url: request?.url,
        has_auth_header: Boolean(authHeader),
        has_ua: Boolean(ua),
        request_id: reqId,
      }),
    );
    return null;
  }
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anon) {
    console.error("[ledger-auth] missing supabase env");
    return null;
  }
  const client = createClient<Database>(url, anon, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    console.warn(
      "[ledger-auth] invalid token",
      JSON.stringify({ fn: fnName, reason: error?.message ?? "no claims", request_id: reqId }),
    );
    return null;
  }
  return data.claims.sub as string;
}
