// Foundational Equations — QED canon rendered as a visual theme section.
// Pure presentation: no business logic. Equations are typeset with LaTeX-style
// monospace + subtle glow so the page reads as a working physicist's notebook.

type Eq = {
  id: string;
  label: string;
  title: string;
  tex: string;
  note: string;
};

const EQUATIONS: Eq[] = [
  {
    id: "metric",
    label: "01 · Geometry",
    title: "Flat Spacetime Minkowski Metric",
    tex: "g_{μν} = η_{μν} = diag(1, −1, −1, −1)",
    note: "Mostly-minus signature. Sets the stage for every Lorentz-invariant contraction below.",
  },
  {
    id: "dot",
    label: "02 · Kinematics",
    title: "Relativistic Four-Vector Dot Product",
    tex: "p₁ · p₂ = E₁ E₂ − 𝐩₁ · 𝐩₂",
    note: "Invariant scalar built from two on-shell four-momenta. Foundation of every Mandelstam variable.",
  },
  {
    id: "flux",
    label: "03 · CM Frame",
    title: "Center-of-Mass Flux Factor",
    tex: "4 √((p₁ · p₂)² − m⁴)  =  8 E |𝐩|",
    note: "The Møller flux in the CM frame — normalizes the differential cross section.",
  },
  {
    id: "amp",
    label: "04 · Amplitude",
    title: "Møller Scattering Matrix Element",
    tex: "ℳ = −e² [ (ū₃ γ^μ u₁)(ū₄ γ_μ u₂) / t  −  (ū₄ γ^μ u₁)(ū₃ γ_μ u₂) / u ]",
    note: "t-channel minus u-channel: the antisymmetry that enforces Fermi–Dirac statistics for e⁻e⁻.",
  },
  {
    id: "xsec",
    label: "05 · Cross Section",
    title: "Spin-Averaged Møller |ℳ|²",
    tex: "⟨|ℳ|²⟩ = 2 e⁴ [ (s² + u²)/t² + (s² + t²)/u² + 2s²/(t u) ]",
    note: "Crossing-symmetric in (s, t, u). The interference term 2s²/(tu) is the quantum signature.",
  },
  {
    id: "trace",
    label: "06 · Trace Algebra",
    title: "Four-Gamma Dirac Trace Identity",
    tex: "Tr(γ^μ γ^ν γ^ρ γ^σ) = 4 ( g^{μν} g^{ρσ} − g^{μρ} g^{νσ} + g^{μσ} g^{νρ} )",
    note: "The combinatorial engine behind every spin-summed QED amplitude. Six terms, three pairings.",
  },
];

export function FoundationalEquations() {
  return (
    <section id="equations" className="relative overflow-hidden border-t border-white/5 px-6 py-24">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,oklch(0.55_0.2_280/0.10),transparent_55%),radial-gradient(circle_at_10%_90%,oklch(0.6_0.18_200/0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(oklch(0.9_0_0)_1px,transparent_1px),linear-gradient(90deg,oklch(0.9_0_0)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              <span className="size-1.5 animate-pulse-slow rounded-full bg-violet-400 shadow-[0_0_10px_oklch(0.7_0.2_290)]" />
              Canon · Foundational Equations
            </div>
            <h2 className="text-balance text-3xl font-black leading-[0.95] tracking-[-0.03em] text-white md:text-5xl">
              The six lines that <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">build QED</span>.
            </h2>
            <p className="mt-3 max-w-xl font-mono text-xs leading-relaxed text-muted-foreground">
              From the Minkowski metric to the four-gamma trace identity — the
              algebraic spine of every Møller, Bhabha, and Compton calculation
              the Quantara engine runs.
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome/70">
            mostly-minus · ℏ = c = 1
          </div>
        </div>

        <div className="grid gap-px md:grid-cols-2">
          {EQUATIONS.map((eq, i) => (
            <article
              key={eq.id}
              className="group relative overflow-hidden border border-white/5 bg-card/30 p-7 transition-colors hover:bg-card/60"
            >
              {/* corner accents */}
              <span className="pointer-events-none absolute left-0 top-0 size-3 border-l border-t border-violet-400/40" />
              <span className="pointer-events-none absolute right-0 top-0 size-3 border-r border-t border-cyan-400/40" />
              <span className="pointer-events-none absolute bottom-0 left-0 size-3 border-b border-l border-cyan-400/40" />
              <span className="pointer-events-none absolute bottom-0 right-0 size-3 border-b border-r border-violet-400/40" />

              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em]">
                <span className="text-violet-300/80">{eq.label}</span>
                <span className="text-chrome/60">{String(i + 1).padStart(2, "0")} / {String(EQUATIONS.length).padStart(2, "0")}</span>
              </div>

              <h3 className="mt-3 text-balance text-lg font-bold leading-tight tracking-[-0.01em] text-white">
                {eq.title}
              </h3>

              <div className="relative mt-5 overflow-x-auto border border-white/10 bg-background/70 px-5 py-6">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,oklch(0.6_0.18_290/0.06),transparent_40%,oklch(0.6_0.18_200/0.06))]" />
                <pre className="relative whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-white/95 [text-shadow:0_0_12px_oklch(0.7_0.18_280/0.35)] md:text-[15px]">
                  {eq.tex}
                </pre>
              </div>

              <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
                {eq.note}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
