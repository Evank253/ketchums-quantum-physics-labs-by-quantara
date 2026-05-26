// Curated catalog of "breakthroughs" the bots procedurally unlock in Quantara World.
// Mix of established physics/engineering, frontier research, and speculative concepts.
// Speculative entries are clearly tagged so they are never mistaken for real results.

export type RealityTag = "established" | "frontier" | "speculative";

export type Breakthrough = {
  id: string;
  name: string;
  tier: number; // 1..6
  category: "quantum" | "energy" | "materials" | "compute" | "bio" | "space" | "info";
  summary: string;
  formula: {
    expr: string; // plain text math
    variables: { sym: string; meaning: string; units?: string }[];
  };
  blueprint: {
    components: { name: string; qty: string; spec: string }[];
    steps: string[];
    schematic: string; // ASCII
    power: string;
    footprint: string;
    risks: string[];
  };
  realityTag: RealityTag;
};

export const BREAKTHROUGHS: Breakthrough[] = [
  {
    id: "qec-surface",
    name: "Surface-Code Error Correction",
    tier: 1,
    category: "quantum",
    summary:
      "Topological QEC encoding a logical qubit across a 2D lattice of physical qubits with stabilizer measurements.",
    formula: {
      expr: "p_L ≈ A · (p / p_th)^((d+1)/2),   p_th ≈ 1.0 × 10⁻²",
      variables: [
        { sym: "p_L", meaning: "logical error rate per cycle" },
        { sym: "p", meaning: "physical gate error rate" },
        { sym: "p_th", meaning: "code threshold" },
        { sym: "d", meaning: "code distance (odd integer)" },
        { sym: "A", meaning: "lattice prefactor ≈ 0.1" },
      ],
    },
    blueprint: {
      components: [
        { name: "physical qubits", qty: "d² + (d−1)²", spec: "T₁ ≥ 100 µs, single-gate err < 10⁻³" },
        { name: "ancilla qubits", qty: "d² − 1", spec: "X/Z stabilizer measurement" },
        { name: "classical decoder", qty: "1", spec: "minimum-weight perfect matching, < 1 µs/cycle" },
      ],
      steps: [
        "Lay out data + measure qubits in checkerboard.",
        "Each cycle: apply CNOT pattern, measure ancillas in X and Z bases.",
        "Stream syndrome to MWPM decoder; track logical Pauli frame in software.",
      ],
      schematic: `  D - M - D - M - D
  |   |   |   |   |
  M - D - M - D - M
  |   |   |   |   |
  D - M - D - M - D
  D=data  M=measure`,
      power: "≈ 25 mW per 100 qubits (dilution fridge load excluded)",
      footprint: "1 cm² substrate for d=11",
      risks: ["correlated leakage events", "decoder latency stalls cycle"],
    },
    realityTag: "established",
  },
  {
    id: "shor",
    name: "Shor's Factoring Algorithm",
    tier: 2,
    category: "compute",
    summary: "Polynomial-time integer factoring via quantum order-finding.",
    formula: {
      expr: "find r s.t. a^r ≡ 1 (mod N);  if r even and a^(r/2) ≢ −1 then gcd(a^(r/2)±1, N) splits N",
      variables: [
        { sym: "N", meaning: "integer to factor" },
        { sym: "a", meaning: "random base coprime to N" },
        { sym: "r", meaning: "multiplicative order of a mod N" },
      ],
    },
    blueprint: {
      components: [
        { name: "logical qubits", qty: "≈ 2·log₂(N) + O(log log N)", spec: "fault-tolerant" },
        { name: "QFT module", qty: "1", spec: "approximate QFT, depth O(n log n)" },
        { name: "modular exponentiation", qty: "1", spec: "windowed, ~ 40·n³ Toffolis" },
      ],
      steps: [
        "Prepare |x⟩|0⟩ over n+2n qubits.",
        "Compute |x⟩|a^x mod N⟩ in superposition.",
        "Inverse-QFT first register, measure, continued-fraction expand to recover r.",
      ],
      schematic: `|0⟩^n -[H]- ┌──────┐ -[QFT†]- ⟨measure⟩
              │  Uₐ  │
|0⟩^2n ----- │ mod N│ -----------------------`,
      power: "compute-bound; resource estimate ~ 20 M T-gates for N=2048",
      footprint: "≈ 4 M physical qubits at p=10⁻³, d=27",
      risks: ["resource estimates dominate cost", "needs distillation factories"],
    },
    realityTag: "established",
  },
  {
    id: "fusion-ignition",
    name: "Inertial-Confinement Fusion Ignition",
    tier: 3,
    category: "energy",
    summary: "Lawson-style criterion for net energy gain in ICF capsules.",
    formula: {
      expr: "Q = E_fusion / E_laser ≥ 1;  Lawson:  n · τ_E · T ≥ 3 × 10²¹ keV·s/m³",
      variables: [
        { sym: "n", meaning: "ion density", units: "m⁻³" },
        { sym: "τ_E", meaning: "energy confinement time", units: "s" },
        { sym: "T", meaning: "ion temperature", units: "keV" },
        { sym: "Q", meaning: "gain factor (dimensionless)" },
      ],
    },
    blueprint: {
      components: [
        { name: "DT capsule", qty: "1", spec: "2 mm Ø, cryogenic D-T ice layer" },
        { name: "hohlraum", qty: "1", spec: "Au, 1 cm, X-ray drive ≈ 300 eV" },
        { name: "laser drivers", qty: "192", spec: "351 nm, total 2.05 MJ, 20 ns shaped pulse" },
      ],
      steps: [
        "Inject cryo capsule into hohlraum.",
        "Shape laser pulse to drive symmetric implosion (ΔR/R < 0.5%).",
        "Compress to ρR ≥ 1.5 g/cm² and Tᵢ ≥ 5 keV; hot spot ignites; α-heating cascades.",
      ],
      schematic: `   laser →| Au hohlraum |
              |   ┌────┐    |
   laser →|   │ DT │    |←|
              |   └────┘    |
   laser →|   X-ray bath  |`,
      power: "input ≈ 2 MJ / shot; demonstrated output ≈ 3.15 MJ (NIF Dec 2022)",
      footprint: "stadium-scale beamline",
      risks: ["asymmetry kills compression", "low shot rate"],
    },
    realityTag: "established",
  },
  {
    id: "g-2",
    name: "Electron Anomalous Moment Measurement",
    tier: 1,
    category: "quantum",
    summary: "Penning-trap measurement of g-2 reaching parts-per-trillion.",
    formula: {
      expr: "aₑ = (g−2)/2 = ν_a / ν_c   with   ν_c = eB/(2π m_e)",
      variables: [
        { sym: "ν_a", meaning: "anomaly frequency" },
        { sym: "ν_c", meaning: "cyclotron frequency" },
        { sym: "B", meaning: "trap magnetic field", units: "T" },
      ],
    },
    blueprint: {
      components: [
        { name: "Penning trap", qty: "1", spec: "B ≈ 6 T, T ≈ 100 mK" },
        { name: "single electron", qty: "1", spec: "loaded by field emission" },
        { name: "cavity QED filter", qty: "1", spec: "suppress synchrotron loss" },
      ],
      steps: [
        "Cool electron to ground cyclotron state.",
        "Drive transitions, measure ν_a and ν_c via QND.",
        "Average over weeks; subtract systematic shifts.",
      ],
      schematic: `   ┌──── B ↑ ────┐
   │   • e⁻       │ ← rf drive
   │              │
   └──── cavity ──┘`,
      power: "< 100 W (cryo excluded)",
      footprint: "lab bench + magnet",
      risks: ["cavity mode shifts dominate systematic"],
    },
    realityTag: "established",
  },
  {
    id: "lithography-shrink",
    name: "EUV Lithography Node Shrink",
    tier: 2,
    category: "compute",
    summary: "Diffraction-limited patterning at λ = 13.5 nm.",
    formula: {
      expr: "CD = k₁ · λ / NA",
      variables: [
        { sym: "CD", meaning: "critical dimension", units: "nm" },
        { sym: "k₁", meaning: "process factor (~0.3 single-patterning)" },
        { sym: "λ", meaning: "wavelength (13.5 nm EUV)" },
        { sym: "NA", meaning: "numerical aperture (0.33 → 0.55 high-NA)" },
      ],
    },
    blueprint: {
      components: [
        { name: "Sn-droplet LPP source", qty: "1", spec: "250 W in-band EUV" },
        { name: "Mo/Si mirrors", qty: "≥10", spec: "70% reflectivity each" },
        { name: "vacuum scanner", qty: "1", spec: "wafer stage 10 nm overlay" },
      ],
      steps: [
        "Pre-pulse Sn droplet; main CO₂ pulse ionises to EUV plasma.",
        "Reflective optical train projects reticle pattern onto resist.",
        "Develop, etch, repeat for stacked metal layers.",
      ],
      schematic: `  CO₂ → Sn → EUV plasma
              ↓
       [reticle]
              ↓ Mo/Si mirrors
        [wafer]`,
      power: "≈ 1 MW per scanner",
      footprint: "fab cleanroom",
      risks: ["pellicle damage", "source duty cycle"],
    },
    realityTag: "established",
  },
  {
    id: "axion-haloscope",
    name: "Axion Haloscope Tuning",
    tier: 3,
    category: "energy",
    summary: "Resonant microwave cavity in strong B field to convert dark-matter axions to photons.",
    formula: {
      expr: "P_sig = g_aγγ² · ρ_a · B² · V · C · Q / m_a",
      variables: [
        { sym: "g_aγγ", meaning: "axion-photon coupling", units: "GeV⁻¹" },
        { sym: "ρ_a", meaning: "local DM density ≈ 0.45 GeV/cm³" },
        { sym: "B", meaning: "applied magnetic field", units: "T" },
        { sym: "V", meaning: "cavity volume", units: "m³" },
        { sym: "C", meaning: "mode form factor (TM₀₁₀ ≈ 0.69)" },
        { sym: "Q", meaning: "loaded quality factor" },
        { sym: "m_a", meaning: "axion mass", units: "eV" },
      ],
    },
    blueprint: {
      components: [
        { name: "superconducting solenoid", qty: "1", spec: "B = 8 T, bore 0.5 m" },
        { name: "tunable cavity", qty: "1", spec: "1–10 GHz, Q ≈ 10⁵" },
        { name: "JPA preamp", qty: "1", spec: "near-quantum-limited noise" },
      ],
      steps: [
        "Cool to 100 mK, ramp magnet.",
        "Sweep cavity frequency in fine steps; integrate ~100 s/step.",
        "Search for narrow excess above thermal noise.",
      ],
      schematic: `   ┌── B ↑ ──┐
   │ ┌─cav─┐ │ → JPA → ADC
   │ └─────┘ │
   └─────────┘`,
      power: "≈ 50 kW magnet + cryoplant",
      footprint: "small hall",
      risks: ["null result over scanned band", "EMI contamination"],
    },
    realityTag: "frontier",
  },
  {
    id: "magic-state",
    name: "Magic-State Distillation",
    tier: 3,
    category: "compute",
    summary: "Bravyi-Kitaev 15-to-1 protocol producing high-fidelity |T⟩ ancillas.",
    formula: {
      expr: "ε_out ≈ 35 · ε_in³   (15-to-1)",
      variables: [
        { sym: "ε_in", meaning: "input T-state infidelity" },
        { sym: "ε_out", meaning: "distilled T-state infidelity" },
      ],
    },
    blueprint: {
      components: [
        { name: "Reed–Muller [[15,1,3]] code", qty: "factory", spec: "transversal T" },
        { name: "logical Clifford resources", qty: "≫", spec: "lattice surgery" },
      ],
      steps: [
        "Inject 15 noisy |T⟩ states into the [[15,1,3]] code.",
        "Apply transversal T, decode, post-select on trivial syndrome.",
        "Output 1 higher-fidelity |T⟩; cascade for deeper purification.",
      ],
      schematic: `15 |T⟩ ─►[ RM 15,1,3 ]─► 1 |T⟩  (×35 cube suppression)`,
      power: "compute overhead dominates lattice budget",
      footprint: "≈ 10–25% of QEC patch area",
      risks: ["factory throughput bottlenecks algorithm"],
    },
    realityTag: "established",
  },
  {
    id: "perovskite-tandem",
    name: "Perovskite/Si Tandem Photovoltaic",
    tier: 2,
    category: "energy",
    summary: "Bandgap-stacked cell breaking the single-junction Shockley–Queisser limit.",
    formula: {
      expr: "η_max(tandem) ≈ 43% (AM1.5G);  J_sc matched when E_g(top) ≈ 1.68 eV",
      variables: [
        { sym: "η_max", meaning: "ideal power efficiency" },
        { sym: "E_g", meaning: "bandgap of top cell", units: "eV" },
        { sym: "J_sc", meaning: "short-circuit current density" },
      ],
    },
    blueprint: {
      components: [
        { name: "Si bottom cell", qty: "1", spec: "n-type, textured, E_g = 1.12 eV" },
        { name: "perovskite top cell", qty: "1", spec: "MA/FA/Cs mixed-halide, E_g ≈ 1.68 eV" },
        { name: "recombination layer", qty: "1", spec: "ITO/SnO₂ stack" },
      ],
      steps: [
        "Texture Si, deposit recombination layer.",
        "Spin/blade-coat perovskite, anneal.",
        "Add transparent top contact + AR coating.",
      ],
      schematic: `  light ↓
   ┌─AR──────────┐
   │ perovskite  │ E_g 1.68
   │ ITO/SnO₂    │
   │ Si          │ E_g 1.12
   └─────────────┘`,
      power: "produces ≈ 320 W/m² AM1.5G at 28% certified",
      footprint: "wafer-scale",
      risks: ["perovskite ion migration", "long-term humidity stability"],
    },
    realityTag: "frontier",
  },
  {
    id: "kerr-comb",
    name: "Microresonator Kerr Frequency Comb",
    tier: 2,
    category: "info",
    summary: "Soliton comb in a high-Q microring providing thousands of phase-locked lines.",
    formula: {
      expr: "Δω_FSR = c / (n_g · L);   threshold P_th ∝ V_eff · n² / (Q² · λ)",
      variables: [
        { sym: "Δω_FSR", meaning: "free spectral range" },
        { sym: "n_g", meaning: "group index" },
        { sym: "L", meaning: "ring circumference" },
        { sym: "Q", meaning: "loaded quality factor" },
      ],
    },
    blueprint: {
      components: [
        { name: "Si₃N₄ microring", qty: "1", spec: "Q > 10⁶, anomalous GVD" },
        { name: "tunable CW pump", qty: "1", spec: "200 mW @ 1550 nm" },
        { name: "thermal stabilizer", qty: "1", spec: "mK stability" },
      ],
      steps: [
        "Pump above parametric threshold; sweep into red-detuned regime.",
        "Capture dissipative Kerr soliton state.",
        "Stabilise via feedback on pump detuning.",
      ],
      schematic: `  pump →─┐   ┌── comb out
         │ ◯ │
         └───┘`,
      power: "< 1 W electrical",
      footprint: "chip-scale",
      risks: ["thermal bistability hysteresis"],
    },
    realityTag: "frontier",
  },
  {
    id: "neutral-atom-array",
    name: "Neutral-Atom Tweezer Array Computer",
    tier: 2,
    category: "quantum",
    summary: "Rydberg-mediated gates in defect-free atom arrays.",
    formula: {
      expr: "V_Rydberg(r) = C₆ / r⁶;   blockade radius R_b = (C₆/Ω)^(1/6)",
      variables: [
        { sym: "C₆", meaning: "van der Waals coefficient" },
        { sym: "Ω", meaning: "Rabi frequency" },
        { sym: "R_b", meaning: "Rydberg blockade radius" },
      ],
    },
    blueprint: {
      components: [
        { name: "SLM tweezer array", qty: "1", spec: "≥ 1000 traps, 3 µm pitch" },
        { name: "MOT + cooling lasers", qty: "1", spec: "≈ 10 µK" },
        { name: "Rydberg laser", qty: "1", spec: "≈ 297 nm two-photon" },
      ],
      steps: [
        "Load atoms stochastically, rearrange to defect-free pattern.",
        "Address pairs with Rydberg pulses to entangle.",
        "Image fluorescence for readout.",
      ],
      schematic: `  · · · · · ·       ← tweezer array
  · ◉ ◉ ◉ ◉ ·      ← rearranged atoms
  · · · · · ·`,
      power: "≈ 10 kW lab supply",
      footprint: "optical table",
      risks: ["Rydberg blackbody decay", "rearrangement latency"],
    },
    realityTag: "frontier",
  },
  {
    id: "muone",
    name: "Hadronic Vacuum Polarization via MUonE",
    tier: 3,
    category: "quantum",
    summary: "Space-like extraction of HVP contribution to muon g-2 from µ-e scattering.",
    formula: {
      expr: "a_µ^HVP = (α/π) ∫₀¹ dx (1−x) Δα_had[t(x)],   t(x) = −m_µ² x²/(1−x)",
      variables: [
        { sym: "a_µ^HVP", meaning: "HVP contribution to muon anomaly" },
        { sym: "Δα_had", meaning: "hadronic running of α" },
        { sym: "t(x)", meaning: "space-like momentum transfer" },
      ],
    },
    blueprint: {
      components: [
        { name: "150 GeV µ⁺ beam", qty: "1", spec: "CERN M2 line" },
        { name: "Be target", qty: "40", spec: "1.5 cm each" },
        { name: "Si tracker stations", qty: "40", spec: "≤ 20 µm spatial res" },
      ],
      steps: [
        "Scatter muons on atomic electrons, reconstruct θ_µ, θ_e.",
        "Map angle correlation to t; fit Δα_had(t).",
        "Integrate against weight to obtain a_µ^HVP.",
      ],
      schematic: `  µ → ▣ ─tracker─ ▣ ─tracker─ ▣ … ECAL`,
      power: "shared with M2 line",
      footprint: "≈ 40 m beamline",
      risks: ["multiple-scattering systematics", "theory weight uncertainty"],
    },
    realityTag: "frontier",
  },
  {
    id: "topological-sc",
    name: "Topological Superconductor with Majorana Modes",
    tier: 4,
    category: "materials",
    summary: "Proximitized semiconductor nanowire hosting non-Abelian zero modes.",
    formula: {
      expr: "topological iff  V_Z² > μ² + Δ²,   V_Z = ½ g µ_B B",
      variables: [
        { sym: "V_Z", meaning: "Zeeman energy" },
        { sym: "μ", meaning: "chemical potential" },
        { sym: "Δ", meaning: "induced SC gap" },
      ],
    },
    blueprint: {
      components: [
        { name: "InSb nanowire", qty: "1", spec: "strong SOC" },
        { name: "Al shell", qty: "1", spec: "epitaxial, 6–10 nm" },
        { name: "tunnel probes", qty: "≥2", spec: "for ZBP correlation" },
      ],
      steps: [
        "Grow Al on InSb facet; pattern gates.",
        "Sweep B along wire; look for correlated zero-bias peaks at both ends.",
        "Verify quantized 2e²/h conductance and parity dependence.",
      ],
      schematic: `  ─[Al shell on InSb]─
   ◆               ◆       ◆ = Majorana site`,
      power: "mW-scale, dilution fridge",
      footprint: "chip",
      risks: ["Andreev bound states mimic Majoranas — protocol still contested"],
    },
    realityTag: "speculative",
  },
  {
    id: "warp-alcubierre",
    name: "Alcubierre Warp Metric",
    tier: 6,
    category: "space",
    summary: "GR metric allowing superluminal apparent travel — requires exotic negative-energy density.",
    formula: {
      expr: "ds² = −dt² + (dx − v_s(t)·f(r_s) dt)² + dy² + dz²",
      variables: [
        { sym: "v_s",