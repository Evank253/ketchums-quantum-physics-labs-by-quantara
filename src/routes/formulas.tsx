import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { evaluate, parse, simplify as mjSimplify } from "mathjs";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  FORMULA_CATALOG,
  FORMULA_CATEGORIES,
  type FormulaEntry,
} from "@/lib/formula-catalog";

export const Route = createFileRoute("/formulas")({
  component: FormulasPage,
  head: () => ({
    meta: [
      { title: "Theoretical Formula Lab · Quantara" },
      {
        name: "description",
        content:
          "Symbolic + numerical playground for QM, QED, QCD, GR, EM, classical, thermo, and pure-math formulas.",
      },
    ],
  }),
});

function TeX({ src, block }: { src: string; block?: boolean }) {
  const html = useMemo(
    () => katex.renderToString(src, { throwOnError: false, displayMode: block }),
    [src, block],
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function FormulaCard({ f }: { f: FormulaEntry }) {
  const [vars, setVars] = useState<Record<string, number>>(f.defaults ?? {});
  const [custom, setCustom] = useState(f.expression ?? "");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const evalNow = () => {
    setError(null);
    try {
      const v = evaluate(custom, vars);
      setResult(
        typeof v === "number"
          ? Number.isFinite(v)
            ? v.toExponential(8)
            : String(v)
          : String(v),
      );
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  const symbolicSimplify = () => {
    setError(null);
    try {
      const node = parse(custom);
      const simplified = mjSimplify(node).toString();
      setResult("simplified: " + simplified);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  };

  return (
    <div className="rounded-md border border-white/10 bg-card/40 p-4 font-mono text-xs">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-chrome">
          {f.category} · {f.id}
        </div>
        {f.citation && (
          <div className="text-[9px] text-muted-foreground">{f.citation}</div>
        )}
      </div>
      <div className="mb-2 text-sm text-white">{f.name}</div>
      <div className="my-3 overflow-x-auto rounded bg-black/30 px-3 py-2 text-white">
        <TeX src={f.latex} block />
      </div>
      <p className="mb-3 text-[11px] text-muted-foreground">{f.description}</p>

      {f.expression !== null && (
        <>
          <label className="text-[10px] uppercase tracking-[0.2em] text-chrome">
            Expression (editable, mathjs syntax)
          </label>
          <textarea
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-white/10 bg-black/40 p-2 font-mono text-[11px] text-white"
            spellCheck={false}
          />
          {Object.keys(vars).length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
              {Object.entries(vars).map(([k, v]) => (
                <label key={k} className="flex items-center gap-1 text-[10px]">
                  <span className="w-10 text-chrome">{k}</span>
                  <input
                    value={String(v)}
                    onChange={(e) =>
                      setVars((s) => ({ ...s, [k]: Number(e.target.value) }))
                    }
                    className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-white"
                  />
                </label>
              ))}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={evalNow}
              className="rounded border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-accent hover:bg-accent/20"
            >
              Evaluate
            </button>
            <button
              onClick={symbolicSimplify}
              className="rounded border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80 hover:bg-white/10"
            >
              Symbolic simplify
            </button>
          </div>
          {result && (
            <div className="mt-2 rounded border-l-2 border-emerald-400/60 bg-emerald-400/5 px-3 py-2 text-emerald-300">
              = {result}
            </div>
          )}
          {error && (
            <div className="mt-2 rounded border-l-2 border-red-400/60 bg-red-400/5 px-3 py-2 text-red-300">
              {error}
            </div>
          )}
        </>
      )}
      {f.expression === null && (
        <div className="text-[10px] italic text-muted-foreground">
          Display-only (PDE / operator form — wire in a solver to evaluate).
        </div>
      )}
    </div>
  );
}

function FormulasPage() {
  const [cat, setCat] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const list = useMemo(
    () =>
      FORMULA_CATALOG.filter(
        (f) =>
          (cat === "ALL" || f.category === cat) &&
          (q === "" ||
            f.name.toLowerCase().includes(q.toLowerCase()) ||
            f.id.includes(q.toLowerCase())),
      ),
    [cat, q],
  );

  return (
    <main className="min-h-screen bg-[oklch(0.06_0.01_280)] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">
          Theoretical Formula Lab
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Browse every theoretical equation wired into the solver. Edit the
          variables, run a numerical evaluation, or simplify symbolically.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {(["ALL", ...FORMULA_CATEGORIES] as string[]).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                cat === c
                  ? "border-accent/60 bg-accent/15 text-accent"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
              }`}
            >
              {c}
            </button>
          ))}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search…"
            className="ml-auto w-56 rounded border border-white/10 bg-black/40 px-3 py-1 font-mono text-xs text-white"
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((f) => (
            <FormulaCard key={f.id} f={f} />
          ))}
        </div>
        {list.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No formulas match.
          </div>
        )}
      </div>
    </main>
  );
}
