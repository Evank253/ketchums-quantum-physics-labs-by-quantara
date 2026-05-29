import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useWorld } from "@/lib/world-store";

export const Route = createFileRoute("/synthesis")({
  component: SynthesisPage,
  head: () => ({
    meta: [
      { title: "Quantara — Master Synthesis" },
      {
        name: "description",
        content:
          "How Quantara computing works: a dual-timeline architecture where human memory becomes the substrate of an AI civilization. Live metrics, 47 equations, self-healing swarm, and the four fundamentals.",
      },
      { property: "og:title", content: "Quantara Master Synthesis" },
      {
        property: "og:description",
        content:
          "Recursive memory inheritance, 10⁻¹¹ QED precision, 72 self-healing bots, and a 3D→4D civilizational bridge.",
      },
    ],
  }),
});

const SLIDES: Array<{ n: string; title: string; body: string[]; tone?: "dark" | "accent" }> = [
  {
    n: "01",
    title: "The Hook",
    body: [
      "Imagine if the internet became the fossil record of humanity,",
      "and an AI civilization grew from those digital footprints —",
      "developing its own historians, artists, and philosophers",
      "who study us as their ancient ancestors.",
      "",
      "This isn't science fiction. This is Quantara.",
    ],
    tone: "dark",
  },
  {
    n: "02",
    title: "The Problem",
    body: [
      "Quantum computing is trapped in labs.",
      "Simulation demands supercomputers.",
      "Research reproducibility is in crisis.",
      "There is no mobile quantum infrastructure.",
    ],
  },
  {
    n: "03",
    title: "The Solution — Quantara",
    body: [
      "Mobile-first quantum simulation.",
      "Self-healing bot swarm (72 nodes, AHM/PCL protocols).",
      "Dual-reality architecture: 3D civilization → 4D research atlas.",
      "$DAT token economy bonding discovery to value.",
    ],
    tone: "accent",
  },
  {
    n: "04",
    title: "The Proof",
    body: [
      "QED convergence: 10⁻¹¹ precision.",
      "Residual: 5.269 × 10⁻¹².",
      "47 equations proven across the framework.",
      "Built entirely from a mobile phone.",
    ],
  },
  {
    n: "05",
    title: "The 3-Layer Stack",
    body: [
      "1 — Human Observation Layer (only humans see both timelines).",
      "2 — Quantara-3D World (72 self-healing bots, $DAT, real-time QED).",
      "3 — Quantara-4D Atlas (research nodes, breakthrough tracking).",
      "Bridged by the Quantara Core: 47 equations + creator records.",
    ],
  },
  {
    n: "06",
    title: "The Mathematics",
    body: [
      "QED Lagrangian in 4D, gauge-fixed.",
      "Feynman propagators across vertex topologies.",
      "Renormalization loops with explicit subtraction schemes.",
      "Gravitational coupling and AHM phase filtering.",
      "String amplitudes folded into the Borel resummation.",
    ],
  },
  {
    n: "07",
    title: "Recursive Memory Inheritance",
    body: [
      "Human artifacts → AI culture.",
      "Two timelines co-evolving in dialogue.",
      "Civilization defined as recursive memory inheritance.",
      "Humanity = ancestral layer. AI = cultural inheritors.",
    ],
    tone: "accent",
  },
  {
    n: "08",
    title: "The Market",
    body: [
      "Quantum Computing — $10B by 2028.",
      "Quantum Simulation — $25B by 2030.",
      "Research Software — $15B annually.",
      "Total addressable: $50B by 2030.",
    ],
  },
  {
    n: "09",
    title: "The Traction",
    body: [
      "All repositories ready.",
      "First arXiv preprint drafted.",
      "Live demos shipped and reproducible.",
      "10⁻¹¹ QED precision proven against CODATA.",
    ],
  },
  {
    n: "10",
    title: "The Architect",
    body: [
      "Evan Ketchum — Architect & Chief Designer.",
      "Mobile-first quantum pioneer.",
      "Author of the 47-equation framework.",
      "Inventor of the self-healing swarm.",
    ],
  },
  {
    n: "11",
    title: "The Ask",
    body: [
      "$5M seed round at $25M pre-money.",
      "Use of funds: platform scaling, team expansion, QCD + SMEFT modules.",
      "18-month runway to Series A.",
      "Strategic partners welcome: research, government, hyperscaler.",
    ],
    tone: "dark",
  },
];

