import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readLedger, subscribeLedger, clearLedger, exportLedgerJSON, type LedgerEntry } from "@/lib/learning-ledger";
import { runBenchmarks } from "../../benchmarks/qed_benchmarks";
import { logLedger } from "@/lib/learning-ledger";
import { StarField, AuroraBlobs } from "@/components/quantara-fx";

export const Route = createFileRoute("/ledger")({
  component: LedgerPage,
  head: () => ({
    meta: [
      { title: "Learning Ledger — Quantara" },
      { name: "description", content: "Append-only autosave of every token, unlock, benchmark, and bot advance." },
    ],
  }),
});

const KIND_COLOR: Record<string, string> = {
  tokens: "text-amber-400",
  unlock: "text-emerald-400",
  benchmark: "text-cyan-400",
  bot_advance: "text-fuchsia-400",
  heal: "text-blue-400",
  kernel: "text-violet-400",
};

function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    setEntries(readLedger());
    return subscribeLedger(() => setEntries(readLedger()));
  }, []);

  const byKind = filter === "all" ? entries : entries.filter((e) => e.kind === filter);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? byKind.filter((e) => e.label.toLowerCase().includes(q) || JSON.stringify(e.data ?? "").toLowerCase().includes(q))
    : byKind;
  const view = [...filtered].reverse();

  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + 1;
    return acc;
  }, {});

  const onExport = () => {
    const blob = new Blob([exportLedgerJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quantara-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onBenchmark = () => {
    const r = runBenchmarks();
    logLedger("benchmark", "QED a_e benchmark", r as unknown as Record<string, unknown>);
  };

  return (
    <main className="relative min-h-screen bg-[oklch(0.06_0.01_280)] px-6 py-20 text-white overflow-hidden">
      <StarField density={140} />
      <AuroraBlobs />
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome hover:text-white">
            ← Quantara
          </Link>
          <div className="flex gap-2">
            <Link to="/world" className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome hover:text-white">/world</Link>
            <Link to="/atlas" className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome hover:text-white">/atlas</Link>
            <Link to="/benchmarks" className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome hover:text-white">/benchmarks</Link>
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-[-0.03em] md:text-6xl">Learning Ledger</h1>
        <p className="mt-3 max-w-2xl font-mono text-xs text-muted-foreground">
          Append-only autosave of every token credit, breakthrough, benchmark run, bot advance,
          and kernel event. This is the civilization's memory of its own life.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-px md:grid-cols-6">
          {[
            ["total", entries.length],
            ["tokens", counts.tokens ?? 0],
            ["unlock", counts.unlock ?? 0],
            ["benchmark", counts.benchmark ?? 0],
            ["bot_advance", counts.bot_advance ?? 0],
            ["kernel", counts.kernel ?? 0],
          ].map(([k, v]) => (
            <button
              key={k as string}
              onClick={() => setFilter(k === "total" ? "all" : (k as string))}
              className={`border border-white/5 bg-card/40 p-4 text-left font-mono hover:bg-card/60 ${
                filter === (k === "total" ? "all" : k) ? "border-accent/40" : ""
              }`}
            >
              <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">{k as string}</div>
              <div className={`mt-1 text-2xl font-black ${KIND_COLOR[k as string] ?? "text-white"}`}>{v as number}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search label or data…"
            className="min-w-[14rem] flex-1 rounded-sm border border-white/10 bg-card/40 px-3 py-2 font-mono text-[11px] text-white placeholder:text-muted-foreground outline-none focus:border-accent/40"
          />
          {query && (
            <button onClick={() => setQuery("")} className="border border-white/10 px-2 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome hover:text-white">
              clear search
            </button>
          )}
          <span className="font-mono text-[10px] text-muted-foreground">{view.length} match{view.length === 1 ? "" : "es"}</span>
          <span className="flex-1" />
          <button onClick={onBenchmark} className="border border-cyan-400/40 bg-cyan-400/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300 hover:bg-cyan-400/10">
            Run QED benchmark → ledger
          </button>
          <button onClick={onExport} className="border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white hover:border-accent/40">
            Export JSON
          </button>
          <button
            onClick={() => { if (confirm("Clear the ledger?")) clearLedger(); }}
            className="border border-red-400/30 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-red-300 hover:bg-red-400/5"
          >
            Clear
          </button>
        </div>

        <div className="mt-6 border border-white/5 bg-card/40">
          <div className="grid grid-cols-12 gap-2 border-b border-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
            <div className="col-span-2">TIME</div>
            <div className="col-span-2">KIND</div>
            <div className="col-span-5">LABEL</div>
            <div className="col-span-3 text-right">DATA</div>
          </div>
          {view.length === 0 && (
            <div className="px-4 py-12 text-center font-mono text-xs text-muted-foreground">
              // ledger empty — boot the world, run benchmarks, or unlock breakthroughs
            </div>
          )}
          {view.map((e, i) => (
            <div key={i} className="grid grid-cols-12 items-center gap-2 border-b border-white/5 px-4 py-2 font-mono text-[10px]">
              <div className="col-span-2 text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</div>
              <div className={`col-span-2 ${KIND_COLOR[e.kind] ?? "text-white"}`}>{e.kind}</div>
              <div className="col-span-5 text-white">{e.label}</div>
              <div className="col-span-3 truncate text-right text-muted-foreground">
                {e.data ? JSON.stringify(e.data) : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
