import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin only");
}

export const getSecurityReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { verifyDatChain } = await import("@/lib/dat-mint.functions");

    const [findings, wizLogs, cleanerLogs, recentAlerts, dat] = await Promise.all([
      supabaseAdmin.from("security_findings")
        .select("source, severity, status, title, detected_at")
        .order("detected_at", { ascending: false }).limit(200),
      supabaseAdmin.from("admin_logs").select("*")
        .eq("kind", "security_wiz_sync").order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("admin_logs").select("*")
        .eq("kind", "data_cleaner").order("created_at", { ascending: false }).limit(10),
      supabaseAdmin.from("security_alerts").select("severity, title, created_at, read_at")
        .order("created_at", { ascending: false }).limit(20),
      verifyDatChain(),
    ]);

    const f = findings.data ?? [];
    const bySev = { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>;
    const byStatus = { open: 0, fixing: 0, fixed: 0, ignored: 0, quarantined: 0 } as Record<string, number>;
    let wizCount = 0;
    for (const r of f) {
      if (r.severity in bySev) bySev[r.severity]++;
      if (r.status in byStatus) byStatus[r.status]++;
      if (r.source === "wiz") wizCount++;
    }

    return {
      generatedAt: new Date().toISOString(),
      findings: {
        total: f.length,
        wiz: wizCount,
        bySeverity: bySev,
        byStatus,
        recent: f.slice(0, 25),
      },
      wizSync: wizLogs.data ?? [],
      cleaner: cleanerLogs.data ?? [],
      alerts: recentAlerts.data ?? [],
      dat,
    };
  });

export const emailSecurityReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userData } = await context.supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) throw new Error("No email on file");
    await supabaseAdmin.rpc("enqueue_email", {
      queue_name: "transactional_emails",
      payload: {
        to: email,
        subject: "[KQPL] Security report",
        html: `<h2>Security report</h2><p>View the dashboard at <a href="https://ketchumsquantumphysicslab.live/admin/security/report">/admin/security/report</a>.</p>`,
        text: "Security report — visit /admin/security/report",
        template_name: "security_report",
      },
    });
    return { ok: true as const, queuedTo: email };
  });
