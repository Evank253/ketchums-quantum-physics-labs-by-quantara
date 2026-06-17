import { createFileRoute } from "@tanstack/react-router";
import { syncWizFindings } from "@/lib/wiz-sync.server";

export const Route = createFileRoute("/api/public/hooks/wiz-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || key !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const result = await syncWizFindings();
        return Response.json(result);
      },
    },
  },
});
