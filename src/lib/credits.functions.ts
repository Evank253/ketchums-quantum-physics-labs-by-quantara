// Credits: read balance + atomic consume.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("plan, status, credits_remaining, credits_granted, current_period_end, trial_ends_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    const { data: profile } = await context.supabase
      .from("profiles").select("wallet_address, display_name").eq("user_id", context.userId).maybeSingle();
    return {
      plan: (sub?.plan as string) ?? "explorer",
      status: (sub?.status as string) ?? "active",
      creditsRemaining: Number(sub?.credits_remaining ?? 0),
      creditsGranted: Number(sub?.credits_granted ?? 0),
      periodEnd: sub?.current_period_end ?? null,
      trialEndsAt: sub?.trial_ends_at ?? null,
      wallet: (profile?.wallet_address as string) ?? null,
      displayName: (profile?.display_name as string) ?? null,
    };
  });

export const consumeMyCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { amount?: number }) => ({ amount: Math.max(1, Math.min(100, data.amount ?? 1)) }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: remaining, error } = await supabaseAdmin.rpc("consume_credit", {
      _user_id: context.userId, _amount: data.amount,
    });
    if (error) throw new Error(error.message);
    return { remaining: Number(remaining ?? 0) };
  });
