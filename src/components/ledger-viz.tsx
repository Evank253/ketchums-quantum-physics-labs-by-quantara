import { useEffect, useMemo, useState } from "react";
import { readLedger, subscribeLedger, type LedgerEntry } from "@/lib/learning-ledger";

const KIND_COLOR: Record<string, string> = {
  tokens: "#fcd34d",
  unlock: "#e879f9",
  benchmark: "#67e8f9",
  bot_advance: "#86efac",
  heal: "#fda4af",
  kernel: "#a5b4fc",
};

export function LedgerViz() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  useEffect(() => {
    setEntries(readLedger());
    return subscribeLedger(() => setEntries(readLedger()));
  }, []);

  const buckets = useMemo(() => {
    if (entries.length === 0) return [];
    const N = 40;
    const t0 = entries[0].ts;
    const t1 = entries[entries.length - 1].ts;
    const span = Math.max(1, t1 - t0);
    const out: Record<string, number>[] = Array.from({ length: N }, () => ({}));
    for (const e of entries) {
      const i = Math.min(N - 1, Math.floor(((e.ts - t0) / span) * N));
      out[i][e.kind] = (out[i][e.kind] || 0) + 1;
    }
    return out;
  }, [entries]);

  const max = Math.max(1, ...buckets.map((b) => Object.values(b).reduce((a, c) => a + c, 0)));
  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] || 0) + 1; return acc;
  }, {});

  return (
    <section id="ledger-viz" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Memory Stream</div>
            <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">Learning Ledger</h3>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">
            {entries.length.toLocaleString()} events
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-black/40 p-4">
          <div className="flex h-40 items-end gap-px">
            {buckets.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-white/30">
                No memories yet — earn $DAT, run CERN beams, or measure a circuit.
              </div>
            ) : buckets.map((b, i) => {
              const total = Object.values(b).reduce((a, c) => a + c, 0);
              const h = (total / max) * 100;
              return (
                <div key={i} className="relative flex-1" style={{ height: `${h}%` }}>
                  {Object.entries(b).map(([k, n], j) => (
                    <div key={j}
                      style={{
                        background: KIND_COLOR[k] || "#fff",
                        height: `${(n / total) * 100}%`,
                        opacity: 0.85,
                      }}
                      className="w-full"
                    />
                  ))}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest text-white/70">
            {Object.entries(KIND_COLOR).map(([k, c]) => (
              <span key={k} className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: c }} />
                {k} · {counts[k] || 0}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 max-h-72 overflow-auto rounded-md border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="sticky top-0 bg-black/80 text-white/60">
              <tr><th className="px-3 py-2">time</th><th className="px-3 py-2">kind</th><th className="px-3 py-2">label</th></tr>
            </thead>
            <tbody>
              {entries.slice(-200).reverse().map((e, i) => (
                <tr key={i} className="border-t border-white/5 text-white/80">
                  <td className="px-3 py-1.5 text-white/50">{new Date(e.ts).toLocaleTimeString()}</td>
                  <td className="px-3 py-1.5" style={{ color: KIND_COLOR[e.kind] }}>{e.kind}</td>
                  <td className="px-3 py-1.5">{e.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
