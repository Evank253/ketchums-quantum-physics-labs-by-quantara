// Foundational Equations — the full canon, from Møller QED through strings.
// Pure presentation: equations grouped by domain, rendered as a working
// physicist's notebook. No business logic.

type Eq = {
  id: string;
  title: string;
  tex: string;
  note: string;
};

type Domain = {
  id: string;
  label: string;
  heading: string;
  blurb: string;
  accent: string; // tailwind text color class
  glow: string;   // oklch glow color
  equations: Eq[];
};

const DOMAINS: Domain[] = [
  {
    id: "qed-core",
    label: "I · Quantum Electrodynamics",
    heading: "The QED spine",
    blurb: "Lagrangian → Hamiltonian → Dyson → propagators → S-matrix. Everything Møller, Bhabha, and Compton inherit.",
    accent: "text-violet-300/80",
    glow: "oklch(0.7 0.18 290)",
    equations: [
      { id: "metric",   title: "Flat-Spacetime Minkowski Metric",         tex: "g_{μν} = η_{μν} = diag(1, −1, −1, −1)", note: "Mostly-minus signature." },
      { id: "dot",      title: "Relativistic Four-Vector Dot Product",    tex: "p₁ · p₂ = E₁ E₂ − 𝐩₁ · 𝐩₂", note: "Lorentz-invariant scalar." },
      { id: "flux",     title: "CM Flux Factor",                          tex: "4 √((p₁ · p₂)² − m⁴)  =  8 E |𝐩|", note: "Normalizes the differential cross section." },
      { id: "lagr",     title: "The QED Lagrangian Density",              tex: "ℒ = ψ̄ (i γ^μ ∂_μ − m) ψ  −  ¼ F_{μν} F^{μν}  −  e ψ̄ γ^μ ψ A_μ", note: "Free Dirac + free Maxwell + minimal coupling." },
      { id: "hint",     title: "Interaction Hamiltonian Density",         tex: "ℋ_int(x) = e ψ̄(x) γ^μ ψ(x) A_μ(x)", note: "Drives the perturbative expansion." },
      { id: "dyson",    title: "Dyson Series Operator Expansion",         tex: "S = Σ_{n=0}^{∞} ((−i)^n / n!) ∫ d⁴x₁ … d⁴x_n  T[ ℋ_int(x₁) … ℋ_int(x_n) ]", note: "Time-ordered evolution to all orders." },
      { id: "sf",       title: "Feynman Electron Propagator",             tex: "S_F(x − y) = ∫ d⁴p/(2π)⁴ · i (γ^μ p_μ + m) / (p² − m² + iε) · e^{−i p·(x−y)}", note: "Fermion line in momentum space." },
      { id: "df",       title: "Feynman Photon Propagator",               tex: "D_F^{μν}(x − y) = ∫ d⁴q/(2π)⁴ · (−i g^{μν}) / (q² + iε) · e^{−i q·(x−y)}", note: "Feynman gauge." },
      { id: "amp",      title: "Møller Scattering Matrix Element",        tex: "ℳ = −e² [ (ū₃ γ^μ u₁)(ū₄ γ_μ u₂)/t  −  (ū₄ γ^μ u₁)(ū₃ γ_μ u₂)/u ]", note: "t-channel minus u-channel antisymmetry." },
      { id: "xsec",     title: "Spin-Averaged Møller ⟨|ℳ|²⟩",             tex: "⟨|ℳ|²⟩ = 2 e⁴ [ (s²+u²)/t² + (s²+t²)/u² + 2s²/(tu) ]", note: "Crossing-symmetric in (s,t,u)." },
      { id: "trace",    title: "Four-Gamma Dirac Trace Identity",         tex: "Tr(γ^μ γ^ν γ^ρ γ^σ) = 4 ( g^{μν}g^{ρσ} − g^{μρ}g^{νσ} + g^{μσ}g^{νρ} )", note: "Three pairings, six terms." },
      { id: "sfi",      title: "Invariant Amplitude Definition",          tex: "⟨f|S|i⟩ = δ_{fi} + (2π)⁴ δ⁽⁴⁾(P_f − P_i) · i ℳ", note: "Splits trivial part from physics." },
      { id: "alpha",    title: "SI Fine-Structure Constant",              tex: "α = e² / (4π ε₀ ℏ c) ≈ 1 / 137.036", note: "The dimensionless QED coupling." },
      { id: "dsig",     title: "Two-Body Differential Cross-Section",     tex: "dσ = |ℳ|² / (4 √((p₁·p₂)² − m₁² m₂²)) · (2π)⁴ δ⁽⁴⁾(p₁+p₂−Σ p_j) · Π d³p_j/((2π)³ 2E_j)", note: "Flux × |ℳ|² × Lorentz-invariant phase space." },
      { id: "master",   title: "Unified Master Formula  ·  10⁻¹¹ precision", tex: "dσ = kinematic_flux · | Σ_{n=1}^{∞} ((−e)^n / n!) ∫ d⁴x₁ … d⁴x_n  …  |²", note: "Closes the loop with the Quantara engine result." },
      { id: "pol",      title: "Photon Polarization Completeness",        tex: "Σ ε^μ ε*^ν  ⟶  − g^{μν}", note: "Valid after Ward identity contraction." },
      { id: "running",  title: "Running Fine-Structure Constant",         tex: "α(Q²) = α₀ / (1 − (α₀ / 3π) ln(Q²/m²))", note: "Vacuum polarization → Landau pole at high Q²." },
      { id: "schwinger",title: "Schwinger 1-Loop Anomalous Moment",       tex: "a_e = (g − 2)/2 = α / (2π)", note: "Schwinger 1948 — the founding QED triumph." },
      { id: "ward",     title: "Ward–Takahashi Identity",                 tex: "q_μ ℳ^μ = 0", note: "Gauge invariance at the amplitude level." },
    ],
  },
  {
    id: "ew-higgs",
    label: "II · Electroweak + Higgs",
    heading: "Unification and mass",
    blurb: "GWS rotation, Higgs potential, vacuum expectation value, Yukawa coupling — where the electron earns its mass.",
    accent: "text-cyan-300/80",
    glow: "oklch(0.7 0.18 220)",
    equations: [
      { id: "gws",      title: "GWS Mixing Matrix",                       tex: "(A_μ, Z_μ)^T = ℛ(θ_w) · (B_μ, W_μ³)^T", note: "Weinberg rotation of B and W³." },
      { id: "couple",   title: "Unified Weak–EM Coupling",                tex: "e = g sin θ_w = g' cos θ_w", note: "Ties electric charge to SU(2) and U(1)." },
      { id: "higgs",    title: "Higgs Scalar Potential",                  tex: "ℒ_Higgs = (D_μ Φ)† (D^μ Φ)  −  μ² Φ† Φ  −  λ (Φ† Φ)²", note: "Mexican-hat potential with μ² < 0." },
      { id: "vev",      title: "Vacuum Expectation Value",                tex: "v = 1 / √(√2 · G_F)  ≈  246 GeV", note: "Scale of electroweak symmetry breaking." },
      { id: "yuk",      title: "Electron Yukawa Interaction",             tex: "ℒ_Yukawa = − y_e ( ψ̄_L Φ ψ_R + h.c. )", note: "Couples the Higgs doublet to the electron." },
      { id: "mass",     title: "Dynamical Electron Mass",                 tex: "m_e = y_e · v / √2", note: "Mass arises from EW symmetry breaking." },
    ],
  },
  {
    id: "qcd",
    label: "III · QCD",
    heading: "Strong sector",
    blurb: "Gauge generalization: U(1) → SU(3). Gell-Mann matrices in, asymptotic freedom out.",
    accent: "text-emerald-300/80",
    glow: "oklch(0.72 0.18 150)",
    equations: [
      { id: "vertex",   title: "QCD Vertex Interaction Transform",        tex: "− i e γ^μ  ⟶  − i g_s γ^μ (λ^a / 2)", note: "Color matrices replace the bare charge." },
      { id: "asfree",   title: "Asymptotic Freedom Running",              tex: "α_s(Q²) = 4π / ( β₀ ln(Q²/Λ²) )", note: "Coupling weakens at high Q² — Gross–Wilczek–Politzer." },
    ],
  },
  {
    id: "gravity",
    label: "IV · Quantum Gravity (Linearized)",
    heading: "Graviton as a small ripple",
    blurb: "Treat g_{μν} as flat plus a quantum perturbation. Get a perturbative graviton — non-renormalizable, but instructive.",
    accent: "text-fuchsia-300/80",
    glow: "oklch(0.7 0.2 320)",
    equations: [
      { id: "linearg",  title: "Flat-Background Quantum Gravity Metric",  tex: "g_{μν} = η_{μν} + κ h_{μν}", note: "h_{μν} is the graviton field." },
      { id: "kappa",    title: "Graviton Coupling Constant",              tex: "κ = √(32π G)", note: "Newton's constant sets the strength." },
      { id: "egrav",    title: "Electron–Graviton Effective Vertex",      tex: "− i (κ/2) [ γ^μ (p₁+p₂)^ν / 2  +  γ^ν (p₁+p₂)^μ / 2  −  η^{μν} (γ·p − m) ]", note: "Symmetric in (μ,ν), as required by spin-2." },
    ],
  },
  {
    id: "susy",
    label: "V · Supersymmetry",
    heading: "Selectrons and photinos",
    blurb: "Each SM particle gets a superpartner. The schematic SUSY pieces the Quantara engine carries for cross-section bookkeeping.",
    accent: "text-amber-300/80",
    glow: "oklch(0.78 0.16 80)",
    equations: [
      { id: "lsusy",    title: "SUSY Interaction Lagrangian",             tex: "ℒ_SUSY = − i √2 e ( γ̃̄ ψ_L ẽ_L†  −  ψ̄_L γ̃ ẽ_L )", note: "Photino–electron–selectron coupling." },
      { id: "msusy",    title: "Selectron–Selectron Amplitude",           tex: "ℳ_SUSY = 2 e² [ … ]", note: "Schematic structure; channels analogous to Møller." },
      { id: "msusy2",   title: "SUSY Matrix Component Squared",           tex: "⟨|ℳ_SUSY|²⟩ = 4 e⁴ [ … ]", note: "Spin-averaged superpartner exchange." },
      { id: "dssusy",   title: "Complete SUSY Cross-Section",             tex: "dσ_SUSY = (e⁴ / (16π s)) [ divergence-stabilized ] dt", note: "Soft-divergence handling baked in." },
    ],
  },
  {
    id: "condensed",
    label: "VI · Graphene + Quantum Hall",
    heading: "Dirac matter on a lattice",
    blurb: "Same Dirac algebra, now in 2D with Fermi velocity v_F. Quantized transport and Landau plateaus.",
    accent: "text-sky-300/80",
    glow: "oklch(0.78 0.14 230)",
    equations: [
      { id: "hgraph",   title: "2D Graphene Quasiparticle Hamiltonian",   tex: "ℋ = e v_F ψ̄(x) ( σ · 𝐀 ) ψ(x)", note: "Pauli matrices on sublattice A/B." },
      { id: "mgraph",   title: "Graphene Crystal Scattering Matrix",      tex: "ℳ_graphene = V(𝐪) · ½ ( 1 + e^{i Δθ} )", note: "Pseudospin interference — chirality is destiny." },
      { id: "dsg",      title: "Graphene Defect Cross-Section",           tex: "dσ = |V|² / (2π ℏ² v_F²) · cos²(θ/2) dθ", note: "Klein-tunneling forward-scattering bias." },
      { id: "landau",   title: "Landau-Level Quantization",               tex: "E_n = ℏ (eB / m) (n + ½)", note: "Equally spaced plateaus in a magnetic field." },
      { id: "hall",     title: "Universal Quantized Hall Conductivity",   tex: "σ_xy = ν · e² / h", note: "Topological invariant. Metrology-grade." },
    ],
  },
  {
    id: "strings",
    label: "VII · String Theory",
    heading: "Worldsheet and Veneziano",
    blurb: "Vertex operators on the worldsheet, and the amplitude that started it all.",
    accent: "text-rose-300/80",
    glow: "oklch(0.72 0.2 20)",
    equations: [
      { id: "vop",      title: "Worldsheet Vertex Operator",              tex: "𝒱(p) = g_s ∫ dτ  ε_μ ∂_τ X^μ  e^{i p · X(τ)}", note: "Insertion that emits a string state of momentum p." },
      { id: "ven",      title: "Veneziano Scattering Amplitude",          tex: "ℳ_String = g_s² ·\n  Γ(−1 − (α'/4) s) Γ(−1 − (α'/4) t) Γ(−1 − (α'/4) u)\n  ─────────────────────────────────────────────────────────\n  Γ(−2 − (α'/4)(s+t)) Γ(−2 − (α'/4)(t+u)) Γ(−2 − (α'/4)(s+u))", note: "Dual-resonance amplitude — the origin of the whole field." },
    ],
  },
];

