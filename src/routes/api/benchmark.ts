import { createFileRoute } from "@tanstack/react-router";
import { runBenchmarks } from "../../../benchmarks/qed_benchmarks";

export const Route = createFileRoute("/api/benchmark")({
  server: {
    handlers: {
      GET: async () => Response.json(runBenchmarks()),
      POST: async () => Response.json(runBenchmarks()),
    },
  },
});
