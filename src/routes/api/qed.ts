import { createFileRoute } from "@tanstack/react-router";
import { QEDEngine } from "@/engine/qed_calculator";

export const Route = createFileRoute("/api/qed")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const loops = Math.min(
          Math.max(parseInt(url.searchParams.get("loops") ?? "6", 10) || 6, 1),
          6,
        );
        const engine = new QEDEngine(1e-11, loops);
        const ae = engine.calculateAe();
        return Response.json({
          loops,
          ae_predicted: ae,
          ae_codata: 1.15965218073e-3,
          residual: engine.getResidual(),
          converged: engine.converged(),
          precision_target: engine.getPrecision(),
          ts: Date.now(),
        });
      },
    },
  },
});
