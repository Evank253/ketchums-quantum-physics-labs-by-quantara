import { createFileRoute } from "@tanstack/react-router";
import { runCleanerBatch } from "@/lib/data-cleaner.server";

export const Route = createFileRoute("/api/public/hooks/data-cleaner")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("apikey");
        const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!expected || key !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        try {
          const summary = await runCleanerBatch();
          return Response.json({ ok: true, summary });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
        }
      },
    },
  },
});
