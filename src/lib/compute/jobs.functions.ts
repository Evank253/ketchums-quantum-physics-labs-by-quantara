// Compute-job pipeline server functions.
// All authenticated — no public access. Service-role admin client is loaded
// inside .handler() bodies only (never at module scope).

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { codataFor } from "./codata";
import { literatureFor } from "./literature";
import { sigmaDeviation, verdictFor } from "./sigma";
import { hashJson } from "./hash";
import { runQed, QED_MODEL_ID } from "./engines/qed";
import { BACKEND_VERSION, type ComputeResult } from "./result-types";

type SubmitInput = { model: string; inputs: Record<string, unknown> };
type Json = any;

// ─── Submit + run (single-shot for MVP) ─────────────────────────────────────
export const submitComputeJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: SubmitInput) => {
    if (!input || typeof input !== "object") throw new Error("invalid input");
    if (typeof input.model !== "string") throw new Error("model required");
    return { model: input.model, inputs: input.inputs ?? {} };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1) Insert pending job (RLS-checked as the user)
    const { data: row, error: insErr } = await supabase
      .from("compute_jobs")
      .insert({ user_id: userId, model: data.model, inputs: data.inputs as Json, status: "running" })
      .select("id")
      .single();
    if (insErr || !row) throw new Error(insErr?.message ?? "could not create job");

    const jobId = row.id;

    try {
      // 2) Engine
      let engineResult: ComputeResult;
      if (data.model === QED_MODEL_ID) {
        engineResult = runQed(data.inputs as { loops?: number; precision?: number });
      } else {
        throw new Error(`unknown model: ${data.model}`);
      }

      // 3) CODATA + literature lookups
      const codataC = codataFor(engineResult.symbol);
      const litC = literatureFor(engineResult.symbol);
      const codataResult: ComputeResult | null = codataC
        ? {
            symbol: codataC.symbol,
            value: codataC.value,
            uncertainty: codataC.uncertainty,
            source: "codata",
            method: "CODATA 2022 recommended value",
            reference: codataC.source,
            timestamp: new Date().toISOString(),
          }
        : null;
      const literatureResult: ComputeResult | null = litC
        ? {
            symbol: litC.symbol,
            value: litC.value,
            uncertainty: litC.uncertainty,
            source: "literature",
            method: "published benchmark",
            reference: litC.citation,
            timestamp: new Date().toISOString(),
          }
        : null;

      // 4) Sigma vs CODATA (uncertainty = quadrature of engine + reference)
      const sigma = codataResult
        ? sigmaDeviation(
            engineResult.value,
            codataResult.value,
            Math.sqrt(
              engineResult.uncertainty ** 2 + codataResult.uncertainty ** 2,
            ),
          )
        : Infinity;
      const verdict = verdictFor(sigma);

      // 5) Persist results + run card (run_card uses admin client for INSERT
      //    because the table has no INSERT policy for authenticated)
      const completedAt = new Date().toISOString();
      const inputHash = await hashJson({ model: data.model, inputs: data.inputs });
      const outputHash = await hashJson({ engineResult, codataResult, literatureResult });
      const runId = `RC-${jobId.slice(0, 8)}-${outputHash.slice(0, 8)}`;

      await supabaseAdmin
        .from("compute_jobs")
        .update({
          status: "complete",
          engine_result: engineResult as Json,
          codata_result: codataResult as Json,
          literature_result: literatureResult as Json,
          sigma,
          verdict,
          completed_at: completedAt,
        })
        .eq("id", jobId);

      await supabaseAdmin.from("run_cards").insert({
        job_id: jobId,
        run_id: runId,
        user_id: userId,
        input_hash: inputHash,
        output_hash: outputHash,
        backend_version: BACKEND_VERSION,
        seed: null,
        payload: { engineResult, codataResult, literatureResult, sigma, verdict } as Json,
      });

      // 6) Bump usage counter (idempotent upsert per month)
      const periodStart = new Date().toISOString().slice(0, 7) + "-01";
      const { data: existing } = await supabaseAdmin
        .from("usage_counters")
        .select("id, runs_count")
        .eq("user_id", userId)
        .eq("period_start", periodStart)
        .maybeSingle();
      if (existing) {
        await supabaseAdmin
          .from("usage_counters")
          .update({ runs_count: existing.runs_count + 1 })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin
          .from("usage_counters")
          .insert({ user_id: userId, period_start: periodStart, runs_count: 1 });
      }

      return { ok: true as const, jobId, runId, sigma, verdict };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabaseAdmin
        .from("compute_jobs")
        .update({ status: "failed", error: msg, completed_at: new Date().toISOString() })
        .eq("id", jobId);
      return { ok: false as const, jobId, error: msg };
    }
  });

// ─── Read APIs ─────────────────────────────────────────────────────────────
export const listMyJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) => ({ limit: Math.min(input?.limit ?? 50, 200) }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("compute_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { jobs: (rows ?? []) as Json };
  });

export const getMyUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const periodStart = new Date().toISOString().slice(0, 7) + "-01";
    const { data: row } = await context.supabase
      .from("usage_counters")
      .select("runs_count, period_start")
      .eq("user_id", context.userId)
      .eq("period_start", periodStart)
      .maybeSingle();
    return {
      periodStart,
      runsCount: row?.runs_count ?? 0,
    };
  });

export const listMyRunCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) => ({ limit: Math.min(input?.limit ?? 50, 200) }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("run_cards")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    return { runCards: (rows ?? []) as Json };
  });
