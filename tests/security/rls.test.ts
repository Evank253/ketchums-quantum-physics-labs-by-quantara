/**
 * @vitest-environment node
 *
 * RLS regression suite — verifies the anon Data API cannot read tables that
 * MUST stay private (email plumbing, audit log, admin log, owner inventions,
 * notification dispatch). Skips automatically when the public Supabase URL
 * is not configured (e.g. offline CI).
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const DENY_TABLES = [
  "email_unsubscribe_tokens",
  "suppressed_emails",
  "email_send_log",
  "email_send_state",
  "admin_logs",
  "audit_log",
  "owner_inventions",
  "notification_dispatch",
  "system_quarantine",
  "dat_claims",
  "dat_mint_audit",
  "security_findings",
] as const;

describe.skipIf(!URL || !KEY)("RLS — anonymous Data API is denied on sensitive tables", () => {
  const anon = createClient(URL!, KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  for (const table of DENY_TABLES) {
    it(`anon SELECT on ${table} returns no rows`, async () => {
      const { data, error } = await anon.from(table as any).select("*").limit(1);
      // Either an explicit RLS denial, or zero visible rows.
      if (error) {
        expect(error.message.toLowerCase()).toMatch(/permission|rls|not authorized|denied|policy/);
      } else {
        expect(data ?? []).toEqual([]);
      }
    });

    it(`anon INSERT on ${table} is rejected`, async () => {
      const { error } = await anon.from(table as any).insert({ id: "x" } as any);
      expect(error).not.toBeNull();
    });
  }
});

describe.skipIf(!URL || !KEY)("RLS — chat_messages cannot be inserted by anon (and impersonation is blocked)", () => {
  const anon = createClient(URL!, KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  it("anon INSERT on chat_messages is rejected (insert is server-side only now)", async () => {
    const { error } = await anon.from("chat_messages").insert({
      user_id: "00000000-0000-0000-0000-000000000000",
      display_name: "Admin",
      body: "spoof attempt",
    });
    expect(error).not.toBeNull();
  });
});
