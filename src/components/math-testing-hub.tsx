import { useState } from "react";
import { QedSolver } from "@/components/qed-solver";
import { QedComputer } from "@/components/qed-computer";
import { QedEngineOverview } from "@/components/qed-engine-overview";
import { FoundationalEquations } from "@/components/foundational-equations";
import { QuantumCircuit } from "@/components/quantum-circuit";
import { PhysicsExplainer } from "@/components/physics-explainer";

type Tab = "solver" | "machine" | "engine" | "equations" | "circuit" | "explainer";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "machine", label: "Talk to the Machine", sub: "QED computer · solve & archive" },
  { id: "solver", label: "QED Solver", sub: "swarm convergence on α" },
  { id: "engine", label: "QED Engine", sub: "perturbative architecture" },
  { id: "equations", label: "Foundational Equations", sub: "core formulae" },
  { id: "circuit", label: "Quantum Circuit", sub: "gate-level playground" },
  { id: "explainer", label: "Why It's Real Physics", sub: "the pillars" },
];

export function MathTestingHub() {
  const [tab, setTab] = useState<Tab>("machine");
  return (
    <section id="math-lab" className="border-t border-white/5 bg-[oklch(0.05_0.01_280)] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            ◉ Math Testing Hub
          </span>
          <h3 className="mt-2 text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            One lab. Every solver.
          </h3>
          <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
            Every math tester in one place. Pick a workbench — solves done here
            auto-archive to the public ledger.
          </p>
        </div>

        <div className="mb-6 grid gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded border px-3 py-2 text-left font-mono text-[10px] transition-colors ${
                tab === t.id
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-white/10 text-white/70 hover:border-accent/30 hover:text-white"
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-widest">{t.label}</div>
              <div className="mt-0.5 text-[9px] text-chrome">{t.sub}</div>
            </button>
          ))}
        </div>

        <div className="rounded border border-white/5 bg-background/40">
          {tab === "machine" && <QedComputer />}
          {tab === "solver" && <QedSolver />}
          {tab === "engine" && <QedEngineOverview />}
          {tab === "equations" && <FoundationalEquations />}
          {tab === "circuit" && <QuantumCircuit />}
          {tab === "explainer" && <PhysicsExplainer />}
        </div>
      </div>
    </section>
  );
}
