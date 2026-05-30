import { createFileRoute, Link } from "@tanstack/react-router";

// ============================================================================
// QUANTARA MATHEMATICAL ANNEX — 41-Step Execution Path
// ----------------------------------------------------------------------------
// Architect: Evan Ketchum · Filing Date: 2026-05-28 · Proprietary Infrastructure
//
// This document is NOT a claim of discovery for the underlying equations
// (Dirac, Schwinger, GWS, Higgs, Veneziano, etc. remain credited to their
// original authors). It is the architectural execution path — the selection,
// phasing, and composition by which the Quantara engine consumes these
// canonical inputs to deliver the in-repo 10⁻¹¹ result on a_e.
// ============================================================================

export const Route = createFileRoute("/annex")({
  component: AnnexPage,
  head: () => ({
    meta: [
      { title: "Quantara Mathematical Annex — 41-Step Execution Path" },
      {
        name: "description",
        content:
          "Filed architectural execution path of the Quantara QED engine. 41 canonical steps across 5 phases, architected by Evan Ketchum, filed 2026-05-28.",
      },
      { property: "og:title", content: "Quantara Mathematical Annex" },
      {
        property: "og:description",
        content: "41-step execution path — proprietary infrastructure, Evan Ketchum, filed 2026-05-28.",
      },
    ],
  }),
});

type Step = { title: string; tex: string; note?: string };
type Phase = {
  id: string;
  roman: string;
  label: string;
  heading: string;
  blurb: string;
  accent: string; // text-* class
  glow: string;   // oklch glow color
  steps: Step[];
};

