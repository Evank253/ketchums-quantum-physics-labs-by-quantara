import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useWorld, getBreakthrough } from "@/lib/world-store";
import { BREAKTHROUGHS, type Breakthrough } from "@/lib/breakthroughs";

export const Route = createFileRoute("/world/ledger")({
  component: LedgerPage,
  head: () => ({
    meta: [
      { title: "Quantara World — Breakthrough Ledger" },
      {
        name: "description",
        content:
          "Every artifact, formula and architectural blueprint the Quantara bots have unlocked. Curated mix of established, frontier, and clearly-labeled speculative tech.",
      },
      { property: "og:title", content: "Quantara World — Ledger" },
      { property: "og:description", content: "Live ledger of bot breakthroughs with formulas and blueprints." },
    ],
  }),
});

const TAG_STYLES: Record<string, string> = {
  established: "border-emerald-400/40 text-emerald-300 bg-emerald-500/10",
  frontier: "border-amber-400/40 text-amber-300 bg-amber-500/10",
  speculative: "border-fuchsia-400/40 text-fuchsia-300 bg-fuchsia-500/10",
};

function blueprintMarkdown(b: Breakthrough, discoveredBy?: string, unlockedAt?: number) {
  const lines: string[] = [];
  lines.push(`# ${b.name}`);
  if (discoveredBy) lines.push(`Discovered by: ${discoveredBy}`);
  if (unlockedAt) lines.push(`Unlocked: ${new Date(unlockedAt).toISOString()}`);
  lines.push(`Tier ${b.tier} · ${b.category} · ${b.realityTag.toUpperCase()}\n`);
  lines.push(`## Summary\n${b.summary}\n`);
  lines.push(`## Formula\n\`${b.formula.expr}\`\n`);
  lines.push(`### Variables`);
  b.formula.variables.forEach((v) => lines.push(`- ${v.sym}: ${v.meaning}${v.units ? ` (${v.units})` : ""}`));
  lines.push(`\n## Architectural blueprint`);
  lines.push(`### Components`);
  b.blueprint.components.forEach((c) => lines.push(`- ${c.name} × ${c.qty} — ${c.spec}`));
  lines.push(`### Assembly steps`);
  b.blueprint.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  lines.push(`\n### ASCII schematic\n\`\`\`\n${b.blueprint.schematic}\n\`\`\``);
  lines.push(`- Power budget: ${b.blueprint.power}`);
  lines.push(`- Footprint: ${b.blueprint.footprint}`);
  lines.push(`- Risks: ${b.blueprint.risks.join("; ")}`);
  return lines.join("\n");
}

