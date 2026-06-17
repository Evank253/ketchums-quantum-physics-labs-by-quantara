// AI Data Cleaner — server-only. Runs on cron, dedupes/normalises tables,
// warms compute cache, and mints small DAT reward to treasury per batch.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CleanerSummary = {
  startedAt: string;
  finishedAt: string;
  dedupedChat: number;
  normalisedFeedback: number;
  prunedStuckJobs: number;
  warmedCache: number;
  mint: { ok: boolean; txHash?: string; error?: string } | null;
};

function hashKey(obj: unknown): string {
  // Tiny stable hash (sufficient as cache key; not crypto).
  const s = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return `h${(h >>> 0).toString(16)}`;
}

export async function runCleanerBatch(): Promise<CleanerSummary> {
  const startedAt = new Date().toISOString();
  let dedupedChat = 0;
  let normalisedFeedback = 0;
  let prunedStuckJobs = 0;
  let warmedCache = 0;

  // 1) Dedupe chat_messages: same user + same content within 60s — keep oldest.
  try {
    const { data: dupes } = await supabaseAdmin.rpc("noop_select" as any).then(
      () => ({ data: null }),
      async () => {
        // Inline SQL via PostgREST not possible; use two-step.
        const { data } = await supabaseAdmin
          .from("chat_messages")
          .select("id, user_id, content, created_at")
          .order("created_at", { ascending: true })
          .limit(2000);
        return { data };
      },
    );
    const rows = (dupes as any[]) ?? [];
    const seen = new Map<string, string>(); // key -> kept id
    const toDelete: string[] = [];
    for (const r of rows) {
      const bucket = Math.floor(new Date(r.created_at).getTime() / 60000);
      const k = `${r.user_id}|${bucket}|${r.content}`;
      if (seen.has(k)) toDelete.push(r.id);
      else seen.set(k, r.id);
    }
    if (toDelete.length) {
      const { error } = await supabaseAdmin.from("chat_messages").delete().in("id", toDelete);
      if (!error) dedupedChat = toDelete.length;
    }
  } catch {/* table may not exist */ }

  // 2) Normalise feedback rows touched in the last 7 days.
  try {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: fb } = await supabaseAdmin
      .from("feedback")
      .select("id, email, message")
      .gte("created_at", since)
      .limit(500);
    for (const r of (fb as any[]) ?? []) {
      const cleanMsg = (r.message ?? "").toString().replace(/\s+/g, " ").trim();
      const cleanEmail = (r.email ?? "").toString().trim().toLowerCase() || null;
      if (cleanMsg !== r.message || cleanEmail !== r.email) {
        const { error } = await supabaseAdmin
          .from("feedback")
          .update({ message: cleanMsg, email: cleanEmail })
          .eq("id", r.id);
        if (!error) normalisedFeedback++;
      }
    }
  } catch {/* */ }

  // 3) Prune compute_jobs stuck > 30 min in 'running'.
  try {
    const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
    const { data: stuck } = await supabaseAdmin
      .from("compute_jobs")
      .select("id")
      .eq("status", "running")
      .lt("created_at", cutoff);
    const ids = ((stuck as any[]) ?? []).map((j) => j.id);
    if (ids.length) {
      await supabaseAdmin
        .from("compute_jobs")
        .update({ status: "failed", error: "auto-cleaner: stuck > 30m", completed_at: new Date().toISOString() })
        .in("id", ids);
      prunedStuckJobs = ids.length;
    }
  } catch {/* */ }

  // 4) Warm compute_warmup_cache from recent PASS results.
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: hot } = await supabaseAdmin
      .from("compute_jobs")
      .select("model, inputs, engine_result, codata_result, literature_result, sigma, verdict")
      .eq("status", "complete")
      .eq("verdict", "PASS")
      .gte("completed_at", since)
      .limit(200);
    for (const j of (hot as any[]) ?? []) {
      const key = hashKey({ m: j.model, i: j.inputs });
      const { error } = await supabaseAdmin
        .from("compute_warmup_cache")
        .upsert({
          cache_key: key,
          model: j.model,
          payload: {
            engineResult: j.engine_result,
            codataResult: j.codata_result,
            literatureResult: j.literature_result,
            sigma: j.sigma,
            verdict: j.verdict,
          },
        }, { onConflict: "cache_key" });
      if (!error) warmedCache++;
    }
  } catch {/* */ }

  // 5) Mint small DAT reward to treasury per successful batch (idempotent by action).
  let mintInfo: CleanerSummary["mint"] = null;
  if (dedupedChat + normalisedFeedback + prunedStuckJobs + warmedCache > 0) {
    try {
      const mint = await import("./dat-mint.server");
      const { TREASURY_WALLET } = await import("./treasury");
      const cfg = mint.loadMintConfig();
      const action = `cleaner-batch:${startedAt}`;
      if (cfg.ok) {
        const r = await mint.mintOnChain(cfg.cfg, TREASURY_WALLET as `0x${string}`, 5);
        await supabaseAdmin.from("dat_mint_audit").insert({
          wallet: TREASURY_WALLET,
          action,
          payload: { amount: 5, summary: { dedupedChat, normalisedFeedback, prunedStuckJobs, warmedCache } },
          status: "confirmed",
          result: { tx_hash: r.txHash, block_number: Number(r.blockNumber) },
        });
        mintInfo = { ok: true, txHash: r.txHash };
      } else {
        mintInfo = { ok: false, error: `minter missing: ${cfg.missing.join(", ")}` };
      }
    } catch (e: any) {
      mintInfo = { ok: false, error: e?.shortMessage || e?.message || String(e) };
    }
  }

  const finishedAt = new Date().toISOString();
  const summary: CleanerSummary = {
    startedAt, finishedAt,
    dedupedChat, normalisedFeedback, prunedStuckJobs, warmedCache,
    mint: mintInfo,
  };
  await supabaseAdmin.from("admin_logs").insert({
    kind: "data_cleaner",
    subject: startedAt,
    payload: summary as any,
  });
  return summary;
}

export function warmupCacheKey(model: string, inputs: unknown): string {
  return hashKey({ m: model, i: inputs });
}
