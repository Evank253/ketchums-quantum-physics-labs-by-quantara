// Admin-only server functions for the Security Operations dashboard.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listSecurityDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [findings, alerts, audit, quarantine] = await Promise.all([
      supabaseAdmin
        .from("security_findings")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("security_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin
        .from("system_quarantine")
        .select("*")
        .order("key"),
    ]);
    return {
      findings: findings.data ?? [],
      alerts: alerts.data ?? [],
      audit: audit.data ?? [],
      quarantine: quarantine.data ?? [],
    };
  });

export const markAlertRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("security_alerts")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setQuarantine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        key: z.string().min(1).max(60),
        active: z.boolean(),
        reason: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const update = data.active
      ? {
          active: true,
          reason: data.reason ?? "manual",
          triggered_by: `admin:${context.userId}`,
          triggered_at: new Date().toISOString(),
          cleared_at: null,
        }
      : {
          active: false,
          reason: data.reason ?? null,
          cleared_at: new Date().toISOString(),
        };
    const { error } = await supabaseAdmin
      .from("system_quarantine")
      .upsert({ key: data.key, ...update }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const runHealerNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runHealer } = await import("./nexus-healer.server");
    return await runHealer(supabaseAdmin as any);
  });

export const runSelfTestNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runSelfTest } = await import("./nexus-healer.server");
    return await runSelfTest(supabaseAdmin as any);
  });
