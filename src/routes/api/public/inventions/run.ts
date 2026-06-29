// Discovery trigger. Authenticated by INVENTIONS_CRON_SECRET (separate from
// service-role key) + Bearer header check; respects kill switch + rate limit.
import { createFileRoute } from "@tanstack/react-router";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export const Route = createFileRoute("/api/public/inventions/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.INVENTIONS_CRON_SECRET ?? "";
        if (!expected) {
          return new Response(JSON.stringify({ error: "not_configured" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }
        const auth = request.headers.get("authorization") ?? "";
        const sent =
          (auth.startsWith("Bearer ") ? auth.slice(7) : "") ||
          request.headers.get("x-cron-secret") ||
          "";
        if (!sent || !timingSafeEqual(sent, expected)) {
          console.warn("[inventions.run] unauthorized");
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { discoverInvention } = await import("@/lib/owner-inventions.server");
          const out = await discoverInvention(supabaseAdmin as any, { trigger: "cron" });
          const status = out.ok ? 200 : out.reason === "error" ? 500 : 202;
          return new Response(JSON.stringify(out), {
            status,
            headers: { "content-type": "application/json" },
          });
        } catch (e: any) {
          console.error("[inventions.run] failed", e);
          return new Response(
            JSON.stringify({ ok: false, error: e?.message ?? String(e) }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
