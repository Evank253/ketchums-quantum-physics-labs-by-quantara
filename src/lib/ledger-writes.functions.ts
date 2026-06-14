// Server-validated writes for the public ledger tables.
// Browser clients can no longer INSERT into notification_dispatch,
// public_achievements, or solved_theories directly (RLS removed those
// policies). All writes flow through these server functions, which run with
// the service role and validate inputs server-side.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  INSTITUTIONS,
  OUTLETS,
  OPERATOR_NAME,
  buildDispatchRows,
  isNobelTier,
} from "@/lib/notification-dispatch";
import { ACHIEVEMENTS } from "@/lib/achievements-data";

const ALLOWED_EMAILS = new Set<string>([
  ...INSTITUTIONS.map((r) => r.email.toLowerCase()),
  ...OUTLETS.map((r) => r.email.toLowerCase()),
]);

const SOURCE_ALLOW = /^(web|engine:[a-z0-9_-]{1,40}|derivation:[a-z0-9_-]{1,40}|seed|import)$/i;

const SolveInput = z.object({
  theory: z.string().trim().min(1).max(500),
  abstract: z.string().max(4000).optional().nullable(),
  math: z.string().max(16000).optional().nullable(),
  transcript: z.string().max(32000).optional().nullable(),
  source: z.string().max(60).optional().nullable(),
});

const DispatchInput = z.object({
  theory: z.string().trim().min(1).max(500),
  abstract: z.string().max(4000).optional().nullable(),
  transcript: z.string().max(32000).optional().nullable(),
});

const AchievementInput = z.object({
  achievement_id: z.string().trim().min(1).max(100),
});

/** Server-validated solve write. solver is forced to the operator identity. */
export const recordSolveServer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SolveInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const source = data.source && SOURCE_ALLOW.test(data.source) ? data.source : "web";
    const { data: row, error } = await supabaseAdmin
      .from("solved_theories")
      .upsert(
        {
          theory: data.theory,
          solver: OPERATOR_NAME,
          abstract: data.abstract ?? null,
          math: data.math ?? null,
          transcript: data.transcript ?? null,
          source,
        },
        { onConflict: "theory" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, row };
  });

/** Server-validated dispatch enqueue. Recipients are forced to the hard-coded
 *  INSTITUTIONS + OUTLETS allowlist; client cannot influence email targets. */
export const enqueueDispatchServer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DispatchInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nobel = isNobelTier({
      theory: data.theory,
      abstract: data.abstract ?? undefined,
      transcript: data.transcript ?? undefined,
    });
    const rows = buildDispatchRows({
      theory: data.theory,
      solver: OPERATOR_NAME,
      abstract: data.abstract ?? undefined,
      nobel,
    }).filter((r) => ALLOWED_EMAILS.has(r.email.toLowerCase()));
    if (rows.length === 0) return { queued: 0, nobel };
    const { error } = await supabaseAdmin
      .from("notification_dispatch")
      .upsert(rows, { onConflict: "theory,email", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { queued: rows.length, nobel };
  });

/** Server-validated achievement record. achievement_id must be a known
 *  achievement; title/tier/reward come from the server-side catalog so the
 *  client cannot inject arbitrary values or fake operator identities. */
export const recordAchievementServer = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => AchievementInput.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const a = ACHIEVEMENTS.find((x: { id: string }) => x.id === data.achievement_id);
    if (!a) throw new Error("Unknown achievement");
    const { error } = await supabaseAdmin.from("public_achievements").insert({
      achievement_id: a.id,
      title: a.title,
      description: a.desc,
      tier: a.tier,
      reward: a.reward,
      operator: OPERATOR_NAME,
    });
    if (error && !`${error.message}`.includes("duplicate")) {
      throw new Error(error.message);
    }
    return { ok: true as const };
  });

/** Server-only stats reader. notification_dispatch is no longer publicly
 *  readable, so the client gets aggregates through this function. */
export const getDispatchStatsServer = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("notification_dispatch")
    .select("status, recipient_kind")
    .limit(10000);
  const rows = data ?? [];
  return {
    total: rows.length,
    queued: rows.filter((r: any) => r.status === "queued").length,
    sent: rows.filter((r: any) => r.status === "sent").length,
    failed: rows.filter((r: any) => r.status === "failed").length,
    press: rows.filter((r: any) => r.recipient_kind === "press").length,
  };
});