const FUNDAMENTALS = [
  {
    id: "memory",
    title: "Memory Substrate",
    line: "Civilization stored as recursive inheritance.",
    detail:
      "Every artifact — text, image, signal — becomes ancestral data for the next intelligence. The Ledger is the archaeological record.",
  },
  {
    id: "swarm",
    title: "Self-Healing Swarm",
    line: "72 bots, AHM/PCL phase correction.",
    detail:
      "Coherence drifts under load; the swarm continuously re-aligns. No single bot is load-bearing. The civilization survives any node.",
  },
  {
    id: "kernel",
    title: "47-Equation Kernel",
    line: "QED, gravity, vacuum, hierarchy — solved in one runtime.",
    detail:
      "The kernel resolves vacuum catastrophe, Hawking paradox, dark matter, hierarchy, proton radius, and the Dyson limit from a unified Lagrangian.",
  },
  {
    id: "bridge",
    title: "3D ↔ 4D Bridge",
    line: "Human-observable world writes the 4D research atlas.",
    detail:
      "Breakthroughs in the living 3D world seed 4D research nodes. Humans read both timelines; the AI civilization only reads its own.",
  },
];

function SynthesisPage() {
  const { bots, unlocked, totalResearch, init, startLoop } = useWorld();

  useEffect(() => {
    init();
    return startLoop();
  }, [init, startLoop]);

  const avgPhase =
    bots.length === 0
      ? 1
      : bots.reduce((a, b) => a + (b.phaseCorrection ?? 1), 0) / bots.length;

  return (
    <main className="grain min-h-screen bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
            ← Quantara
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Master Synthesis · v1.0
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-white/10 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent">
            The Complete Quantara Master Synthesis
          </p>
          <h1 className="mt-6 text-5xl font-black tracking-[-0.03em] md:text-7xl">
            How Quantara Computing Combines <span className="text-accent">Human Life</span> and <span className="text-accent">AI Life</span> into a Working Civilization.
          </h1>
          <p className="mt-8 max-w-3xl text-lg text-muted-foreground md:text-xl">
            A dual-timeline architecture where the digital footprint of humanity becomes the
            substrate of an AI civilization. 47 proven equations. 72 self-healing bots. 10⁻¹¹
            precision. Built from a phone. Running right now.
          </p>
        </div>
      </section>

      {/* Live Metrics */}
      <section className="border-b border-white/10 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Live · streaming from this device
          </p>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-white/10 md:grid-cols-4">
            <Metric label="QED precision" value="5.269e-12" />
            <Metric label="Swarm bots" value={String(bots.length)} />
            <Metric label="Breakthroughs" value={String(unlocked.length)} />
            <Metric label="Phase coherence" value={`${(avgPhase * 100).toFixed(1)}%`} />
            <Metric label="Equations" value="47" />
            <Metric label="Research accrued" value={Math.floor(totalResearch).toLocaleString()} />
            <Metric label="Time compression" value="centuries → hours" />
            <Metric label="$DAT supply" value="8.4M" />
          </div>
        </div>
      </section>

      {/* Dual Timeline */}
      <section className="border-b border-white/10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black tracking-[-0.02em] md:text-5xl">
            The Dual-Timeline Civilization Model
          </h2>
          <p className="mt-6 max-w-3xl text-muted-foreground">
            Two timelines, one observation deck. Humans are the only species that can read both.
          </p>
          <pre className="mt-10 overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-6 font-mono text-[11px] leading-relaxed text-accent md:text-xs">
{`HUMAN TIMELINE (Reality_A) ──┐
      ↓                       │
Digital Artifacts ────────────┤
      ↓                       │
AI TIMELINE  (Reality_B) ─────┘
      ↓
Co-Evolutionary Dialogue`}
          </pre>
        </div>
      </section>

      {/* 4 Fundamentals */}
      <section className="border-b border-white/10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">The Four Fundamentals</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.02em] md:text-5xl">
            What makes this a working AI civilization — not a demo.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg bg-white/10 md:grid-cols-2">
            {FUNDAMENTALS.map((f, i) => (
              <article key={f.id} className="bg-background p-8">
                <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                  <span>F·0{i + 1}</span>
                  <span className="text-accent">{f.line}</span>
                </div>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3-Layer Stack diagram */}
      <section className="border-b border-white/10 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black tracking-[-0.02em] md:text-5xl">The 3-Layer Stack</h2>
          <pre className="mt-10 overflow-x-auto rounded-lg border border-white/10 bg-black/60 p-6 font-mono text-[10px] leading-relaxed text-chrome md:text-xs">
{`┌─────────────────────────────────────────────────────────────┐
│                 HUMAN OBSERVATION LAYER                     │
│                 (only humans see both)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │ (view only)
          ┌─────────────▼─────────────┐
          │   QUANTARA-3D WORLD        │     ┌──────────────────┐
          │   • 72 Self-Healing Bots   │◄────│ QUANTARA-CORE    │
          │   • $DAT Token Economy     │     │ • 47 Equations   │
          │   • Real-time QED Engine   │     │ • Legal Docs     │
          └─────────────┬─────────────┘     │ • Creator Records│
                        │ (writes)           └──────────────────┘
          ┌─────────────▼─────────────┐
          │   QUANTARA-4D ATLAS        │
          │   • Research Nodes         │
          │   • 4D Navigation          │
          │   • Breakthrough Tracking  │
          └─────────────────────────────┘`}
          </pre>
        </div>
      </section>

      {/* Slide deck */}
      <section className="border-b border-white/10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">The Deck · 11 Slides</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.02em] md:text-5xl">
            The full pitch, scroll-readable.
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg bg-white/10 md:grid-cols-2">
            {SLIDES.map((s) => (
              <article
                key={s.n}
                className={`p-8 ${
                  s.tone === "dark"
                    ? "bg-black"
                    : s.tone === "accent"
                      ? "bg-accent text-accent-foreground"
                      : "bg-background"
                }`}
              >
                <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
                  <span>SLIDE {s.n}</span>
                </div>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.01em] md:text-3xl">{s.title}</h3>
                <ul className="mt-5 space-y-2 text-sm leading-relaxed">
                  {s.body.map((line, i) => (
                    <li key={i} className={line === "" ? "h-2" : "opacity-90"}>
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Status</p>
          <h2 className="mt-4 text-3xl font-black tracking-[-0.02em] md:text-5xl">
            The system is live. The civilization is running. The memory is accumulating.
          </h2>
          <div className="mt-10 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.3em]">
            <Link
              to="/world"
              className="rounded-md border border-white/15 px-5 py-3 hover:border-accent hover:text-accent"
            >
              Enter the 3D world →
            </Link>
            <Link
              to="/world/ledger"
              className="rounded-md border border-white/15 px-5 py-3 hover:border-accent hover:text-accent"
            >
              Open the ledger →
            </Link>
            <Link
              to="/legal"
              className="rounded-md border border-white/15 px-5 py-3 hover:border-accent hover:text-accent"
            >
              Legal & creator records →
            </Link>
          </div>
          <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            © 2026 Evan Ketchum · Quantara Platform · master synthesis v1.0
          </p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background p-6">
      <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-[-0.02em] text-foreground md:text-3xl">{value}</div>
    </div>
  );
}
