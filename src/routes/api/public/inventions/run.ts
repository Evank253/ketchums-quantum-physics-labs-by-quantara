// Service-role gated discovery trigger. Called by pg_cron every 30 minutes.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/inventions/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sent = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
        if (!expected || sent !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { discoverInvention } = await import("@/lib/owner-inventions.server");
          const out = await discoverInvention(supabaseAdmin as any);
          return new Response(JSON.stringify({ ok: true, ...out }), {
            status: 200,
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
