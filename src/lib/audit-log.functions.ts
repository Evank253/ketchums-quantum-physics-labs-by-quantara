import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ListInput = z.object({
  limit: z.number().int().min(1).max(500).optional(),
  table: z.string().max(128).optional(),
  op: z.enum(["INSERT", "UPDATE", "DELETE"]).optional(),
  actorId: z.string().uuid().optional(),
  since: z.string().datetime().optional(),
});

export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("audit_log")
      .select("id,table_name,op,actor_id,row_id,old_data,new_data,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.table) q = q.eq("table_name", data.table);
    if (data.op) q = q.eq("op", data.op);
    if (data.actorId) q = q.eq("actor_id", data.actorId);
    if (data.since) q = q.gte("created_at", data.since);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Distinct table names for filter UI (cheap admin convenience query)
    const { data: tables } = await supabaseAdmin
      .from("audit_log")
      .select("table_name")
      .limit(1000);
    const tableNames = Array.from(
      new Set((tables ?? []).map((t) => t.table_name).filter(Boolean)),
    ).sort();

    return { entries: rows ?? [], tables: tableNames };
  });