function LedgerPage() {
  const init = useWorld((s) => s.init);
  const startLoop = useWorld((s) => s.startLoop);
  const unlocked = useWorld((s) => s.unlocked);
  useEffect(() => {
    init();
    return startLoop();
  }, [init, startLoop]);

  const [filter, setFilter] = useState<"all" | "established" | "frontier" | "speculative">("all");
  const [category, setCategory] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(BREAKTHROUGHS.map((b) => b.category))).sort(),
    [],
  );
  const tiers = useMemo(
    () => Array.from(new Set(BREAKTHROUGHS.map((b) => b.tier))).sort((a, b) => a - b),
    [],
  );

  const rows = useMemo(() => {
    const unlockedMap = new Map(unlocked.map((u) => [u.id, u]));
    const q = query.trim().toLowerCase();
    return BREAKTHROUGHS.map((b) => ({
      bt: b,
      u: unlockedMap.get(b.id) || null,
    }))
      .filter((r) => (filter === "all" ? true : r.bt.realityTag === filter))
      .filter((r) => (category === "all" ? true : r.bt.category === category))
      .filter((r) => (tier === "all" ? true : String(r.bt.tier) === tier))
      .filter((r) => (onlyUnlocked ? !!r.u : true))
      .filter((r) =>
        q
          ? r.bt.name.toLowerCase().includes(q) ||
            r.bt.summary.toLowerCase().includes(q) ||
            r.bt.id.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => {
        if (a.u && b.u) return b.u.unlockedAt - a.u.unlockedAt;
        if (a.u) return -1;
        if (b.u) return 1;
        return a.bt.tier - b.bt.tier;
      });
  }, [unlocked, filter, category, tier, query, onlyUnlocked]);

  function exportAll() {
    const blocks = unlocked
      .map((u) => {
        const b = getBreakthrough(u.id);
        return b ? blueprintMarkdown(b, u.discoveredBy, u.unlockedAt) : "";
      })
      .filter(Boolean);
    const txt = `# Quantara World — Ledger Export\nGenerated: ${new Date().toISOString()}\nTotal unlocked: ${unlocked.length}/${BREAKTHROUGHS.length}\n\n---\n\n${blocks.join("\n\n---\n\n")}`;
    const blob = new Blob([txt], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quantara-ledger-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const visible = rows.map((r) => r.bt);
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const unlockedMap = new Map(unlocked.map((u) => [u.id, u]));
    const body = visible
      .map((b) => {
        const u = unlockedMap.get(b.id);
        return `
          <section class="card">
            <header>
              <span class="tag tag-${b.realityTag}">${b.realityTag}</span>
              <span class="tier">T${b.tier}</span>
              <h2>${esc(b.name)}</h2>
              <span class="cat">${esc(b.category)}</span>
              <span class="status">${u ? `unlocked · ${esc(u.discoveredBy)} · ${new Date(u.unlockedAt).toLocaleString()}` : "locked"}</span>
            </header>
            <p>${esc(b.summary)}</p>
            <h3>Formula</h3>
            <pre>${esc(b.formula.expr)}</pre>
            <ul>${b.formula.variables.map((v) => `<li><b>${esc(v.sym)}</b> — ${esc(v.meaning)}${v.units ? ` (${esc(v.units)})` : ""}</li>`).join("")}</ul>
            <h3>Components</h3>
            <ul>${b.blueprint.components.map((c) => `<li>${esc(c.name)} × ${esc(c.qty)} — ${esc(c.spec)}</li>`).join("")}</ul>
            <h3>Assembly</h3>
            <ol>${b.blueprint.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
            <h3>Schematic</h3>
            <pre class="schematic">${esc(b.blueprint.schematic)}</pre>
            <div class="meta">
              <div><b>Power:</b> ${esc(b.blueprint.power)}</div>
              <div><b>Footprint:</b> ${esc(b.blueprint.footprint)}</div>
              <div><b>Risks:</b> ${esc(b.blueprint.risks.join("; "))}</div>
            </div>
          </section>`;
      })
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Quantara Ledger</title>
      <style>
        @page { size: A4; margin: 18mm; }
        body { font: 11px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111; }
        h1 { font-size: 22px; margin: 0 0 4px; }
        h2 { font-size: 14px; margin: 6px 0; display: inline; }
        h3 { font-size: 11px; text-transform: uppercase; letter-spacing: .15em; margin: 10px 0 4px; color: #555; }
        .card { border: 1px solid #ddd; border-radius: 4px; padding: 12px; margin: 0 0 10px; page-break-inside: avoid; }
        header { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 6px; }
        .tag { font: 9px monospace; text-transform: uppercase; padding: 2px 6px; border-radius: 3px; }
        .tag-established { background: #d1fae5; color: #065f46; }
        .tag-frontier { background: #fef3c7; color: #92400e; }
        .tag-speculative { background: #fce7f3; color: #9d174d; }
        .tier, .cat, .status { font: 9px monospace; color: #666; }
        pre { background: #f5f5f7; padding: 8px; border-radius: 3px; white-space: pre-wrap; font: 10px ui-monospace, monospace; }
        pre.schematic { font-size: 9px; }
        ul, ol { margin: 4px 0 4px 18px; padding: 0; }
        li { margin: 2px 0; }
        .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 8px; font-size: 10px; }
        .head { display: flex; justify-content: space-between; align-items: end; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 14px; }
      </style></head><body>
      <div class="head">
        <div>
          <h1>Quantara World — Breakthrough Ledger</h1>
          <div style="font:10px monospace;color:#666">Generated ${new Date().toLocaleString()} · ${visible.length} entries · ${unlocked.length}/${BREAKTHROUGHS.length} unlocked</div>
        </div>
      </div>
      ${body}
      </body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
    if (!w) {
      alert("Allow pop-ups to export PDF.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.onload = () => setTimeout(() => w.print(), 250);
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Quantara World · Ledger</span>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.02em] md:text-5xl">
              Every artifact the bots have built.
            </h1>
            <p className="mt-2 max-w-2xl font-mono text-xs text-muted-foreground">
              Curated catalog. Established items reference real published physics; speculative items
              are clearly tagged and are NOT claims of new science.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "established", "frontier", "speculative"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] ${
                  filter === f ? "border-white bg-white/10" : "border-white/15 hover:bg-white/5"
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={exportAll}
              className="border border-accent/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-accent/10"
            >
              Export ledger .md
            </button>
            <Link to="/world" className="border border-white/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-white/5">
              ← World
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 font-mono text-xs">
          <Stat label="Unlocked" v={`${unlocked.length} / ${BREAKTHROUGHS.length}`} />
          <Stat label="Established" v={String(unlocked.filter((u) => getBreakthrough(u.id)?.realityTag === "established").length)} />
          <Stat label="Speculative" v={String(unlocked.filter((u) => getBreakthrough(u.id)?.realityTag === "speculative").length)} />
        </div>

        <div className="border border-white/10">
          {rows.map(({ bt, u }) => {
            const open = openId === bt.id;
            return (
              <div key={bt.id} className="border-b border-white/5 last:border-b-0">
                <button
                  onClick={() => setOpenId(open ? null : bt.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className={`border px-2 py-0.5 font-mono text-[9px] uppercase ${TAG_STYLES[bt.realityTag]}`}>
                      {bt.realityTag}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-chrome">T{bt.tier}</span>
                    <span className="font-bold text-white">{bt.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{bt.category}</span>
                  </div>
                  <div className="text-right font-mono text-[10px]">
                    {u ? (
                      <span className="text-accent">unlocked · {u.discoveredBy}</span>
                    ) : (
                      <span className="text-muted-foreground">locked</span>
                    )}
                  </div>
                </button>
                {open && (
                  <div className="space-y-4 border-t border-white/5 bg-black/30 px-4 py-4 font-mono text-xs">
                    <p className="text-white/85">{bt.summary}</p>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-chrome">Formula</div>
                      <pre className="whitespace-pre-wrap border-l-2 border-accent/40 bg-black/40 px-3 py-2 text-white/90">{bt.formula.expr}</pre>
                      <ul className="mt-2 space-y-0.5 text-[11px] text-white/75">
                        {bt.formula.variables.map((v) => (
                          <li key={v.sym}>
                            <span className="text-accent">{v.sym}</span> — {v.meaning}
                            {v.units ? <span className="text-muted-foreground"> ({v.units})</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-chrome">Components</div>
                      <ul className="space-y-0.5 text-[11px] text-white/80">
                        {bt.blueprint.components.map((c, i) => (
                          <li key={i}>
                            · <span className="text-white">{c.name}</span> × {c.qty} — <span className="text-muted-foreground">{c.spec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-chrome">Assembly</div>
                      <ol className="list-decimal space-y-0.5 pl-5 text-[11px] text-white/80">
                        {bt.blueprint.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-chrome">Schematic</div>
                      <pre className="overflow-x-auto border border-white/10 bg-black/50 p-3 text-[11px] text-white/90">{bt.blueprint.schematic}</pre>
                    </div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      <Cell k="Power" v={bt.blueprint.power} />
                      <Cell k="Footprint" v={bt.blueprint.footprint} />
                      <Cell k="Risks" v={bt.blueprint.risks.join("; ")} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(blueprintMarkdown(bt, u?.discoveredBy, u?.unlockedAt))}
                        className="border border-white/15 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] hover:bg-white/5"
                      >
                        Copy blueprint
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, v }: { label: string; v: string }) {
  return (
    <div className="border border-white/10 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-chrome">{label}</div>
      <div className="mt-1 text-lg font-bold text-white">{v}</div>
    </div>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-white/5 bg-black/40 p-2">
      <div className="text-[9px] uppercase tracking-[0.2em] text-chrome">{k}</div>
      <div className="text-[11px] text-white/85">{v}</div>
    </div>
  );
}
