import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SendInput = z.object({
  body: z.string().trim().min(1).max(600),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SendInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Server-authoritative display name. Prefer the user's profile
    // display_name; fall back to the local part of their authenticated
    // email. Caller cannot influence this.
    let displayName: string | null = null;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (profile?.display_name) {
      displayName = profile.display_name;
    } else {
      const email = (context.claims as { email?: string } | null)?.email ?? null;
      displayName = email ? email.split("@")[0] : "anon";
    }
    displayName = (displayName ?? "anon").slice(0, 32);

    const { data: row, error } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        user_id: context.userId,
        display_name: displayName,
        body: data.body,
      })
      .select("id,user_id,display_name,body,created_at")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, message: row };
  });
