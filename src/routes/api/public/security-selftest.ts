// Public self-test endpoint. Returns the current Nexus self-test report.
// Verified with the Supabase anon key in an `apikey` header (cron pattern).
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/security-selftest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sent = request.headers.get("apikey") ?? "";
        const expected = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
        if (!expected || sent !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runSelfTest } = await import("@/lib/nexus-healer.server");
        const report = await runSelfTest(supabaseAdmin as any);
        return new Response(JSON.stringify(report), {
          status: report.passed ? 200 : 503,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
