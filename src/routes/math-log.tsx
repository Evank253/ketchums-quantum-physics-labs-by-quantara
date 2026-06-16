import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Paste-in mathematics evaluator with a streaming live log.
// Supports: arithmetic, common functions (sin/cos/tan/log/ln/sqrt/abs/exp),
// constants (pi, e, c, h, hbar, alpha, alpha_inv), and one expression per line.
// "Live mode" toggle re-runs evaluation on every keystroke (debounced).
// "Verify with CERN-in-a-pocket" calls the existing `cern_pocket_report` RPC.

export const Route = createFileRoute("/math-log")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Math Live Log · KQPL" },
      { name: "description", content: "Paste mathematics, run it, watch each line evaluate in real time." },
    ],
  }),
  component: MathLogPage,
});

type LogLine = { t: number; kind: "in" | "ok" | "err" | "sys"; text: string };

const CONSTS: Record<string, number> = {
  pi: Math.PI, e: Math.E,
  c: 299_792_458,
  h: 6.62607015e-34,
  hbar: 1.054571817e-34,
  alpha: 7.2973525693e-3,
  alpha_inv: 137.035999084,
};

// Tiny safe-ish expression evaluator: whitelists chars then evaluates via Function.
// Not a sandbox — fine for a personal lab tool; we never accept untrusted input
// from anonymous users.
function evalExpr(raw: string): number {
  const cleaned = raw.replace(/\^/g, "**");
  if (!/^[\s0-9+\-*/().,%a-zA-Z_]*\*?\*?[\s0-9+\-*/().,%a-zA-Z_]*$/.test(cleaned)) {
    throw new Error("disallowed characters");
  }
  const scope = { ...CONSTS, sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2,
    log: Math.log10, ln: Math.log, sqrt: Math.sqrt, abs: Math.abs,
    exp: Math.exp, pow: Math.pow, min: Math.min, max: Math.max, round: Math.round,
    floor: Math.floor, ceil: Math.ceil };
  const keys = Object.keys(scope);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(...keys, `"use strict"; return (${cleaned});`);
  const v = fn(...keys.map((k) => (scope as any)[k]));
  if (typeof v !== "number" || Number.isNaN(v)) throw new Error("non-numeric result");
  return v;
}

function MathLogPage() {
  const [src, setSrc] = useState<string>(
    "// one expression per line — try editing this\n" +
    "2 + 2\n" +
    "sin(pi/2)\n" +
    "1 / alpha_inv\n" +
    "// fine-structure pocket: a_e leading term\n" +
    "0.5 * (1/alpha_inv) / pi\n",
  );
  const [live, setLive] = useState(true);
  const [log, setLog] = useState<LogLine[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const append = useCallback((kind: LogLine["kind"], text: string) => {
    setLog((prev) => [...prev.slice(-499), { t: Date.now(), kind, text }]);
  }, []);

  const run = useCallback(async (text: string) => {
    setBusy(true);
    append("sys", `── run @ ${new Date().toLocaleTimeString()} ──`);
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw || raw.startsWith("//") || raw.startsWith("#")) {
        if (raw) append("sys", raw);
        continue;
      }
      append("in", `[${String(i + 1).padStart(3, " ")}] ${raw}`);
      try {
        const v = evalExpr(raw);
        append("ok", `    = ${v}`);
      } catch (e: any) {
        append("err", `    ! ${e?.message ?? String(e)}`);
      }
      // micro-yield so React paints each line — that's the "live" feel
      await new Promise((r) => setTimeout(r, 0));
    }
    setBusy(false);
  }, [append]);

  // Live mode: debounced auto-run on edit
  useEffect(() => {
    if (!live) return;
    const id = setTimeout(() => { void run(src); }, 350);
    return () => clearTimeout(id);
  }, [src, live, run]);

  // Auto-scroll log
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [log]);

  const verifyCern = useCallback(async () => {
    setBusy(true);
    append("sys", "→ requesting CERN-in-a-pocket precision sweep…");
    try {
      const { data, error } = await supabase.rpc("cern_pocket_report", {
        _theory: "user-paste",
        _solver: "math-log-ui",
      });
      if (error) throw error;
      const lines = String(data ?? "").split(/\r?\n/);
      for (const ln of lines) { append("ok", ln); await new Promise((r) => setTimeout(r, 6)); }
    } catch (e: any) {
      append("err", `CERN report failed: ${e?.message ?? String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [append]);

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl gap-4 p-4 lg:grid-cols-2">
      <header className="lg:col-span-2">
        <h1 className="text-xl font-semibold">Math live log</h1>
        <p className="text-sm text-muted-foreground">
          Paste mathematics on the left. Toggle live mode to evaluate as you type, or click Run.
          Each line is computed and logged in real time. Constants: pi, e, c, h, hbar, alpha, alpha_inv.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Source</label>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
              Live mode
            </label>
            <button
              disabled={busy}
              onClick={() => run(src)}
              className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Running…" : "Run"}
            </button>
            <button
              disabled={busy}
              onClick={verifyCern}
              className="rounded border border-border px-3 py-1.5 text-xs"
              title="Run the CERN-in-a-pocket SQL precision sweep"
            >
              Verify (CERN)
            </button>
            <button
              onClick={() => setLog([])}
              className="rounded border border-border px-3 py-1.5 text-xs"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          spellCheck={false}
          className="min-h-[60vh] w-full resize-y rounded-md border border-border bg-background p-3 font-mono text-sm leading-relaxed"
          placeholder="Paste expressions, one per line"
        />
      </section>

      <section className="flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Live log</label>
        <div
          ref={scrollRef}
          className="min-h-[60vh] overflow-auto rounded-md border border-border bg-black/90 p-3 font-mono text-[12px] leading-snug text-emerald-200"
        >
          {log.length === 0 ? (
            <div className="text-muted-foreground">no output yet</div>
          ) : log.map((l, i) => (
            <div
              key={i}
              className={
                l.kind === "in" ? "text-cyan-300" :
                l.kind === "ok" ? "text-emerald-200" :
                l.kind === "err" ? "text-red-300" :
                "text-zinc-500"
              }
            >
              {l.text}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
