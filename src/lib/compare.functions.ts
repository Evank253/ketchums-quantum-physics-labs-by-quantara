// Public read-only server fns powering /compare and /run-card/$runId.
// Uses service-role internally but ONLY projects safe columns.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getCompareTable = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: jobs, error } = await supabaseAdmin
    .from("compute_jobs")
    .select("id, model, engine_result, codata_result, literature_result, sigma, verdict, completed_at")
    .eq("status", "complete")
    .eq("verdict", "PASS")
    .order("completed_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  const ids = (jobs ?? []).map((j: any) => j.id);
  let runMap = new Map<string, string>();
  if (ids.length) {
    const { data: rc } = await supabaseAdmin
      .from("run_cards")
      .select("job_id, run_id")
      .in("job_id", ids);
    runMap = new Map((rc ?? []).map((r: any) => [r.job_id, r.run_id]));
  }

  const rows = (jobs ?? []).map((j: any) => {
    const eng = j.engine_result ?? {};
    const cod = j.codata_result ?? {};
    const residual = (eng.value ?? 0) - (cod.value ?? 0);
    return {
      runId: runMap.get(j.id) ?? null,
      jobId: j.id,
      model: j.model,
      symbol: eng.symbol ?? cod.symbol ?? "?",
      theory: eng.method ?? "—",
      codataValue: cod.value ?? null,
      codataUnc: cod.uncertainty ?? null,
      computedValue: eng.value ?? null,
      computedUnc: eng.uncertainty ?? null,
      residual,
      sigma: j.sigma,
      verdict: j.verdict,
      completedAt: j.completed_at,
      reference: cod.reference ?? null,
    };
  });
  return { rows };
});

export const getPublicRunCard = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ runId: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: card, error } = await supabaseAdmin
      .from("run_cards")
      .select("run_id, job_id, input_hash, output_hash, backend_version, seed, payload, created_at")
      .eq("run_id", data.runId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!card) return { ok: false as const, reason: "not_found" };

    const { data: job } = await supabaseAdmin
      .from("compute_jobs")
      .select("model, engine_result, codata_result, literature_result, sigma, verdict, completed_at")
      .eq("id", card.job_id)
      .maybeSingle();

    const { data: mint } = await supabaseAdmin
      .from("dat_mint_audit")
      .select("status, result, created_at")
      .eq("action", `auto-mint:${data.runId}`)
      .maybeSingle();

    return {
      ok: true as const,
      card: {
        runId: card.run_id,
        inputHash: card.input_hash,
        outputHash: card.output_hash,
        backendVersion: card.backend_version,
        seed: card.seed,
        payload: card.payload,
        createdAt: card.created_at,
      },
      job: job ?? null,
      mint: mint ?? null,
    };
  });
