import { useEffect, useState } from "react";
import { mergedArchive, type ArchivedSolve } from "@/lib/solved-archive";

// ============================================================================
// Combined, categorized, collapsed ledger of every solved theory + its math.
// Pulls from the shared mergedArchive (DB + local + builtin derivations that
// have been archived). Groups by domain (QED / QCD / RG / Cosmology / Other),
// each as a collapsed <details> with theory cards that themselves expand to
// show the full math/derivation transcript.
// ============================================================================

type Category = "QED" | "QCD" | "RG" | "Cosmology" | "Quantum Computing" | "Other";

const CATEGORY_ORDER: Category[] = [
  "QED",
  "QCD",
  "RG",
  "Cosmology",
  "Quantum Computing",
  "Other",
];

function classify(s: ArchivedSolve): Category {
  const t = `${s.theory} ${s.abstract ?? ""} ${s.source ?? ""}`.toLowerCase();
  if (/\bqcd\b|α[ₛs]|alpha_?s|gluon|quark|strong coupling|asymptotic freedom/.test(t)) return "QCD";
  if (/renormali[sz]ation|\brg\b|running|β-?function|beta function/.test(t)) return "RG";
  if (/\bqed\b|a_?e|electron|anomalous magnetic|schwinger|lamb shift|g-?2|fine[- ]structure/.test(t)) return "QED";
  if (/cosmolog|inflation|dark (matter|energy)|hubble|cmb|big bang/.test(t)) return "Cosmology";
  if (/qubit|quantum (circuit|computing|gate)|bell state|entangle/.test(t)) return "Quantum Computing";
  return "Other";
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

export function SolvedLedgerCategorized() {
  const [list, setList] = useState<ArchivedSolve[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const archive = await mergedArchive();
        if (!cancelled) setList(archive);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = new Map<Category, ArchivedSolve[]>();
  for (const c of CATEGORY_ORDER) grouped.set(c, []);
  for (const s of list) grouped.get(classify(s))!.push(s);

  return (
    <section id="ledger" className="relative border-t border-white/5 px-6 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,oklch(0.55_0.18_140/0.06),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            <span className="size-1.5 animate-pulse-slow rounded-full bg-emerald-400 shadow-[0_0_10px_oklch(0.75_0.18_150)]" />
            Solved Theories · Combined Ledger
          </div>
          <h2 className="text-balance text-3xl font-black leading-[0.95] tracking-[-0.03em] text-white md:text-5xl">
            Every theory. Every line of math. Filed by domain.
          </h2>
          <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
            Solved derivations are merged with their parent theories and grouped
            by category. All sections are collapsed by default — open any
            section to browse, then open any card to read the full math and
            transcript.
          </p>
        </div>

        <div className="grid gap-3">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat) ?? [];
            if (items.length === 0) return null;
            return (
              <details
                key={cat}
                className="group rounded border border-white/10 bg-card/40 open:bg-card/60"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-white hover:bg-white/[0.03]">
                  <span className="flex items-center gap-3">
                    <span className="rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                      {cat}
                    </span>
                    <span className="text-white/80">
                      {items.length} solved {items.length === 1 ? "entry" : "entries"}
                    </span>
                  </span>
                  <span className="text-chrome group-open:rotate-90 transition-transform">›</span>
                </summary>

                <div className="grid gap-px border-t border-white/5 bg-white/5 md:grid-cols-2">
                  {items.map((s) => {
                    const isOpen = openId === s.id;
                    return (
                      <article
                        key={s.id}
                        className="bg-card/60 p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                              {s.source || "ledger"} · {fmtTime(s.created_at)}
                            </div>
                            <h3 className="mt-2 text-balance text-base font-bold leading-tight text-white">
                              {s.theory}
                            </h3>
                            {s.abstract && (
                              <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                                {s.abstract}
                              </p>
                            )}
                            <div className="mt-2 font-mono text-[10px] text-chrome/80">
                              solver · <span className="text-white/80">{s.solver}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setOpenId(isOpen ? null : s.id)}
                            className="shrink-0 border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/80 hover:bg-white/5"
                          >
                            {isOpen ? "Hide math" : "Show math"}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="mt-4 space-y-3">
                            {s.math && (
                              <div>
                                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300/80">
                                  Math · derivation
                                </div>
                                <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words border border-white/5 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-white">
{s.math}
                                </pre>
                              </div>
                            )}
                            {s.transcript && (
                              <div>
                                <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-violet-300/80">
                                  Transcript · tests & results
                                </div>
                                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border border-white/5 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-white/90">
{s.transcript}
                                </pre>
                              </div>
                            )}
                            {!s.math && !s.transcript && (
                              <div className="font-mono text-[11px] text-muted-foreground">
                                No additional math archived yet for this entry.
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </details>
            );
          })}

          {list.length === 0 && (
            <div className="rounded border border-white/10 bg-card/40 p-6 font-mono text-xs text-muted-foreground">
              No solves archived yet. Run any solver on the page and entries will
              appear here automatically, filed by domain.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
