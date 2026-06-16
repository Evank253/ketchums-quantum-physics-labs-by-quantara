// Cron-triggered Nexus healer run. Verified with the Supabase anon key in
// an `apikey` header. Returns the healer report.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/healer/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sent = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || sent !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runHealer } = await import("@/lib/nexus-healer.server");
        const result = await runHealer(supabaseAdmin as any);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
