// Curated catalog of "breakthroughs" the bots procedurally unlock in Quantara World.
// Mix of established physics/engineering, frontier research, and speculative concepts.
// Speculative entries are CLEARLY tagged so they are never mistaken for real results.

export type RealityTag = "established" | "frontier" | "speculative";

export type Breakthrough = {
  id: string;
  name: string;
  tier: number;
  category: "quantum" | "energy" | "materials" | "compute" | "bio" | "space" | "info";
  summary: string;
  formula: {
    expr: string;
    variables: { sym: string; meaning: string; units?: string }[];
  };
  blueprint: {
    components: { name: string; qty: string; spec: string }[];
    steps: string[];
    schematic: string;
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
    summary: "Topological QEC over a 2D lattice of physical qubits.",
    formula: {
      expr: "p_L ≈ A · (p / p_th)^((d+1)/2),   p_th ≈ 1e-2",
      variables: [
        { sym: "p_L", meaning: "logical error per cycle" },
        { sym: "p", meaning: "physical gate error" },
        { sym: "d", meaning: "code distance (odd)" },
      ],
    },
    blueprint: {
      components: [
        { name: "data qubits", qty: "d²", spec: "T1 ≥ 100 µs, err < 1e-3" },
        { name: "measure qubits", qty: "d²−1", spec: "X/Z stabilizers" },
        { name: "MWPM decoder", qty: "1", spec: "< 1 µs/cycle" },
      ],
      steps: [
        "Lay out data/measure checkerboard.",
        "Each cycle: CNOT pattern then ancilla measurement.",
        "Stream syndrome to decoder; track Pauli frame in software.",
      ],
      schematic: "D-M-D-M-D\n|  |  |  |  |\nM-D-M-D-M",
      power: "≈ 25 mW per 100 qubits",
      footprint: "1 cm² for d=11",
      risks: ["leakage", "decoder latency"],
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
      expr: "find r: a^r ≡ 1 mod N; gcd(a^(r/2)±1, N) splits N",
      variables: [
        { sym: "N", meaning: "integer to factor" },
        { sym: "a", meaning: "random base coprime to N" },
        { sym: "r", meaning: "order of a mod N" },
      ],
    },
    blueprint: {
      components: [
        { name: "logical qubits", qty: "≈ 2 log₂ N", spec: "fault-tolerant" },
        { name: "approx QFT", qty: "1", spec: "depth O(n log n)" },
        { name: "mod-exp", qty: "1", spec: "≈ 40 n³ Toffolis" },
      ],
      steps: [
        "Prepare |x⟩|0⟩ over n+2n qubits.",
        "Compute |x⟩|a^x mod N⟩ in superposition.",
        "Inverse QFT, measure, continued fractions → r.",
      ],
      schematic: "|0⟩ -[H]- [Uₐ mod N] -[QFT†]- ⟨measure⟩",
      power: "compute-bound",
      footprint: "≈ 4M phys qubits for N=2048",
      risks: ["distillation throughput dominates cost"],
    },
    realityTag: "established",
  },
  {
    id: "fusion-ignition",
    name: "Inertial-Confinement Fusion Ignition",
    tier: 3,
    category: "energy",
    summary: "Lawson criterion for net energy gain.",
    formula: {
      expr: "Q = E_fusion/E_laser ≥ 1; n·τ·T ≥ 3e21 keV·s/m³",
      variables: [
        { sym: "n", meaning: "ion density", units: "m⁻³" },
        { sym: "τ", meaning: "confinement time", units: "s" },
        { sym: "T", meaning: "ion temperature", units: "keV" },
      ],
    },
    blueprint: {
      components: [
        { name: "DT capsule", qty: "1", spec: "2 mm Ø, cryo D-T layer" },
        { name: "Au hohlraum", qty: "1", spec: "X-ray drive 300 eV" },
        { name: "UV lasers", qty: "192", spec: "351 nm, 2.05 MJ total" },
      ],
      steps: [
        "Inject cryo capsule into hohlraum.",
        "Shape pulse for symmetric implosion (ΔR/R < 0.5%).",
        "Compress to ρR ≥ 1.5 g/cm²; α-heating cascades.",
      ],
      schematic: "laser →| Au hohlraum |\n        |  [DT capsule]  |\nlaser →|  X-ray bath    |",
      power: "2 MJ in → 3.15 MJ out (NIF 2022)",
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
    summary: "Penning-trap g−2 at parts-per-trillion.",
    formula: {
      expr: "aₑ = (g−2)/2 = ν_a/ν_c,  ν_c = eB/(2π m_e)",
      variables: [
        { sym: "ν_a", meaning: "anomaly frequency" },
        { sym: "ν_c", meaning: "cyclotron frequency" },
        { sym: "B", meaning: "trap field", units: "T" },
      ],
    },
    blueprint: {
      components: [
        { name: "Penning trap", qty: "1", spec: "B = 6 T, T = 100 mK" },
        { name: "single electron", qty: "1", spec: "field-emission loaded" },
        { name: "cavity QED filter", qty: "1", spec: "suppress synchrotron loss" },
      ],
      steps: [
        "Cool e⁻ to ground cyclotron state.",
        "Drive transitions, QND read ν_a and ν_c.",
        "Average weeks; subtract systematics.",
      ],
      schematic: "┌── B↑ ──┐\n│  • e⁻  │ ← rf\n└─ cavity─┘",
      power: "< 100 W",
      footprint: "lab bench + magnet",
      risks: ["cavity mode shifts"],
    },
    realityTag: "established",
  },
  {
    id: "lithography",
    name: "EUV Lithography Node Shrink",
    tier: 2,
    category: "compute",
    summary: "Diffraction-limited patterning at 13.5 nm.",
    formula: {
      expr: "CD = k₁ · λ / NA",
      variables: [
        { sym: "CD", meaning: "critical dimension", units: "nm" },
        { sym: "k₁", meaning: "process factor ~0.3" },
        { sym: "λ", meaning: "wavelength 13.5 nm" },
        { sym: "NA", meaning: "numerical aperture 0.33→0.55" },
      ],
    },
    blueprint: {
      components: [
        { name: "Sn-droplet LPP source", qty: "1", spec: "250 W in-band" },
        { name: "Mo/Si mirrors", qty: "≥10", spec: "70% R each" },
        { name: "vacuum scanner", qty: "1", spec: "10 nm overlay" },
      ],
      steps: [
        "Pre-pulse Sn; CO₂ main pulse → EUV plasma.",
        "Reflective train projects reticle onto resist.",
        "Develop, etch, repeat for metal stack.",
      ],
      schematic: "CO₂ → Sn → EUV → [reticle] → mirrors → [wafer]",
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
    summary: "Resonant cavity in strong B field for axion→γ conversion.",
    formula: {
      expr: "P_sig = g_aγγ² · ρ_a · B² · V · C · Q / m_a",
      variables: [
        { sym: "g_aγγ", meaning: "axion-photon coupling", units: "GeV⁻¹" },
        { sym: "B", meaning: "field", units: "T" },
        { sym: "V", meaning: "cavity volume", units: "m³" },
        { sym: "Q", meaning: "loaded Q" },
      ],
    },
    blueprint: {
      components: [
        { name: "SC solenoid", qty: "1", spec: "B=8 T, bore 0.5 m" },
        { name: "tunable cavity", qty: "1", spec: "1–10 GHz, Q≈10⁵" },
        { name: "JPA preamp", qty: "1", spec: "quantum-limited" },
      ],
      steps: [
        "Cool to 100 mK, ramp magnet.",
        "Sweep cavity in fine steps; ~100 s/step integration.",
        "Search for narrow excess above thermal noise.",
      ],
      schematic: "┌── B↑ ──┐\n│ [cav]  │ → JPA → ADC\n└────────┘",
      power: "≈ 50 kW + cryo",
      footprint: "small hall",
      risks: ["null result over band", "EMI"],
    },
    realityTag: "frontier",
  },
  {
    id: "magic-state",
    name: "Magic-State Distillation",
    tier: 3,
    category: "compute",
    summary: "Bravyi-Kitaev 15→1 high-fidelity |T⟩ factory.",
    formula: {
      expr: "ε_out ≈ 35 · ε_in³",
      variables: [
        { sym: "ε_in", meaning: "input T infidelity" },
        { sym: "ε_out", meaning: "distilled T infidelity" },
      ],
    },
    blueprint: {
      components: [
        { name: "[[15,1,3]] code", qty: "factory", spec: "transversal T" },
        { name: "lattice surgery", qty: "—", spec: "logical Cliffords" },
      ],
      steps: [
        "Inject 15 noisy |T⟩ into [[15,1,3]] code.",
        "Transversal T, decode, post-select trivial syndrome.",
        "Output 1 cleaner |T⟩; cascade for deeper purification.",
      ],
      schematic: "15|T⟩ → [RM 15,1,3] → 1|T⟩  (×35 cubic suppression)",
      power: "compute overhead-bound",
      footprint: "10–25% of QEC patch",
      risks: ["factory throughput stalls algorithm"],
    },
    realityTag: "established",
  },
  {
    id: "perovskite-tandem",
    name: "Perovskite/Si Tandem Photovoltaic",
    tier: 2,
    category: "energy",
    summary: "Bandgap-stacked cell exceeding single-junction SQ limit.",
    formula: {
      expr: "η_max ≈ 43% AM1.5G; J_sc matched at E_g(top) ≈ 1.68 eV",
      variables: [
        { sym: "η_max", meaning: "ideal efficiency" },
        { sym: "E_g", meaning: "top-cell bandgap", units: "eV" },
      ],
    },
    blueprint: {
      components: [
        { name: "Si bottom cell", qty: "1", spec: "n-type, textured, 1.12 eV" },
        { name: "perovskite top", qty: "1", spec: "MA/FA/Cs, 1.68 eV" },
        { name: "recomb layer", qty: "1", spec: "ITO/SnO₂" },
      ],
      steps: [
        "Texture Si; deposit recomb layer.",
        "Blade-coat perovskite; anneal.",
        "Add transparent contact + AR coating.",
      ],
      schematic: "light↓\nAR\nperovskite (1.68)\nITO/SnO₂\nSi (1.12)",
      power: "≈ 320 W/m² @ 28% certified",
      footprint: "wafer-scale",
      risks: ["ion migration", "humidity stability"],
    },
    realityTag: "frontier",
  },
  {
    id: "kerr-comb",
    name: "Microresonator Kerr Frequency Comb",
    tier: 2,
    category: "info",
    summary: "Soliton comb in a high-Q microring with thousands of locked lines.",
    formula: {
      expr: "Δω_FSR = c/(n_g L);  P_th ∝ V_eff n²/(Q² λ)",
      variables: [
        { sym: "n_g", meaning: "group index" },
        { sym: "L", meaning: "ring circumference" },
        { sym: "Q", meaning: "loaded Q" },
      ],
    },
    blueprint: {
      components: [
        { name: "Si₃N₄ microring", qty: "1", spec: "Q>10⁶, anomalous GVD" },
        { name: "tunable CW pump", qty: "1", spec: "200 mW @ 1550 nm" },
        { name: "thermal stabilizer", qty: "1", spec: "mK stability" },
      ],
      steps: [
        "Pump above parametric threshold.",
        "Sweep into red-detuned regime; capture DKS state.",
        "Stabilise via feedback on pump detuning.",
      ],
      schematic: "pump → ◯ → comb out",
      power: "< 1 W electrical",
      footprint: "chip-scale",
      risks: ["thermal bistability"],
    },
    realityTag: "frontier",
  },
  {
    id: "tweezer-array",
    name: "Neutral-Atom Tweezer Array Computer",
    tier: 2,
    category: "quantum",
    summary: "Rydberg-mediated gates in defect-free atom arrays.",
    formula: {
      expr: "V(r)=C₆/r⁶;  R_b=(C₆/Ω)^(1/6)",
      variables: [
        { sym: "C₆", meaning: "vdW coefficient" },
        { sym: "Ω", meaning: "Rabi frequency" },
        { sym: "R_b", meaning: "blockade radius" },
      ],
    },
    blueprint: {
      components: [
        { name: "SLM tweezer array", qty: "1", spec: "≥1000 traps, 3 µm pitch" },
        { name: "MOT + cooling", qty: "1", spec: "~10 µK" },
        { name: "Rydberg laser", qty: "1", spec: "297 nm two-photon" },
      ],
      steps: [
        "Stochastic load; rearrange to defect-free.",
        "Address pairs with Rydberg pulses to entangle.",
        "Fluorescence readout.",
      ],
      schematic: "· · · · ·\n· ◉ ◉ ◉ ·\n· · · · ·",
      power: "≈ 10 kW lab",
      footprint: "optical table",
      risks: ["blackbody decay", "rearrangement latency"],
    },
    realityTag: "frontier",
  },
  {
    id: "muone",
    name: "HVP from MUonE µ–e Scattering",
    tier: 3,
    category: "quantum",
    summary: "Space-like HVP extraction for muon g−2.",
    formula: {
      expr: "a_µ^HVP = (α/π) ∫₀¹ (1−x) Δα_had[t(x)] dx,  t = −m_µ² x²/(1−x)",
      variables: [
        { sym: "Δα_had", meaning: "hadronic running of α" },
        { sym: "t(x)", meaning: "space-like Q²" },
      ],
    },
    blueprint: {
      components: [
        { name: "150 GeV µ⁺ beam", qty: "1", spec: "CERN M2" },
        { name: "Be target", qty: "40", spec: "1.5 cm each" },
        { name: "Si trackers", qty: "40", spec: "≤ 20 µm res" },
      ],
      steps: [
        "Scatter µ on atomic e⁻; reconstruct θ_µ, θ_e.",
        "Map angle correlation to t.",
        "Integrate weighted Δα_had to get a_µ^HVP.",
      ],
      schematic: "µ → ▣─trk─▣─trk─▣ … ECAL",
      power: "shared beamline",
      footprint: "≈ 40 m line",
      risks: ["multiple scattering systematics"],
    },
    realityTag: "frontier",
  },
  {
    id: "majorana",
    name: "Topological Superconductor (Majorana)",
    tier: 4,
    category: "materials",
    summary: "Proximitized nanowire candidate for non-Abelian zero modes.",
    formula: {
      expr: "topological iff V_Z² > μ² + Δ²,  V_Z = ½ g µ_B B",
      variables: [
        { sym: "V_Z", meaning: "Zeeman energy" },
        { sym: "μ", meaning: "chemical potential" },
        { sym: "Δ", meaning: "induced SC gap" },
      ],
    },
    blueprint: {
      components: [
        { name: "InSb nanowire", qty: "1", spec: "strong SOC" },
        { name: "Al shell", qty: "1", spec: "epitaxial 6–10 nm" },
        { name: "tunnel probes", qty: "≥2", spec: "for ZBP correlation" },
      ],
      steps: [
        "Grow Al on InSb facet; pattern gates.",
        "Sweep B along wire; look for correlated ZBPs at both ends.",
        "Verify quantized 2e²/h and parity dependence.",
      ],
      schematic: "─[Al on InSb]─\n◆           ◆   ◆=Majorana site",
      power: "mW, dilution fridge",
      footprint: "chip",
      risks: ["ABS mimic Majoranas — protocol contested"],
    },
    realityTag: "speculative",
  },
  {
    id: "warp",
    name: "Alcubierre Warp Metric",
    tier: 6,
    category: "space",
    summary: "GR metric allowing superluminal apparent travel — requires exotic negative energy.",
    formula: {
      expr: "ds² = −dt² + (dx − v_s f(r_s) dt)² + dy² + dz²",
      variables: [
        { sym: "v_s", meaning: "bubble velocity" },
        { sym: "f(r_s)", meaning: "top-hat-like shape" },
        { sym: "ρ", meaning: "required energy density (NEGATIVE)" },
      ],
    },
    blueprint: {
      components: [
        { name: "exotic stress-energy", qty: "vast", spec: "violates weak energy condition" },
        { name: "field-shaping array", qty: "—", spec: "theoretical" },
      ],
      steps: [
        "No engineering path is known.",
        "Listed as a constraint to falsify, not a recipe.",
      ],
      schematic: "[ shaped negative-energy shell around payload ]",
      power: "negative energy ~ planet-mass equivalent",
      footprint: "—",
      risks: ["no known matter satisfies the source", "Hawking chronology protection"],
    },
    realityTag: "speculative",
  },
  {
    id: "room-temp-sc",
    name: "Ambient-Pressure Room-Temp Superconductor",
    tier: 5,
    category: "materials",
    summary: "Target: T_c ≥ 293 K at 1 atm. No verified compound to date.",
    formula: {
      expr: "BCS:  T_c ≈ 1.13 ωD · exp[−1/(N(0) V)]   (insufficient at RT)",
      variables: [
        { sym: "ωD", meaning: "Debye frequency" },
        { sym: "N(0)", meaning: "DOS at Fermi level" },
        { sym: "V", meaning: "pairing strength" },
      ],
    },
    blueprint: {
      components: [
        { name: "candidate hydride/MOF", qty: "1", spec: "high ωD, strong e-ph" },
        { name: "DAC or ambient route", qty: "1", spec: "verifiable Meissner" },
      ],
      steps: [
        "Synthesise candidate; verify stoichiometry.",
        "Measure ρ(T) → 0 and Meissner expulsion independently.",
        "Replicate across ≥2 labs before claiming.",
      ],
      schematic: "[candidate] — ρ(T)=0 ?  — Meissner ?  — replicated ?",
      power: "—",
      footprint: "—",
      risks: ["history of retracted claims", "must show full diamagnetism"],
    },
    realityTag: "speculative",
  },
];
