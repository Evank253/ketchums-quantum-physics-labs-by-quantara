// Subscription read API — used by the institutional dashboard to show
// trial countdown, plan, and quota usage.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("plan, status, trial_ends_at, current_period_end")
      .eq("user_id", context.userId)
      .maybeSingle();

    const { data: q } = await supabaseAdmin.rpc("check_user_quota", { _user_id: context.userId });
    const quota = Array.isArray(q) ? q[0] : q;

    return {
      plan: (sub?.plan as string) ?? "trial",
      status: (sub?.status as string) ?? "active",
      trialEndsAt: sub?.trial_ends_at ?? null,
      periodEnd: sub?.current_period_end ?? null,
      allowed: Boolean(quota?.allowed),
      runsUsed: Number(quota?.runs_used ?? 0),
      runsLimit: Number(quota?.runs_limit ?? 0),
      reason: (quota?.reason as string) ?? "",
    };
  });