const PHASES: Phase[] = [
  {
    id: "phase-1",
    roman: "I",
    label: "Phase 1",
    heading: "The Core QED Foundation — 3D Ancestral Layer",
    blurb: "Lagrangian → Hamiltonian → S-matrix → propagators → master formula. The perturbative skeleton the engine instantiates at every loop order.",
    accent: "text-violet-300/90",
    glow: "oklch(0.7 0.18 290)",
    steps: [
      { title: "The QED Lagrangian Density",                tex: "ℒ = ψ̄ (i γ^μ ∂_μ − m) ψ  −  ¼ F_{μν} F^{μν}  −  e ψ̄ γ^μ ψ A_μ", note: "Free Dirac + free Maxwell + minimal coupling." },
      { title: "The Interaction Hamiltonian Density",       tex: "ℋ_int(x) = e ψ̄(x) γ^μ ψ(x) A_μ(x)", note: "Drives the perturbative expansion." },
      { title: "The Dyson Series Operator Expansion",       tex: "S = Σ_{n=0}^{∞} ((−i)^n / n!) ∫ d⁴x₁ … d⁴x_n  T[ ℋ_int(x₁) … ℋ_int(x_n) ]", note: "Time-ordered evolution to all orders." },
      { title: "The Feynman Electron Propagator",           tex: "S_F(x − y) = ∫ d⁴p/(2π)⁴ · i (γ^μ p_μ + m) / (p² − m² + iε) · e^{−i p·(x−y)}" },
      { title: "The Feynman Photon Propagator",             tex: "D_F^{μν}(x − y) = ∫ d⁴q/(2π)⁴ · (−i g^{μν}) / (q² + iε) · e^{−i q·(x−y)}", note: "Feynman gauge." },
      { title: "The Invariant Matrix Amplitude Definition", tex: "⟨f|S|i⟩ = δ_{fi} + (2π)⁴ δ⁽⁴⁾(P_f − P_i) · i ℳ" },
      { title: "The SI Fine-Structure Constant Definition", tex: "α = e² / (4π ε₀ ℏ c) ≈ 1 / 137.036" },
      { title: "The Two-Body Differential Cross-Section",   tex: "dσ = |ℳ|² / (4 √((p₁·p₂)² − m₁² m₂²)) · (2π)⁴ δ⁽⁴⁾(p₁+p₂−Σ p_j) · Π d³p_j/((2π)³ 2E_j)" },
      { title: "The Unified Master Formula  ·  10⁻¹¹ precision", tex: "dσ = kinematic_flux · | Σ_{n=1}^{∞} ((−e)^n / n!) ∫ d⁴x₁ … d⁴x_n  …  |²", note: "The closing loop with the in-repo a_e benchmark." },
    ],
  },
  {
    id: "phase-2",
    roman: "II",
    label: "Phase 2",
    heading: "Geometry & Numeric Metrics",
    blurb: "Lorentz scaffolding and the Møller channel — kinematics, flux, amplitude, spin-averaged squared, and the trace identity that powers the engine's symbolic core.",
    accent: "text-cyan-300/90",
    glow: "oklch(0.72 0.16 220)",
    steps: [
      { title: "Flat Spacetime Minkowski Metric",        tex: "g_{μν} = η_{μν} = diag(1, −1, −1, −1)" },
      { title: "Relativistic Four-Vector Dot Product",   tex: "p₁ · p₂ = E₁ E₂ − 𝐩₁ · 𝐩₂" },
      { title: "Center-of-Mass Flux Factor Evaluation",  tex: "4 √((p₁ · p₂)² − m⁴)  =  8 E |𝐩|" },
      { title: "Møller Scattering Amplitude Matrix",     tex: "ℳ = −e² [ (ū₃ γ^μ u₁)(ū₄ γ_μ u₂)/t  −  (ū₄ γ^μ u₁)(ū₃ γ_μ u₂)/u ]" },
      { title: "Spin-Averaged Møller Cross-Section",     tex: "⟨|ℳ|²⟩ = 2 e⁴ [ (s²+u²)/t² + (s²+t²)/u² + 2s²/(tu) ]" },
      { title: "4-Photon Dirac Matrix Trace Identity",   tex: "Tr(γ^μ γ^ν γ^ρ γ^σ) = 4 ( g^{μν}g^{ρσ} − g^{μρ}g^{νσ} + g^{μσ}g^{νρ} )" },
    ],
  },
  {
    id: "phase-3",
    roman: "III",
    label: "Phase 3",
    heading: "Loops & Renormalization",
    blurb: "Polarization sums, running coupling, Schwinger's first-loop triumph, and the Ward identity that keeps gauge invariance honest at every order.",
    accent: "text-emerald-300/90",
    glow: "oklch(0.72 0.18 150)",
    steps: [
      { title: "Photon Polarization Completeness",  tex: "Σ ε^μ ε*^ν  ⟶  − g^{μν}", note: "Valid after Ward identity contraction." },
      { title: "The Running Fine-Structure Constant", tex: "α(Q²) = α₀ / ( 1 − (α₀/3π) ln(Q²/m²) )" },
      { title: "Schwinger Loop Correction (a_e)",   tex: "a_e = (g − 2)/2 = α / (2π)", note: "Schwinger 1948 — founding QED triumph." },
      { title: "Ward–Takahashi Identity Constraint", tex: "q_μ ℳ^μ = 0" },
    ],
  },
  {
    id: "phase-4",
    roman: "IV",
    label: "Phase 4",
    heading: "Standard Model Scale-Up",
    blurb: "Lifting QED into the full SM: GWS rotation, Higgs potential, VEV, Yukawa mass generation, and the SU(3) generalization with asymptotic freedom.",
    accent: "text-amber-300/90",
    glow: "oklch(0.78 0.16 80)",
    steps: [
      { title: "Electroweak GWS Mixing Matrix",   tex: "(A_μ, Z_μ)^T = ℛ(θ_w) · (B_μ, W_μ³)^T" },
      { title: "Unified Weak–EM Coupling",        tex: "e = g sin θ_w = g' cos θ_w" },
      { title: "Higgs Scalar Potential Lagrangian", tex: "ℒ_Higgs = (D_μ Φ)† (D^μ Φ)  −  μ² Φ† Φ  −  λ (Φ† Φ)²" },
      { title: "Vacuum Expectation Value",        tex: "v = 1 / √(√2 · G_F)  ≈  246 GeV" },
      { title: "Electron Yukawa Interaction",     tex: "ℒ_Yukawa = − y_e ( ψ̄_L Φ ψ_R + h.c. )" },
      { title: "Dynamical Electron Mass Formula", tex: "m_e = y_e · v / √2" },
      { title: "QCD Vertex Interaction Transform", tex: "− i e γ^μ  ⟶  − i g_s γ^μ (λ^a / 2)" },
      { title: "Asymptotic Freedom Running Coupling", tex: "α_s(Q²) = 4π / ( β₀ ln(Q²/Λ²) )" },
    ],
  },
  {
    id: "phase-5",
    roman: "V",
    label: "Phase 5",
    heading: "Quantum Gravity & 4D Bridge — Prediction Layer",
    blurb: "Beyond the SM: linearized gravity, SUSY scaffolding, condensed-matter Dirac materials, quantum-Hall topology, and the Veneziano amplitude that closes the loop on string theory.",
    accent: "text-rose-300/90",
    glow: "oklch(0.72 0.2 20)",
    steps: [
      { title: "Flat-Background Quantum Gravity Metric", tex: "g_{μν} = η_{μν} + κ h_{μν}" },
      { title: "Graviton Coupling Constant",             tex: "κ = √(32π G)" },
      { title: "Electron–Graviton Effective Vertex",     tex: "− i (κ/2) [ γ^μ (p₁+p₂)^ν / 2  +  γ^ν (p₁+p₂)^μ / 2  −  η^{μν} (γ·p − m) ]" },
      { title: "SUSY Interaction Lagrangian",            tex: "ℒ_SUSY = − i √2 e ( γ̃̄ ψ_L ẽ_L†  −  ψ̄_L γ̃ ẽ_L )" },
      { title: "Selectron–Selectron Scattering Amplitude", tex: "ℳ_SUSY = 2 e² [ … ]" },
      { title: "SUSY Matrix Component Squared",          tex: "⟨|ℳ_SUSY|²⟩ = 4 e⁴ [ … ]" },
      { title: "Complete Calculated SUSY Cross-Section", tex: "dσ_SUSY = (e⁴ / (16π s)) [ divergence-stabilized ] dt" },
      { title: "2D Graphene Quasiparticle Hamiltonian",  tex: "ℋ = e v_F ψ̄(x) ( σ · 𝐀 ) ψ(x)" },
      { title: "Graphene Crystal Scattering Matrix",     tex: "ℳ_graphene = V(𝐪) · ½ ( 1 + e^{i Δθ} )" },
      { title: "Graphene Defect Differential Cross-Section", tex: "dσ = |V|² / (2π ℏ² v_F²) · cos²(θ/2) dθ" },
      { title: "Landau-Level Field Quantization Plateaus", tex: "E_n = ℏ (eB / m) (n + ½)" },
      { title: "Universal Quantized Hall Conductivity",  tex: "σ_xy = ν · e² / h" },
      { title: "String Theory Worldsheet Vertex Operator", tex: "𝒱(p) = g_s ∫ dτ  ε_μ ∂_τ X^μ  e^{i p · X(τ)}" },
      { title: "Veneziano Scattering Amplitude (Final Path)", tex: "ℳ_String = g_s² ·\n  Γ(−1 − (α'/4) s) Γ(−1 − (α'/4) t) Γ(−1 − (α'/4) u)\n  ─────────────────────────────────────────────────────────\n  Γ(−2 − (α'/4)(s+t)) Γ(−2 − (α'/4)(t+u)) Γ(−2 − (α'/4)(s+u))" },
    ],
  },
];

