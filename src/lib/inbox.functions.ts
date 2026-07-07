// Inbox messaging: send, list, mark read. All RLS-enforced.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendInboxMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { recipient_email: string; subject?: string; body: string }) => {
    if (!d.recipient_email || !d.body) throw new Error("recipient + body required");
    if (d.body.length > 10000) throw new Error("body too long");
    return d;
  })
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error: ue } = await (supabaseAdmin as any).auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (ue) throw ue;
    const recipient = (u?.users ?? []).find(
      (x: any) => (x.email ?? "").toLowerCase() === data.recipient_email.toLowerCase(),
    );
    // SECURITY: do NOT reveal whether an email is a registered account.
    // Return generic success for both "recipient not found" and "self-message"
    // so callers cannot use this endpoint as a user-enumeration oracle.
    if (!recipient || recipient.id === context.userId) {
      return { ok: true };
    }
    const { error } = await context.supabase.from("inbox_messages").insert({
      sender_id: context.userId,
      recipient_id: recipient.id,
      subject: data.subject ?? null,
      body: data.body,
    });
    if (error) throw error;
    return { ok: true };

  });

export const listInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("inbox_messages")
      .select("id,sender_id,recipient_id,subject,body,read_at,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return { rows: data ?? [], me: context.userId };
  });

export const markInboxRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("inbox_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("recipient_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
