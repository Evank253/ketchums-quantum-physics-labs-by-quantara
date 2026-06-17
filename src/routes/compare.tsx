import { createFileRoute, Link } from "@tanstack/react-router";
import { getCompareTable } from "@/lib/compare.functions";

export const Route = createFileRoute("/compare")({
  loader: () => getCompareTable(),
  head: () => ({
    meta: [
      { title: "CODATA vs Computed · Quantara Benchmarks" },
      { name: "description", content: "Side-by-side comparison of CODATA 2022 reference values against Quantara-computed results, with σ-deviation and verified provenance run cards." },
      { property: "og:title", content: "CODATA vs Quantara Computed" },
      { property: "og:description", content: "Reproducible benchmark comparisons with run-card provenance." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "Quantara CODATA Comparison",
          description: "Computed physics constants vs CODATA 2022.",
          license: "https://ketchumsquantumphysicslab.live/legal/license",
          creator: { "@type": "Organization", name: "Ketchum's Quantum Physics Labs" },
        }),
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <main className="p-10 text-red-300">Failed to load comparison: {error.message}</main>
  ),
  notFoundComponent: () => <main className="p-10 text-white/60">Not found.</main>,
  component: ComparePage,
});

function fmt(v: number | null, digits = 6): string {
  if (v == null || !isFinite(v)) return "—";
  if (Math.abs(v) < 1e-3 || Math.abs(v) >= 1e6) return v.toExponential(digits);
  return v.toPrecision(digits);
}

function ComparePage() {
  const { rows } = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-white">
      <header className="mb-8">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-widest text-cyan-300/70 hover:text-cyan-200">
          ← KQPL
        </Link>
        <h1 className="mt-3 text-3xl font-light text-cyan-100">CODATA · vs · Quantara Computed</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">
          Every row links to a public, append-only run card containing engine result, CODATA reference,
          literature benchmark, residual, σ-deviation, backend version, and (when applicable) on-chain mint hash.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="text-white/55">No verified runs yet. Submit a QED job to populate this table.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-white/10 bg-black/40">
          <table className="w-full text-xs">
            <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/55">
              <tr>
                <th className="px-3 py-2 text-left">Symbol</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-right">CODATA</th>
                <th className="px-3 py-2 text-right">Computed</th>
                <th className="px-3 py-2 text-right">Residual</th>
                <th className="px-3 py-2 text-right">σ</th>
                <th className="px-3 py-2 text-center">Verdict</th>
                <th className="px-3 py-2 text-right">Card</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.jobId} className="border-t border-white/5 hover:bg-white/[0.03]">
                  <td className="px-3 py-2 font-mono text-cyan-200">{r.symbol}</td>
                  <td className="px-3 py-2 text-white/70">{r.theory}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(r.codataValue)}<div className="text-[9px] text-white/40">± {fmt(r.codataUnc, 2)}</div></td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(r.computedValue)}<div className="text-[9px] text-white/40">± {fmt(r.computedUnc, 2)}</div></td>
                  <td className="px-3 py-2 text-right font-mono">{fmt(r.residual, 3)}</td>
                  <td className="px-3 py-2 text-right font-mono">{r.sigma != null ? Number(r.sigma).toFixed(2) : "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${r.verdict === "PASS" ? "bg-emerald-500/20 text-emerald-200" : r.verdict === "REVIEW" ? "bg-amber-500/20 text-amber-200" : "bg-red-500/20 text-red-200"}`}>
                      {r.verdict}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.runId ? (
                      <Link to="/run-card/$runId" params={{ runId: r.runId }} className="font-mono text-[10px] text-cyan-300 hover:underline">
                        {r.runId.slice(0, 12)}↗
                      </Link>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