export function FoundationalEquations() {
  return (
    <section id="equations" className="relative overflow-hidden border-t border-white/5 px-6 py-24">
      {/* atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_5%,oklch(0.55_0.2_280/0.10),transparent_55%),radial-gradient(circle_at_5%_95%,oklch(0.6_0.18_200/0.08),transparent_55%),radial-gradient(circle_at_95%_60%,oklch(0.62_0.18_150/0.07),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(oklch(0.9_0_0)_1px,transparent_1px),linear-gradient(90deg,oklch(0.9_0_0)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* section header */}
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              <span className="size-1.5 animate-pulse-slow rounded-full bg-violet-400 shadow-[0_0_10px_oklch(0.7_0.2_290)]" />
              Canon · Foundational Equations
            </div>
            <h2 className="text-balance text-3xl font-black leading-[0.95] tracking-[-0.03em] text-white md:text-6xl">
              From <span className="bg-gradient-to-r from-violet-300 via-cyan-200 to-emerald-300 bg-clip-text text-transparent">η_{`{μν}`}</span> to the <span className="bg-gradient-to-r from-amber-200 via-rose-300 to-fuchsia-300 bg-clip-text text-transparent">Veneziano amplitude</span>.
            </h2>
            <p className="mt-4 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
              Seven domains, one continuous algebraic thread: QED → electroweak →
              QCD → linearized gravity → SUSY → 2D Dirac matter → strings. Every
              line here is consumed by the Quantara engine at some loop order.
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome/70">
            mostly-minus · ℏ = c = 1
          </div>
        </div>

        {/* domain stack */}
        <div className="space-y-20">
          {DOMAINS.map((d, di) => (
            <div key={d.id} id={`canon-${d.id}`} className="relative">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <div className={`font-mono text-[10px] uppercase tracking-[0.3em] ${d.accent}`}>{d.label}</div>
                  <h3 className="mt-2 text-balance text-2xl font-black tracking-[-0.02em] text-white md:text-3xl">
                    {d.heading}
                  </h3>
                  <p className="mt-2 max-w-2xl font-mono text-[11px] leading-relaxed text-muted-foreground">{d.blurb}</p>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome/60">
                  {String(di + 1).padStart(2, "0")} / {String(DOMAINS.length).padStart(2, "0")}
                </div>
              </div>

              <div className="grid gap-px md:grid-cols-2">
                {d.equations.map((eq, i) => (
                  <article
                    key={eq.id}
                    className="group relative overflow-hidden border border-white/5 bg-card/30 p-7 transition-colors hover:bg-card/60"
                  >
                    {/* corner accents */}
                    <span className="pointer-events-none absolute left-0 top-0 size-3 border-l border-t border-white/30" />
                    <span className="pointer-events-none absolute right-0 top-0 size-3 border-r border-t border-white/30" />
                    <span className="pointer-events-none absolute bottom-0 left-0 size-3 border-b border-l border-white/30" />
                    <span className="pointer-events-none absolute bottom-0 right-0 size-3 border-b border-r border-white/30" />

                    <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em]">
                      <span className={d.accent}>{eq.id}</span>
                      <span className="text-chrome/60">{String(i + 1).padStart(2, "0")} / {String(d.equations.length).padStart(2, "0")}</span>
                    </div>

                    <h4 className="mt-3 text-balance text-base font-bold leading-tight tracking-[-0.01em] text-white">
                      {eq.title}
                    </h4>

                    <div className="relative mt-5 overflow-x-auto border border-white/10 bg-background/70 px-5 py-6">
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${d.glow} 8%, transparent), transparent 45%, color-mix(in oklab, ${d.glow} 8%, transparent))` }}
                      />
                      <pre
                        className="relative whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-white/95 md:text-[14px]"
                        style={{ textShadow: `0 0 12px color-mix(in oklab, ${d.glow} 40%, transparent)` }}
                      >
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
          ))}
        </div>
      </div>
    </section>
  );
}
