// Admin-only server fns to list & manage owner inventions, plus runtime controls.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listOwnerInventions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { decryptReport } = await import("@/lib/owner-inventions.server");
    const { data, error } = await (supabaseAdmin as any)
      .from("owner_inventions")
      .select(
        "id,category,title,summary,civilization,report_md,report_md_enc,emailed_at,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const rows = await Promise.all(
      (data ?? []).map(async (r: any) => ({
        id: r.id,
        category: r.category,
        title: r.title,
        summary: r.summary,
        civilization: r.civilization,
        emailed_at: r.emailed_at,
        created_at: r.created_at,
        report_md:
          r.report_md ?? (await decryptReport(supabaseAdmin as any, r.report_md_enc)) ?? "",
      })),
    );
    return { rows };
  });

export const discoverNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { discoverInvention } = await import("@/lib/owner-inventions.server");
    return await discoverInvention(supabaseAdmin as any, { force: true, trigger: "admin" });
  });

export const getRunSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("system_settings")
      .select("key,value")
      .in("key", ["inventions_enabled", "inventions_min_interval_seconds"]);
    const map: Record<string, any> = {};
    for (const r of data ?? []) map[r.key] = r.value;
    return {
      enabled: map.inventions_enabled !== false,
      interval_seconds: Number(map.inventions_min_interval_seconds ?? 300),
    };
  });

export const updateRunSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { enabled?: boolean; interval_seconds?: number }) => d)
  .handler(async ({ context, data }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const updates: { key: string; value: any; updated_by: string; updated_at: string }[] = [];
    const now = new Date().toISOString();
    if (typeof data.enabled === "boolean") {
      updates.push({
        key: "inventions_enabled",
        value: data.enabled,
        updated_by: context.userId,
        updated_at: now,
      });
    }
    if (typeof data.interval_seconds === "number") {
      const v = Math.max(60, Math.min(86400, Math.floor(data.interval_seconds)));
      updates.push({
        key: "inventions_min_interval_seconds",
        value: v,
        updated_by: context.userId,
        updated_at: now,
      });
    }
    for (const u of updates) {
      await (supabaseAdmin as any).from("system_settings").upsert(u, { onConflict: "key" });
    }
    return { ok: true };
  });
