// Base Pay (USDC) — server verification + credit allocation.
//
// Client calls window.base.pay({ amount, to: TREASURY_WALLET, testnet }) → returns { id }.
// Then client calls verifyBasePayment({ paymentId, plan? | addon? }) which:
//   1) Polls window.base.getPaymentStatus (client-side, before calling server)
//   2) Server re-verifies status server-side via Base API
//   3) Writes base_payments row
//   4) If plan provided → grants credits via grant_plan_credits SQL fn

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PLAN_CREDITS: Record<string, { amount: number; credits: number; plan: string }> = {
  researcher_monthly: { amount: 99, credits: 100, plan: "researcher" },
  professional_monthly: { amount: 499, credits: 1000, plan: "professional" },
  institutional_monthly: { amount: 2500, credits: 10000, plan: "institutional" },
};
const ADDON_CREDITS: Record<string, { amount: number; credits: number }> = {
  credits_100: { amount: 25, credits: 100 },
  credits_500: { amount: 100, credits: 500 },
  qed_benchmark_pack_once: { amount: 299, credits: 0 },
  physics_dataset_pack_once: { amount: 499, credits: 0 },
};

async function fetchBasePaymentStatus(paymentId: string, testnet: boolean): Promise<{ status: string; amount?: string; tx_hash?: string }> {
  // Base Pay status API — keeping it tolerant of various response shapes
  const base = testnet ? "https://api.developer.coinbase.com/onramp/v1" : "https://api.developer.coinbase.com/onramp/v1";
  // NOTE: the public window.base.getPaymentStatus uses an internal endpoint that does not require auth for status lookup
  // by paymentId. Fall back to "completed" trust when we can't reach the API (client already attested).
  try {
    const r = await fetch(`${base}/transactions/${encodeURIComponent(paymentId)}`, { method: "GET" });
    if (!r.ok) return { status: "unknown" };
    const json: any = await r.json();
    return { status: json.status ?? "unknown", amount: json.amount, tx_hash: json.tx_hash ?? json.transaction_hash };
  } catch {
    return { status: "unknown" };
  }
}

export const verifyBasePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    paymentId: string;
    plan?: string;
    addon?: string;
    walletAddress: string;
    testnet: boolean;
    clientReportedStatus: "completed" | "pending" | "failed";
  }) => {
    if (!data.paymentId || !/^[\w-]{4,128}$/.test(data.paymentId)) throw new Error("Invalid paymentId");
    if (!/^0x[a-fA-F0-9]{40}$/.test(data.walletAddress)) throw new Error("Invalid walletAddress");
    if (data.plan && !PLAN_CREDITS[data.plan]) throw new Error("Unknown plan");
    if (data.addon && !ADDON_CREDITS[data.addon]) throw new Error("Unknown addon");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // SECURITY: server-side verification is authoritative. Never trust clientReportedStatus
    // for granting credits. If the Base API is unreachable or returns unknown, treat as pending.
    const server = await fetchBasePaymentStatus(data.paymentId, data.testnet);
    const effective = server.status;
    const isCompleted = effective === "completed" || effective === "confirmed" || effective === "success";

    const meta = data.plan ? PLAN_CREDITS[data.plan] : data.addon ? ADDON_CREDITS[data.addon] : null;
    const amountUsd = meta?.amount ?? 0;

    // Guard: a payment_id may only ever be attributed to its original claimant.
    const { data: existingPayment } = await supabaseAdmin
      .from("base_payments")
      .select("user_id")
      .eq("payment_id", data.paymentId)
      .maybeSingle();
    if (existingPayment?.user_id && existingPayment.user_id !== context.userId) {
      console.warn(
        "[base-pay] payment_id hijack attempt",
        JSON.stringify({
          payment_id: data.paymentId,
          attacker_user_id: context.userId,
          original_user_id: existingPayment.user_id,
        }),
      );
      await supabaseAdmin.from("security_alerts").insert({
        kind: "base_pay_hijack_attempt",
        severity: "high",
        message: "Attempt to claim payment_id already attributed to another user",
        metadata: {
          payment_id: data.paymentId,
          attacker_user_id: context.userId,
          original_user_id: existingPayment.user_id,
        },
      } as any);
      return { ok: false, status: "rejected", error: "payment_id already claimed" } as const;
    }

    const { error: insErr } = await supabaseAdmin.from("base_payments").upsert(
      {
        user_id: context.userId,
        wallet_address: data.walletAddress.toLowerCase(),
        payment_id: data.paymentId,
        plan: data.plan ?? null,
        addon: data.addon ?? null,
        amount_usd: amountUsd,
        status: isCompleted ? "completed" : effective,
        testnet: data.testnet,
        tx_hash: server.tx_hash ?? null,
        raw: { server, clientReportedStatus: data.clientReportedStatus },
      },
      { onConflict: "payment_id" },
    );
    if (insErr) throw new Error(insErr.message);


    if (!isCompleted) return { ok: false, status: effective };

    // Allocate credits
    if (data.plan && PLAN_CREDITS[data.plan]) {
      const { plan, credits } = PLAN_CREDITS[data.plan];
      await supabaseAdmin.rpc("grant_plan_credits", { _user_id: context.userId, _plan: plan, _credits: credits });
    } else if (data.addon && ADDON_CREDITS[data.addon]) {
      const { credits } = ADDON_CREDITS[data.addon];
      if (credits > 0) {
        // Treat as additive on current plan
        const { data: sub } = await supabaseAdmin.from("subscriptions").select("plan").eq("user_id", context.userId).maybeSingle();
        await supabaseAdmin.rpc("grant_plan_credits", { _user_id: context.userId, _plan: (sub?.plan as string) ?? "explorer", _credits: credits });
      }
    }

    // Also persist wallet to profile if missing
    await supabaseAdmin.from("profiles")
      .upsert({ user_id: context.userId, wallet_address: data.walletAddress.toLowerCase() }, { onConflict: "user_id" });

    return { ok: true, status: "completed" };
  });
