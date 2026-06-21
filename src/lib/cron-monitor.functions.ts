// Admin-only: read pg_cron schedule + recent run history.
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

    const jobsRes: any = await (supabaseAdmin as any).rpc("exec_sql", { sql: "" }).then(
      () => null,
      () => null,
    );
    // Use raw SQL via PostgREST is not possible; query cron schemas through views we own.
    // We expose two helper functions below via migration. As a fallback, return arrays from
    // pg_cron's cron schema using `from('cron.job')` style won't work either; so we read
    // through a SECURITY DEFINER wrapper view if present, else return empty.
    void jobsRes;

    const [{ data: jobs }, { data: runs }] = await Promise.all([
      (supabaseAdmin as any).from("cron_jobs_view").select("*").order("jobname"),
      (supabaseAdmin as any).from("cron_runs_view").select("*").order("start_time", { ascending: false }).limit(50),
    ]);

    return {
      jobs: (jobs as any[]) ?? [],
      runs: (runs as any[]) ?? [],
      generatedAt: new Date().toISOString(),
    };
  });
