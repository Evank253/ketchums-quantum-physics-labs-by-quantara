// Compute-job pipeline server functions.
// All authenticated. Service-role admin client loaded inside handlers only.

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

// ─── Submit + run ──────────────────────────────────────────────────────────
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

    // ── Quota gate (trial/plan + monthly cap) ──
    const { data: q, error: qErr } = await supabaseAdmin.rpc("check_user_quota", {
      _user_id: userId,
    });
    if (qErr) throw new Error(qErr.message);
    const quota = Array.isArray(q) ? q[0] : q;
    if (quota && !quota.allowed) {
      throw new Error(quota.reason || "Quota exceeded — subscribe to continue.");
    }

    // ── 1) Insert pending job ──
    const { data: row, error: insErr } = await supabase
      .from("compute_jobs")
      .insert({ user_id: userId, model: data.model, inputs: data.inputs as Json, status: "pending" })
      .select("id")
      .single();
    if (insErr || !row) throw new Error(insErr?.message ?? "could not create job");
    const jobId = row.id;

    // Flip to running (service-role so it can't be blocked by RLS edge cases)
    await supabaseAdmin.from("compute_jobs").update({ status: "running" }).eq("id", jobId);

    // ── Cold-compute warmup-cache lookup (AI cleaner fuels this) ──
    try {
      const { warmupCacheKey } = await import("@/lib/data-cleaner.server");
      const ck = warmupCacheKey(data.model, data.inputs);
      const { data: cached } = await supabaseAdmin
        .from("compute_warmup_cache")
        .select("payload, hit_count")
        .eq("cache_key", ck)
        .maybeSingle();
      if (cached?.payload) {
        await supabaseAdmin.from("compute_warmup_cache")
          .update({ hit_count: (cached.hit_count ?? 0) + 1 })
          .eq("cache_key", ck);
      }
    } catch { /* cache miss is fine */ }


    try {
      // ── 2) Engine ──
      let engineResult: ComputeResult;
      if (data.model === QED_MODEL_ID) {
        engineResult = runQed(data.inputs as { loops?: number; precision?: number });
      } else {
        throw new Error(`unknown model: ${data.model}`);
      }

      // ── 3) CODATA + literature ──
      const codataC = codataFor(engineResult.symbol);
      const litC = literatureFor(engineResult.symbol);
      const codataResult: ComputeResult | null = codataC
        ? {
            symbol: codataC.symbol, value: codataC.value, uncertainty: codataC.uncertainty,
            source: "codata", method: "CODATA 2022 recommended value",
            reference: codataC.source, timestamp: new Date().toISOString(),
          }
        : null;
      const literatureResult: ComputeResult | null = litC
        ? {
            symbol: litC.symbol, value: litC.value, uncertainty: litC.uncertainty,
            source: "literature", method: "published benchmark",
            reference: litC.citation, timestamp: new Date().toISOString(),
          }
        : null;

      const sigma = codataResult
        ? sigmaDeviation(
            engineResult.value,
            codataResult.value,
            Math.sqrt(engineResult.uncertainty ** 2 + codataResult.uncertainty ** 2),
          )
        : Infinity;
      const verdict = verdictFor(sigma);

      // ── 4) Persist + run card ──
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
          sigma: isFinite(sigma) ? sigma : null,
          verdict, completed_at: completedAt,
        })
        .eq("id", jobId);

      await supabaseAdmin.from("run_cards").insert({
        job_id: jobId, run_id: runId, user_id: userId,
        input_hash: inputHash, output_hash: outputHash,
        backend_version: BACKEND_VERSION, seed: null,
        payload: { engineResult, codataResult, literatureResult, sigma: isFinite(sigma) ? sigma : null, verdict } as Json,
      });

      // ── 5) Usage counter ──
      const periodStart = new Date().toISOString().slice(0, 7) + "-01";
      const { data: existing } = await supabaseAdmin
        .from("usage_counters")
        .select("id, runs_count")
        .eq("user_id", userId)
        .eq("period_start", periodStart)
        .maybeSingle();
      if (existing) {
        await supabaseAdmin.from("usage_counters").update({ runs_count: existing.runs_count + 1 }).eq("id", existing.id);
      } else {
        await supabaseAdmin.from("usage_counters").insert({ user_id: userId, period_start: periodStart, runs_count: 1 });
      }

      // ── 6) Auto-mint to treasury on PASS verdict (idempotent by run_id) ──
      let mintInfo: { ok: boolean; txHash?: string; error?: string } | null = null;
      if (verdict === "PASS" && isFinite(sigma) && sigma < 1) {
        try {
          const mint = await import("@/lib/dat-mint.server");
          const { TREASURY_WALLET } = await import("@/lib/treasury");
          const cfg = mint.loadMintConfig();
          if (cfg.ok) {
            // Idempotency: skip if a mint with this run_id was already audited
            const { data: prev } = await supabaseAdmin
              .from("dat_mint_audit")
              .select("id")
              .eq("action", `auto-mint:${runId}`)
              .maybeSingle();
            if (!prev) {
              const amount = 10; // verified-research reward, fixed
              const r = await mint.mintOnChain(cfg.cfg, TREASURY_WALLET as `0x${string}`, amount);
              await supabaseAdmin.from("dat_mint_audit").insert({
                wallet: TREASURY_WALLET,
                action: `auto-mint:${runId}`,
                payload: { run_id: runId, job_id: jobId, amount, sigma, verdict },
                status: "confirmed",
                result: { tx_hash: r.txHash, block_number: Number(r.blockNumber) },
              });
              await supabaseAdmin.from("admin_logs").insert({
                kind: "auto_mint",
                subject: runId,
                payload: { tx_hash: r.txHash, amount, sigma, verdict },
              });
              mintInfo = { ok: true, txHash: r.txHash };
            } else {
              mintInfo = { ok: true, txHash: "already-minted" };
            }
          } else {
            mintInfo = { ok: false, error: `minter missing: ${cfg.missing.join(", ")}` };
          }
        } catch (e: any) {
          mintInfo = { ok: false, error: e?.shortMessage || e?.message || String(e) };
          await supabaseAdmin.from("admin_logs").insert({
            kind: "auto_mint",
            subject: runId,
            payload: { error: mintInfo.error },
          });
        }
      }

      return {
        ok: true as const,
        jobId, runId,
        sigma: isFinite(sigma) ? sigma : -1,
        verdict,
        mint: mintInfo,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabaseAdmin
        .from("compute_jobs")
        .update({ status: "failed", error: msg, completed_at: new Date().toISOString() })
        .eq("id", jobId);
      return { ok: false as const, jobId, error: msg };
    }
  });

// ─── Reads ──────────────────────────────────────────────────────────────────
export const listMyJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) => ({ limit: Math.min(input?.limit ?? 50, 200) }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("compute_jobs").select("*")
      .order("created_at", { ascending: false }).limit(data.limit);
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
    return { periodStart, runsCount: row?.runs_count ?? 0 };
  });

export const listMyRunCards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { limit?: number }) => ({ limit: Math.min(input?.limit ?? 50, 200) }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("run_cards").select("*")
      .order("created_at", { ascending: false }).limit(data.limit);
    if (error) throw new Error(error.message);
    return { runCards: (rows ?? []) as Json };
  });
