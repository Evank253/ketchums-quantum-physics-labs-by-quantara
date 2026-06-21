// Admin-only: read pg_cron schedule + recent run history, plus on-demand triggers.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

export const getCronStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [jobsRes, runsRes] = await Promise.all([
      (supabaseAdmin as any).rpc("admin_list_cron_jobs"),
      (supabaseAdmin as any).rpc("admin_list_cron_runs", { _limit: 50 }),
    ]);
    return {
      jobs: (jobsRes.data as any[]) ?? [],
      runs: (runsRes.data as any[]) ?? [],
      jobsError: jobsRes.error?.message ?? null,
      runsError: runsRes.error?.message ?? null,
      generatedAt: new Date().toISOString(),
    };
  });

export const triggerCronTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { task: "data-cleaner" | "wiz-sync" | "healer" | "self-test" }) => {
    if (!["data-cleaner", "wiz-sync", "healer", "self-test"].includes(d?.task))
      throw new Error("Invalid task");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    switch (data.task) {
      case "data-cleaner": {
        const { runCleanerBatch } = await import("@/lib/data-cleaner.server");
        return { task: data.task, result: await runCleanerBatch() };
      }
      case "wiz-sync": {
        const { syncWizFindings } = await import("@/lib/wiz-sync.server");
        return { task: data.task, result: await syncWizFindings() };
      }
      case "healer": {
        const { runHealer } = await import("@/lib/nexus-healer.server");
        return { task: data.task, result: await runHealer(supabaseAdmin as any) };
      }
      case "self-test": {
        const { runSelfTest } = await import("@/lib/nexus-healer.server");
        return { task: data.task, result: await runSelfTest(supabaseAdmin as any) };
      }
    }
  });
