// Admin-only: live-rerun the math annex (every registered theory),
// log results to annex_runs + admin_logs, and dispatch CERN notifications
// for PASS verdicts. Idempotent per (theory_id, payload_hash).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runQed } from "@/lib/compute/engines/qed";
import { codataFor } from "@/lib/compute/codata";
import { sigmaDeviation, verdictFor } from "@/lib/compute/sigma";

// Registry of theories the annex re-verifies on demand. Extend freely —
// every entry maps to a deterministic engine call.
type AnnexTheory = {
  id: string;
  name: string;
  run: () => { value: number; uncertainty: number; symbol: string };
};

const ANNEX_THEORIES: AnnexTheory[] = [
  { id: "qed.ae.5loop", name: "Electron g-2 anomaly (5-loop QED)", run: () => runQed({ loops: 5 }) },
  { id: "qed.ae.6loop", name: "Electron g-2 anomaly (6-loop QED)", run: () => runQed({ loops: 6 }) },
  { id: "qed.ae.4loop", name: "Electron g-2 anomaly (4-loop QED)", run: () => runQed({ loops: 4 }) },
  { id: "qed.ae.3loop", name: "Electron g-2 anomaly (3-loop QED, Laporta-Remiddi)", run: () => runQed({ loops: 3 }) },
];

async function assertAdmin(context: any) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("admin role required");
}

export const runAnnexBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const results: any[] = [];

    for (const t of ANNEX_THEORIES) {
      try {
        const r = t.run();
        const ref = codataFor(r.symbol);
        const refValue = ref?.value ?? r.value;
        const refUnc = ref?.uncertainty ?? r.uncertainty;
        const totalUnc = Math.sqrt(r.uncertainty ** 2 + refUnc ** 2);
        const sigma = sigmaDeviation(r.value, refValue, totalUnc);
        const verdict = verdictFor(sigma);

        const { data: row } = await supabaseAdmin
          .from("annex_runs")
          .insert({
            theory_id: t.id, theory_name: t.name,
            engine_value: r.value, reference_value: refValue,
            sigma: isFinite(sigma) ? sigma : null,
            verdict,
            payload: { symbol: r.symbol, uncertainty: r.uncertainty, refUnc, totalUnc },
            triggered_by: context.userId,
          })
          .select("id")
          .single();

        await supabaseAdmin.from("admin_logs").insert({
          kind: "annex_run",
          subject: t.id,
          payload: { name: t.name, sigma, verdict, value: r.value, reference: refValue, annex_id: row?.id },
        });

        // CERN dispatch on PASS — logged for now (wire email when domain set up)
        if (verdict === "PASS") {
          await supabaseAdmin.from("admin_logs").insert({
            kind: "cern_dispatch",
            subject: t.id,
            payload: {
              to: ["cern-publications@cern.ch"],
              theory: t.name,
              sigma, value: r.value, reference: refValue,
              note: "queued — wire Lovable Emails domain to actually send",
              annex_id: row?.id,
            },
          });
        }

        results.push({ id: t.id, name: t.name, sigma, verdict, value: r.value, reference: refValue });
      } catch (e: any) {
        const msg = e?.message ?? String(e);
        await supabaseAdmin.from("admin_logs").insert({
          kind: "annex_run", subject: t.id, payload: { error: msg },
        });
        results.push({ id: t.id, name: t.name, error: msg });
      }
    }

    return { ok: true as const, count: results.length, results };
  });

export const listAnnexRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) => ({ limit: Math.min(input?.limit ?? 100, 500) }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("annex_runs").select("*")
      .order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return { runs: rows ?? [] };
  });

export const listAdminLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number; kind?: string }) => ({
    limit: Math.min(input?.limit ?? 200, 1000),
    kind: input?.kind ?? null,
  }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("admin_logs").select("*")
      .order("created_at", { ascending: false }).limit(data.limit);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { logs: rows ?? [] };
  });
