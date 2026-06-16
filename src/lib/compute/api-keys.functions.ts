// API-key management for institution role. Keys are returned ONCE; only the
// SHA-256 hash is stored in the database.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sha256Hex } from "./hash";

function randomKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `kqp_live_${hex}`;
}

export const issueApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label: string }) => {
    if (!input?.label || typeof input.label !== "string") throw new Error("label required");
    return { label: input.label.slice(0, 80) };
  })
  .handler(async ({ data, context }) => {
    // Verify role
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "institution");
    if (!roles || roles.length === 0) throw new Error("Institution role required");

    const plain = randomKey();
    const hash = await sha256Hex(plain);
    const { error } = await context.supabase
      .from("institution_api_keys")
      .insert({ user_id: context.userId, key_hash: hash, label: data.label });
    if (error) throw new Error(error.message);
    // Returned once. Never stored or logged.
    return { apiKey: plain, label: data.label };
  });

export const listApiKeys = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("institution_api_keys")
      .select("id, label, last_used_at, revoked_at, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { keys: data ?? [] };
  });

export const revokeApiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => ({ id: input.id }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("institution_api_keys")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