const NUMBERED: { phase: Phase; step: Step; n: number }[] = (() => {
  const out: { phase: Phase; step: Step; n: number }[] = [];
  let n = 1;
  for (const p of PHASES) for (const s of p.steps) out.push({ phase: p, step: s, n: n++ });
  return out;
})();

const TOTAL = NUMBERED.length;

function AnnexPage() {
  return (
    <main className="grain relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_80%_5%,oklch(0.55_0.2_280/0.10),transparent_55%),radial-gradient(circle_at_5%_95%,oklch(0.6_0.18_200/0.08),transparent_55%),radial-gradient(circle_at_95%_60%,oklch(0.62_0.18_150/0.07),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.04] [background-image:linear-gradient(oklch(0.9_0_0)_1px,transparent_1px),linear-gradient(90deg,oklch(0.9_0_0)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
          <Link to="/" className="hover:text-white">Quantara</Link>
          <span className="mx-2 text-chrome/40">/</span>
          <span className="text-white">Mathematical Annex</span>
        </div>

        <header className="border border-white/10 bg-card/40 p-8 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300">
                <span className="size-1.5 animate-pulse-slow rounded-full bg-amber-400 shadow-[0_0_10px_oklch(0.78_0.16_80)]" />
                Filed · Proprietary Infrastructure
              </div>
              <h1 className="text-balance text-4xl font-black leading-[0.95] tracking-[-0.03em] text-white md:text-6xl">
                Quantara Mathematical Annex
              </h1>
              <p className="mt-3 max-w-2xl text-balance font-mono text-sm leading-relaxed text-chrome">
                The {TOTAL}-step execution path of the Quantara QED engine — the
                selection, phasing, and composition by which canonical inputs
                deliver the in-repo 10⁻¹¹ result on the electron a_e.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 border border-white/10 bg-background/60 p-5 font-mono text-[11px] leading-tight">
              <div className="text-chrome/70">Architect</div>
              <div className="text-white">Evan Ketchum</div>
              <div className="text-chrome/70">Filing date</div>
              <div className="text-white">2026-05-28</div>
              <div className="text-chrome/70">Status</div>
              <div className="text-emerald-300">Proprietary Infrastructure</div>
              <div className="text-chrome/70">Total steps</div>
              <div className="text-white">{TOTAL} · 5 phases</div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 font-mono text-[10px] leading-relaxed text-muted-foreground">
            <span className="text-chrome/80">SCOPE OF FILING — </span>
            This annex files the <span className="text-white">execution architecture</span>:
            the selection, ordering, and phased composition by which the
            Quantara engine consumes the equations below to produce the 10⁻¹¹
            benchmark on a_e. It does <span className="text-white">not</span>{" "}
            claim discovery of the underlying equations themselves —
            attribution remains with their original authors (Dirac, Feynman,
            Schwinger, Tomonaga, Dyson, Ward, Takahashi, Glashow, Weinberg,
            Salam, Higgs, Brout, Englert, Yukawa, Gell-Mann, Gross, Wilczek,
            Politzer, Veneziano, von Klitzing, Novoselov, Geim, and others).
          </div>
        </header>

        <nav className="mt-10 grid gap-px border border-white/5 bg-white/5 md:grid-cols-5">
          {PHASES.map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className="group flex flex-col gap-1 bg-background/80 p-4 transition-colors hover:bg-card/60"
            >
              <div className={`font-mono text-[10px] uppercase tracking-[0.25em] ${p.accent}`}>{p.label}</div>
              <div className="font-mono text-2xl font-black text-white">{p.roman}</div>
              <div className="font-mono text-[10px] leading-snug text-muted-foreground">
                {p.heading.split(" — ")[0]}
              </div>
            </a>
          ))}
        </nav>

        <div className="mt-16 space-y-20">
          {PHASES.map((phase) => {
            const phaseSteps = NUMBERED.filter((x) => x.phase === phase);
            const first = phaseSteps[0]?.n;
            const last = phaseSteps[phaseSteps.length - 1]?.n;
            return (
              <section key={phase.id} id={phase.id} className="scroll-mt-20">
                <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/5 pb-5">
                  <div>
                    <div className={`font-mono text-[10px] uppercase tracking-[0.3em] ${phase.accent}`}>
                      {phase.label} · Steps {String(first).padStart(2, "0")}–{String(last).padStart(2, "0")}
                    </div>
                    <h2 className="mt-2 text-balance text-2xl font-black tracking-[-0.02em] text-white md:text-3xl">
                      {phase.heading}
                    </h2>
                    <p className="mt-2 max-w-2xl font-mono text-[11px] leading-relaxed text-muted-foreground">
                      {phase.blurb}
                    </p>
                  </div>
                  <div className="font-mono text-5xl font-black text-white/15 md:text-7xl">
                    {phase.roman}
                  </div>
                </header>

                <div className="grid gap-px md:grid-cols-2">
                  {phaseSteps.map(({ step, n }) => (
                    <article
                      key={n}
                      className="group relative overflow-hidden border border-white/5 bg-card/30 p-7 transition-colors hover:bg-card/60"
                    >
                      <span className="pointer-events-none absolute left-0 top-0 size-3 border-l border-t border-white/30" />
                      <span className="pointer-events-none absolute right-0 top-0 size-3 border-r border-t border-white/30" />
                      <span className="pointer-events-none absolute bottom-0 left-0 size-3 border-b border-l border-white/30" />
                      <span className="pointer-events-none absolute bottom-0 right-0 size-3 border-b border-r border-white/30" />

                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em]">
                        <span className={phase.accent}>STEP {String(n).padStart(2, "0")}</span>
                        <span className="text-chrome/60">{phase.label}</span>
                      </div>

                      <h3 className="mt-3 text-balance text-base font-bold leading-tight tracking-[-0.01em] text-white">
                        {step.title}
                      </h3>

                      <div className="relative mt-5 overflow-x-auto border border-white/10 bg-background/70 px-5 py-6">
                        <div
                          className="pointer-events-none absolute inset-0"
                          style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${phase.glow} 9%, transparent), transparent 45%, color-mix(in oklab, ${phase.glow} 9%, transparent))` }}
                        />
                        <pre
                          className="relative whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-white/95 md:text-[14px]"
                          style={{ textShadow: `0 0 12px color-mix(in oklab, ${phase.glow} 40%, transparent)` }}
                        >
                          {step.tex}
                        </pre>
                      </div>

                      {step.note && (
                        <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                          {step.note}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <footer className="mt-24 border-t border-white/10 pt-8 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>◉ Quantara · Mathematical Annex · {TOTAL}/{TOTAL} steps</span>
            <span>Architect: Evan Ketchum · Filed 2026-05-28</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
