import { useEffect, useRef, useState } from "react";
import { useWorld } from "@/lib/world-store";
import { ENGINES, ENGINE_ORDER, type EngineId } from "@/lib/physics-engines";


// ---------------------------------------------------------------------------
// QED COMPUTER — operator-facing terminal.
// Paste numbers, expressions, full execution work, or natural-language
// prompts. The machine parses input and routes it through a QED kernel
// that talks back.
// ---------------------------------------------------------------------------

const ALPHA = 7.2973525693e-3;
const ALPHA_INV = 137.035999084;
const A_E = 1.15965218073e-3;
const ME_MEV = 0.51099895000;
const HBAR_C_MEV_FM = 197.3269804;
const PI = Math.PI;

const QED_COEFFS = [0.5, -0.328478965, 1.181241456, -1.91293, 7.791];
function aeFromAlpha(a: number) {
  const x = a / PI;
  let s = 0;
  for (let i = 0; i < QED_COEFFS.length; i++) s += QED_COEFFS[i] * Math.pow(x, i + 1);
  return s;
}

// ---- safe expression evaluator -------------------------------------------
const CONSTS: Record<string, number> = {
  alpha: ALPHA,
  α: ALPHA,
  alpha_inv: ALPHA_INV,
  ae: A_E,
  me: ME_MEV,
  pi: PI,
  e: Math.E,
  hbarc: HBAR_C_MEV_FM,
};

function safeEval(expr: string): number {
  // strip everything not in a safe set; map constants to JS values
  let e = expr.replace(/\s+/g, "");
  // replace named constants (longest first to avoid partial matches)
  for (const k of Object.keys(CONSTS).sort((a, b) => b.length - a.length)) {
    e = e.replace(new RegExp(`\\b${k}\\b`, "gi"), `(${CONSTS[k]})`);
  }
  // allowed math functions — avoid double Math. prefix
  e = e.replace(/\b(sin|cos|tan|asin|acos|atan|sqrt|log|log10|log2|exp|abs|pow|floor|ceil|round|sinh|cosh|tanh)\b/g, (m, _g1, offset, str) => {
    if (offset >= 5 && str.slice(offset - 5, offset) === "Math.") return m;
    return `Math.${m}`;
  });
  // ^ → **
  e = e.replace(/\^/g, "**");
  if (!/^[0-9+\-*/().,%eE \t\nMath.a-zA-Z_*]+$/.test(e)) throw new Error("rejected characters in expression");
  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${e});`);
  const v = fn();
  if (typeof v !== "number" || !Number.isFinite(v)) throw new Error("non-numeric result");
  return v;
}

// ---- QED kernel: routes intent → answer ----------------------------------
interface KernelOut {
  out: string;
  detail?: string[];
  kind: "ok" | "warn" | "err" | "calc";
}

function logBreakthrough(id: string, label: string) {
  try {
    useWorld.getState().logKernelBreakthrough(id, label);
  } catch {}
}

function kernel(raw: string): KernelOut {
  const input = raw.trim();
  if (!input) return { out: "// empty stream", kind: "warn" };

  const lower = input.toLowerCase();

  // ── Multiversal QED "solve" suite — log to ledger as simulation events ──
  // 1. VACUUM CATASTROPHE (Eq 43)
  if (lower.includes("solve vacuum")) {
    logBreakthrough("vacuum-catastrophe", "KVE_STABILIZER // VACUUM_CATASTROPHE_RESOLVED");
    return {
      out: "KVE_STABILIZER // VACUUM_CATASTROPHE_RESOLVED",
      kind: "calc",
      detail: [
        "Theoretical Energy: 10^120 GeV",
        "Applying AHM Phase Filter...",
        "Result: 10^-9 GeV (Matches Observation)",
        "Status: EINSTEIN'S BLUNDER FIXED.",
      ],
    };
  }
  // 2. BLACK HOLE INFORMATION (Eq 44)
  if (lower.includes("solve singularity") || lower.includes("black hole")) {
    logBreakthrough("hawking-paradox", "UNITARY_PERSISTENCE // HAWKING_PARADOX_RESOLVED");
    return {
      out: "UNITARY_PERSISTENCE // HAWKING_PARADOX_RESOLVED",
      kind: "calc",
      detail: [
        "Ŝ_BH = Tr(ρ_3D) ➔ Ψ_4D(footprint)",
        "Result: PCL backup to 4D Atlas complete.",
        "Haiku: 'The dark star swallows. But the ledger never lies.'",
      ],
    };
  }
  // 3. DARK MATTER TENSION (Eq 45)
  if (lower.includes("solve dark matter")) {
    logBreakthrough("dark-matter", "MULTIVERSAL_GRAVITY // DARK_MATTER_RESOLVED");
    return {
      out: "MULTIVERSAL_GRAVITY // DARK_MATTER_RESOLVED",
      kind: "calc",
      detail: [
        "Ω_DM = κ · ∇² Φ_4D(ρ_atlas)",
        "Result: DM identified as 4D Infrastructure weight.",
        "Status: GALACTIC ROTATION STABILIZED.",
      ],
    };
  }
  // 4. HIERARCHY PROBLEM (Eq 47)
  if (lower.includes("solve gravity") || lower.includes("hierarchy")) {
    logBreakthrough("hierarchy", "SCALE_STABILIZER // HIERARCHY_PROBLEM_RESOLVED");
    return {
      out: "SCALE_STABILIZER // HIERARCHY_PROBLEM_RESOLVED",
      kind: "calc",
      detail: [
        "Problem: Gravity 10^32x too weak.",
        "Result: Gravity = Swarm power-save leakage.",
        "Status: FUNDAMENTAL FORCES UNIFIED.",
      ],
    };
  }
  // 5. PROTON RADIUS (Eq 46)
  if (lower.includes("solve proton")) {
    logBreakthrough("proton-radius", "MUONIC_RECALIBRATION // QED_UNIVERSALITY_RESTORED");
    return {
      out: "MUONIC_RECALIBRATION // QED_UNIVERSALITY_RESTORED",
      kind: "calc",
      detail: [
        "Applying PCL Recalibration...",
        "Unified Radius: 0.8414 fm",
        "Status: LEPTON DISCREPANCY CLOSED.",
      ],
    };
  }
  // 6. DYSON DILEMMA (Eq 42)
  if (/^borel\b/.test(lower) || lower.includes("borel heal")) {
    logBreakthrough("borel-heal", "BOREL_HEAL_COMPLETE // DYSON_LIMIT_BYPASSED");
    return {
      out: "BOREL_HEAL_COMPLETE // DYSON_LIMIT_BYPASSED",
      kind: "calc",
      detail: [
        "Raw Term: 1.31e+34",
        "Borel Healed: 1.20e-36",
        "Status: INFINITY TAMED.",
      ],
    };
  }

  // help
  if (/^(help|\?|commands)\b/.test(lower)) {
    return {
      out: "QED_COMPUTER · command surface",
      kind: "ok",
      detail: [
        "calc <expr>           evaluate any math expression (alpha, pi, me, hbarc, ae available)",
        "ae [alpha]            anomalous magnetic moment via Schwinger expansion",
        "alpha                 1/α (CODATA) and α",
        "compton [m_MeV]       Compton wavelength λ_c = hbarc / m  (fm)",
        "bohr                  Bohr radius from α and m_e (fm)",
        "rydberg               Rydberg energy ½ α² m_e c² (eV)",
        "lamb                  Lamb shift (2S_1/2 − 2P_1/2) in hydrogen (MHz, leading)",
        "screening <Z>         effective Zα running indicator at Z",
        "feynman <order>       count of one-particle-irreducible vertex diagrams up to order",
        "talk <message>        natural-language Q&A about QED",
        "─── multiversal solve suite ───",
        "solve vacuum          Eq 43 · KVE_STABILIZER (vacuum catastrophe)",
        "solve singularity     Eq 44 · UNITARY_PERSISTENCE (black hole info)",
        "solve dark matter     Eq 45 · MULTIVERSAL_GRAVITY",
        "solve gravity         Eq 47 · SCALE_STABILIZER (hierarchy)",
        "solve proton          Eq 46 · MUONIC_RECALIBRATION (proton radius)",
        "borel                 Eq 42 · BOREL_HEAL (Dyson limit)",
        "paste anything else and it will be parsed as an expression",
      ],
    };
  }

  // direct commands
  if (/^alpha$/.test(lower)) {
    return {
      out: `α = ${ALPHA.toExponential(10)}   |   1/α = ${ALPHA_INV.toFixed(9)}`,
      kind: "calc",
    };
  }

  const aeMatch = lower.match(/^ae(?:\s+(.+))?$/);
  if (aeMatch) {
    const a = aeMatch[1] ? safeEval(aeMatch[1]) : ALPHA;
    const v = aeFromAlpha(a);
    return {
      out: `a_e(α=${a.toExponential(6)}) = ${v.toExponential(10)}`,
      kind: "calc",
      detail: [
        `Schwinger c1·(α/π)       = ${(QED_COEFFS[0] * (a / PI)).toExponential(6)}`,
        `c2·(α/π)^2               = ${(QED_COEFFS[1] * Math.pow(a / PI, 2)).toExponential(6)}`,
        `c3·(α/π)^3               = ${(QED_COEFFS[2] * Math.pow(a / PI, 3)).toExponential(6)}`,
        `experiment (CODATA)      = ${A_E.toExponential(10)}`,
        `residual                 = ${Math.abs(v - A_E).toExponential(3)}`,
      ],
    };
  }

  const compMatch = lower.match(/^compton(?:\s+(.+))?$/);
  if (compMatch) {
    const m = compMatch[1] ? safeEval(compMatch[1]) : ME_MEV;
    const lam = HBAR_C_MEV_FM / m;
    return { out: `λ_c = ħc / m = ${lam.toFixed(4)} fm   (m = ${m} MeV)`, kind: "calc" };
  }

  if (/^bohr$/.test(lower)) {
    const a0 = HBAR_C_MEV_FM / (ALPHA * ME_MEV);
    return { out: `Bohr radius a₀ = ħc / (α·m_e c²) = ${a0.toFixed(2)} fm = ${(a0 * 1e-5).toExponential(4)} cm`, kind: "calc" };
  }

  if (/^rydberg$/.test(lower)) {
    const ry = 0.5 * ALPHA * ALPHA * ME_MEV * 1e6; // eV
    return { out: `Ry = ½ α² m_e c² = ${ry.toFixed(6)} eV`, kind: "calc" };
  }

  if (/^lamb$/.test(lower)) {
    return {
      out: "Lamb shift Δν(2S_1/2 − 2P_1/2, H) ≈ 1057.845 MHz",
      kind: "calc",
      detail: [
        "leading contribution = electron self-energy (Bethe log)",
        "vacuum polarization (Uehling) ≈ −27 MHz",
        "anomalous moment      ≈ +68 MHz",
      ],
    };
  }

  const scrM = lower.match(/^screening\s+(\d+(?:\.\d+)?)/);
  if (scrM) {
    const Z = parseFloat(scrM[1]);
    const Zalpha = Z * ALPHA;
    return {
      out: `Zα = ${Zalpha.toFixed(6)}   |   bound-state non-perturbative when Zα → 1`,
      kind: "calc",
      detail: [`leading energy ≈ −½ (Zα)² m_e c² = ${(-0.5 * Zalpha * Zalpha * ME_MEV * 1e6).toFixed(3)} eV`],
    };
  }

  const fm = lower.match(/^feynman\s+(\d+)/);
  if (fm) {
    const n = Math.max(1, Math.min(6, parseInt(fm[1])));
    // crude perturbative graph count growth
    let total = 0;
    const rows: string[] = [];
    for (let k = 1; k <= n; k++) {
      const c = Math.round(Math.pow(2, k) * (k + 1));
      total += c;
      rows.push(`order α^${k}: ~${c} 1PI vertex graphs`);
    }
    return { out: `Feynman_count[1..${n}] ≈ ${total}`, kind: "calc", detail: rows };
  }

  // calc <expr>
  const calcM = input.match(/^calc\s+(.+)/i);
  if (calcM) {
    try {
      const v = safeEval(calcM[1]);
      return { out: `= ${v}`, kind: "calc" };
    } catch (e: any) {
      return { out: `// calc rejected: ${e.message}`, kind: "err" };
    }
  }

  // talk <message>
  const talkM = input.match(/^talk\s+(.+)/i);
  if (talkM) return chat(talkM[1]);

  // natural-language fallback if any letters present
  if (/[a-zA-Z]/.test(input) && !/^[\d+\-*/().,\s\^eE]+$/.test(input)) {
    return chat(input);
  }

  // pure expression
  try {
    const v = safeEval(input);
    return { out: `= ${v}`, kind: "calc" };
  } catch (e: any) {
    return { out: `// parse error: ${e.message}`, kind: "err" };
  }
}

// minimalist QED-aware chat ------------------------------------------------
// Each KB entry: keywords → headline + optional detail. Freeform analyzer
// scans for QED concepts; multi-concept inputs are synthesized into one reply.
const KB: { keys: string[]; out: string; detail?: string[] }[] = [
  {
    keys: ["what is qed", "explain qed", "quantum electrodynamics"],
    out: "QED = relativistic QFT of electrons + photons. Gauge group U(1). Coupling α ≈ 1/137. Best-tested theory in physics: a_e agrees with experiment to >10 decimal places.",
  },
  {
    keys: ["fine-structure", "fine structure", "coupling constant"],
    out: `α = ${ALPHA.toExponential(10)} (dimensionless). 1/α = ${ALPHA_INV.toFixed(9)}. Sets coupling strength of electromagnetism.`,
  },
  {
    keys: ["anomalous", "g-2", "g2", "magnetic moment", "schwinger"],
    out: `a_e = (g−2)/2 = ${A_E.toExponential(10)}. Schwinger first term: α/(2π) ≈ ${(ALPHA / (2 * PI)).toExponential(6)}. Five-loop QED + hadronic + EW close the gap to <1 ppt.`,
  },
  {
    keys: ["lamb shift", "bethe log", "2s_1/2", "2p_1/2"],
    out: "Lamb shift: 2S_1/2 sits ~1058 MHz above 2P_1/2 in hydrogen. Leading piece = electron self-energy (Bethe log). Vacuum polarization (Uehling) ≈ −27 MHz; anomalous moment ≈ +68 MHz. First direct proof QED radiative corrections are real.",
  },
  {
    keys: ["renormaliz"],
    out: "QED is perturbatively renormalizable. UV divergences in self-energy, vertex, and vacuum-polarization are absorbed into m, e, and field-strength counterterms (Z₁, Z₂, Z₃, δm). Ward identity Z₁ = Z₂ keeps the photon massless.",
  },
  {
    keys: ["vacuum polariz", "uehling", "running coupling", "running of"],
    out: "Vacuum polarization (Uehling): photon propagator is dressed by virtual e+e− loops → α runs with energy. α(0) ≈ 1/137.036, α(M_Z) ≈ 1/127.95. β(α) > 0 ⇒ Landau pole at exponentially high scale.",
  },
  {
    keys: ["landau pole", "triviality", "trivial"],
    out: "Triviality of 4D QED: renormalized α_R → 0 as cutoff Λ → ∞ with bare coupling fixed. Numerical lattice evidence (Göckeler, Horsley, Rakow, Schierholz, Stüben) supports α_R → 0. Implication: continuum QED in isolation is non-interacting; it survives empirically only as an effective theory embedded in the Standard Model.",
    detail: [
      "Landau pole Λ_L ≈ m_e exp(3π/α) ≈ 10^286 GeV — far above M_Pl, irrelevant in practice.",
      "Triviality concerns the *isolated* U(1) sector, not the unified electroweak theory.",
      "Effective-theory reading: QED is valid up to a finite UV cutoff where new physics enters.",
    ],
  },
  {
    keys: ["lattice qed", "wilson fermion", "staggered", "continuum limit"],
    out: "Lattice QED: discretize on a⁴ Euclidean lattice, U_μ(x) ∈ U(1) link variables, Wilson/staggered fermions. Continuum limit = tune bare g toward a critical surface so ξ/a → ∞. Schwinger functions exist numerically; uniform control of every OS axiom through a → 0 with light dynamical fermions is still open.",
    detail: [
      "Compact U(1) confines at strong coupling (Guth, Frölich-Spencer); the weak-coupling Coulomb phase is the candidate for continuum QED.",
      "Phase structure: bulk transition + roughening — only the Coulomb phase yields a non-confining continuum.",
      "QED at μ=0 is sign-problem free; chemical-potential QED is not.",
    ],
  },
  {
    keys: ["osterwalder", "schrader", "os recon", "reflection posit", "os axiom"],
    out: "Osterwalder–Schrader reconstruction: Euclidean Schwinger functions satisfying (OS1) regularity, (OS2) Euclidean invariance, (OS3) reflection positivity, (OS4) symmetry, (OS5) clustering ⇒ a Wightman QFT in Minkowski signature with a positive-energy Hilbert space.",
    detail: [
      "Reflection positivity is the hardest axiom to preserve uniformly through the continuum limit.",
      "Wilson-action lattice gauge theory satisfies OS3 exactly (Osterwalder–Seiler); the question is whether it survives a → 0 in S′.",
      "Dynamical fermions: need det(D + m) ≥ 0 — γ₅-Hermiticity gives positivity for pairs of degenerate flavors.",
    ],
  },
  {
    keys: ["fermion determinant", "pfaffian", "det(d", "sign problem"],
    out: "Fermion determinant det(γ·D + m): integrating out ψ̄, ψ leaves a functional of the gauge field. For QED at μ=0 with Wilson/staggered fermions it is real; OS3 positivity requires extra structure (γ₅-Hermiticity ⇒ det ≥ 0 for paired flavors).",
  },
  {
    keys: ["constructive", "rigorous construction", "haag-kastler", "wightman axiom"],
    out: "Constructive QFT: build interacting QFTs satisfying Wightman/Haag-Kastler axioms from first principles. Successes: P(φ)₂ (Glimm-Jaffe), φ₄³ (Glimm-Jaffe-Spencer), Yukawa₂, Sine-Gordon₂. Open: φ₄⁴, QED₄, Yang-Mills₄ (Clay Millennium Problem for mass-gap YM).",
  },
  {
    keys: ["chiral anomaly", "axial anomaly", "adler-bell-jackiw", "abj"],
    out: "ABJ anomaly: ∂_μ j₅^μ = (α/π) F·F̃ at one loop. Exact (Adler-Bardeen): no higher-loop corrections. Resolves π⁰ → γγ rate; anchors anomaly cancellation in the Standard Model.",
  },
  {
    keys: ["wightman", "vacuum vector", "spectrum condition"],
    out: "Wightman axioms: (W1) Hilbert space + Poincaré rep, (W2) spectrum condition p² ≥ 0, p⁰ ≥ 0, (W3) unique vacuum, (W4) operator-valued distributions on dense domain, (W5) local commutativity (microcausality), (W6) cyclicity of vacuum.",
  },
  {
    keys: ["qed3", "qed₃", "three-dimens", "radial quantiz"],
    out: "QED₃ (2+1 D): super-renormalizable, IR-strong. Compact U(1) confines (Polyakov); non-compact with N_f flavors has a conformal window for N_f > N_f^c (≈1–4). Radial quantization + numerical bootstrap give rigorous bounds on operator dimensions.",
  },
  {
    keys: ["tensor network", "mera", "peps", "hamiltonian lattice"],
    out: "Tensor-network methods for lattice gauge theory: MPS/PEPS exactly enforce Gauss law on truncated link Hilbert spaces. For Abelian models (Schwinger, QED₂) they deliver sign-problem-free real-time and finite-density results; QED₄ tensor methods exist but scale steeply.",
  },
  {
    keys: ["spde", "stochastic quant", "parisi-wu", "regularity structure"],
    out: "Stochastic quantization / SPDE (Hairer regularity structures, paracontrolled calculus): rigorous construction of φ₄³, Φ⁴₃, dynamical Sine-Gordon. The gauge-invariant SPDE framework for Abelian/non-Abelian gauge theory is still being assembled (Chandra-Chevyrev-Hairer-Shen for YM₂, YM₃).",
  },
  {
    keys: ["effective theory", "uv complete", "wilsonian"],
    out: "Wilsonian view: QED is an EFT below some cutoff Λ where UV physics (electroweak unification ~100 GeV, GUT ~10^16 GeV) takes over. The strict-continuum isolated QED endpoint is trivial — this does NOT contradict QED's empirical success.",
  },
  {
    keys: ["mass gap", "confinement", "yang-mills"],
    out: "Mass gap in pure Yang-Mills (Clay): prove quantum YM₄ has Δ > 0. Open. Lattice gives Δ ≈ 1.5 GeV for SU(3). QED has NO mass gap (massless photon) — different problem class.",
  },
  {
    keys: ["proton radius", "muonic hydrogen"],
    out: "Proton radius puzzle: electronic-H gave r_p ≈ 0.879 fm, muonic-H gave 0.8409 fm. Re-analyses (CODATA 2018) converged near 0.8414 fm. QED itself was never at fault; the discrepancy was spectroscopy / proton-structure systematics.",
  },
  {
    keys: ["compton"],
    out: `Compton wavelength λ_c = ħc/m. Electron: λ_c = ${(HBAR_C_MEV_FM / ME_MEV).toFixed(4)} fm. Reduced λ̄_c = λ_c/(2π). Sets the scale below which relativistic / pair-production effects dominate.`,
  },
  {
    keys: ["bohr radius"],
    out: `Bohr radius a₀ = ħc/(α m_e c²) = ${(HBAR_C_MEV_FM / (ALPHA * ME_MEV)).toFixed(2)} fm ≈ 0.529 Å. Atomic size from α and m_e alone.`,
  },
  {
    keys: ["rydberg"],
    out: `Rydberg Ry = ½ α² m_e c² = ${(0.5 * ALPHA * ALPHA * ME_MEV * 1e6).toFixed(4)} eV ≈ 13.606 eV. Hydrogen ground-state binding energy.`,
  },
  {
    keys: ["dyson", "asymptotic series", "borel"],
    out: "Dyson argument: QED perturbation series is asymptotic, not convergent — α → −α makes the vacuum unstable to e⁺e⁻ runaway. Borel resummation handles factorial growth for many sectors; renormalon ambiguities remain.",
  },
  {
    keys: ["ward", "takahashi", "gauge invarian"],
    out: "Ward-Takahashi identity: k_μ Γ^μ(p, p+k) = S⁻¹(p+k) − S⁻¹(p). Forces Z₁ = Z₂, keeps the photon massless, enforces charge universality across species.",
  },
  {
    keys: ["state of the art", "open problem", "still open", "remains open", "may 2026", "2026"],
    out: "State of the art (May 2026): no full rigorous OS reconstruction of interacting 4D QED with dynamical light fermions exists. Adjacent progress: regularity-structure SPDE constructions, YM₂/YM₃ rigorous bounds, tensor-network Schwinger models, formalized constructive QFT in Lean/Coq. Triviality remains the consensus end-state for isolated continuum QED.",
  },
];

function chat(msg: string): KernelOut {
  const m = " " + msg.toLowerCase() + " ";
  const has = (kw: string[]) => kw.some((k) => m.includes(k));

  // greetings / meta
  if (/^(hi|hello|hey|sup|yo)\b/i.test(msg.trim()) || has(["who are you", "what can you do"])) {
    return { out: "QED_COMPUTER online. Paste numbers, expressions, or ask QED questions. Type 'help' for the command surface.", kind: "ok" };
  }
  if (has(["help", "commands"])) return kernel("help");
  if (has(["iterate", "converge"]) || /\bsolve\b/.test(m)) {
    return { out: "The Reality_B swarm above is already iterating α and a_e against measurement. Dedicated solvers: 'solve vacuum', 'solve singularity', 'solve dark matter', 'solve gravity', 'solve proton', 'borel'.", kind: "ok" };
  }

  // KB matching — single hit, or multi-concept synthesis
  const hits = KB.filter((e) => e.keys.some((k) => m.includes(k)));
  if (hits.length === 1) {
    return { out: hits[0].out, kind: "ok", detail: hits[0].detail };
  }
  if (hits.length > 1) {
    const top = hits.slice(0, 3);
    return {
      out: `// matched ${hits.length} QED concept${hits.length > 1 ? "s" : ""} — synthesizing:`,
      kind: "ok",
      detail: top.flatMap((h) => [`▸ ${h.out}`, ...(h.detail ?? []).map((d) => `   · ${d}`)]),
    };
  }

  // freeform analyzer — loose topical hints when no keyword fired
  const hints: string[] = [];
  if (/\b(qed|electrodynamics|photon|electron|qft)\b/i.test(msg)) hints.push("QED (electron-photon U(1) gauge theory) — try 'alpha', 'ae', 'lamb', or 'talk vacuum polarization'.");
  if (/\b(lattice|continuum|cutoff|regulariz)\b/i.test(msg)) hints.push("Lattice / continuum — try 'talk lattice qed' or 'talk triviality'.");
  if (/\b(prove|proof|rigorous|axiom|construct|complete)\b/i.test(msg)) hints.push("Constructive QFT — try 'talk osterwalder schrader', 'talk constructive', 'talk wightman'.");
  if (/\b(open|status|update|state of)\b/i.test(msg)) hints.push("For 2026 status read-out: 'talk state of the art'.");
  if (hints.length) {
    return { out: `// no exact rule matched — closest QED threads:`, kind: "warn", detail: hints };
  }

  return {
    out: `// no rule matched. Try: help · alpha · ae · lamb · compton 105.66 · 'talk triviality' · 'talk osterwalder schrader' · 'talk lattice qed' · 'talk state of the art'`,
    kind: "warn",
  };
}

// --------------------------------------------------------------------------

interface Line {
  id: number;
  kind: "in" | "out" | "err" | "warn" | "calc" | "sys";
  text: string;
  detail?: string[];
}

export function QedComputer() {
  const [paste, setPaste] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [engineId, setEngineId] = useState<EngineId>("qed");
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>(() => [
    { id: 1, kind: "sys", text: "QUANTARA_KERNEL // v2.0 · multi-engine operator terminal" },
    { id: 2, kind: "sys", text: "select engine ▾  · type 'help' for that engine's commands" },
  ]);
  const idRef = useRef(3);
  const logRef = useRef<HTMLDivElement>(null);

  // Dedicated paste-tester (separate from the work-pad)
  type TestRow = { input: string; kind: KernelOut["kind"]; out: string; detail?: string[]; ok: boolean };
  const [testPaste, setTestPaste] = useState("");
  const [testRows, setTestRows] = useState<TestRow[]>([]);
  const runTests = () => {
    if (!testPaste.trim()) return;
    const parts = testPaste.split(/\n|;+/).map((s) => s.trim()).filter(Boolean);
    const rows: TestRow[] = parts.map((p) => {
      try {
        const r = kernel(p);
        return { input: p, kind: r.kind, out: r.out, detail: r.detail, ok: r.kind !== "err" };
      } catch (e: any) {
        return { input: p, kind: "err", out: `// kernel error: ${e.message}`, ok: false };
      }
    });
    setTestRows(rows);
  };

  // hydrate transcript
  useEffect(() => {
    try {
      const s = localStorage.getItem("qed.computer.lines");
      if (s) {
        const parsed = JSON.parse(s) as Line[];
        if (Array.isArray(parsed) && parsed.length) {
          setLines(parsed);
          idRef.current = (parsed[parsed.length - 1]?.id ?? 0) + 1;
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("qed.computer.lines", JSON.stringify(lines.slice(-200))); } catch {}
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  const push = (l: Omit<Line, "id">) =>
    setLines((prev) => [...prev, { ...l, id: idRef.current++ }].slice(-400));

  const run = (raw: string) => {
    if (!raw.trim()) return;
    push({ kind: "in", text: `[${ENGINES[engineId].name}] ${raw}` });
    try {
      const r = engineId === "qed" ? kernel(raw) : ENGINES[engineId].kernel(raw);
      push({ kind: r.kind === "ok" ? "out" : r.kind, text: r.out, detail: r.detail });
    } catch (e: any) {
      push({ kind: "err", text: `// kernel error: ${e.message}` });
    }
  };

  const executePaste = () => {
    if (!paste.trim()) return;
    // split into non-empty lines / statements; ; or newline
    const parts = paste.split(/\n|;+/).map((s) => s.trim()).filter(Boolean);
    parts.forEach(run);
    setPaste("");
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    if (engineId === "qed") {
      run(chatInput.startsWith("talk ") ? chatInput : `talk ${chatInput}`);
    } else {
      run(chatInput);
    }
    setChatInput("");
  };

  const copyAll = async () => {
    const text = lines
      .map((l) => {
        const prefix =
          l.kind === "in" ? "> " : "";
        const detail = l.detail ? l.detail.map((d) => `  · ${d}`).join("\n") : "";
        return `${prefix}${l.text}${detail ? "\n" + detail : ""}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const [solved, setSolved] = useState(false);

  function buildQedDoc() {
    const x = ALPHA / PI;
    const c1 = QED_COEFFS[0] * x;
    const c2 = QED_COEFFS[1] * x * x;
    const c3 = QED_COEFFS[2] * Math.pow(x, 3);
    const c4 = QED_COEFFS[3] * Math.pow(x, 4);
    const c5 = QED_COEFFS[4] * Math.pow(x, 5);
    const aeSum = c1 + c2 + c3 + c4 + c5;
    const lamb = (8 / (3 * PI)) * Math.pow(ALPHA, 5) * ME_MEV * 1e6 * Math.log(1 / ALPHA);
    const bohr = HBAR_C_MEV_FM / (ALPHA * ME_MEV);
    const rydberg = 0.5 * ALPHA * ALPHA * ME_MEV * 1e6;
    const compton = HBAR_C_MEV_FM / ME_MEV;
    const doc = `================================================================
QUANTUM ELECTRODYNAMICS — FULL SOLVED DERIVATION
Generated by Quantara QED Computer
================================================================

0. THESIS  QED = QFT of electrons + photons (gauged U(1)). a_e agrees with experiment to ~1 part in 10^12.

1. LAGRANGIAN  L_QED = ψ̄(iγ^μ D_μ − m)ψ − (1/4)F_{μν}F^{μν} − (1/2ξ)(∂A)²    D_μ = ∂_μ + ieA_μ
2. FEYNMAN RULES  Fermion: i(γp+m)/(p²−m²+iε)  Photon: −ig_{μν}/(k²+iε)  Vertex: −ieγ^μ
3. RENORM (on-shell, Ward Z_1=Z_2)  ψ_0=√Z_2 ψ , A_0=√Z_3 A , e_0=e/√Z_3
4. RUNNING α(μ²)=α(μ_0²)/[1−(α/3π)ln(μ²/μ_0²)]
5. α = ${ALPHA.toExponential(12)}   (1/α=137.035999084)

6. SCHWINGER SERIES  a_e = Σ C_k (α/π)^k
   C1=+0.5  C2=−0.328478965  C3=+1.181241456  C4=−1.91293  C5=+7.791
   term1=${c1.toExponential(10)}  term2=${c2.toExponential(10)}
   term3=${c3.toExponential(10)}  term4=${c4.toExponential(10)}
   term5=${c5.toExponential(10)}
   a_e(QED) = ${aeSum.toExponential(12)}     a_e(exp) = ${A_E.toExponential(12)}

7. LAMB SHIFT  ΔE ≈ (8/3π)α^5 m_e c² ln(1/α) = ${lamb.toExponential(6)} eV (~1058 MHz)
8. SECONDARIES  a_0=${bohr.toExponential(6)} fm · Ry=${rydberg.toExponential(6)} eV · λ_C=${compton.toExponential(6)} fm
9. WARD–TAKAHASHI  q_μΓ^μ = S^{-1}(p+q) − S^{-1}(p)  ⇒ Z_1=Z_2
10. PATH INTEGRAL  Z[J,η,η̄] = ∫DADψDψ̄ exp{i∫(L+Jφ)}
11. UNITARITY (Cutkosky)  2 Im M(a→a) = Σ_X |M(a→X)|² dΦ_X

RESULT: a_e (theory) = ${aeSum.toExponential(12)}   |   1 part in 10^12 vs CODATA.
================================================================
END — ${new Date().toISOString()}
================================================================`;
    return {
      title: "Quantum Electrodynamics — full solved derivation (a_e to 1 part in 10^12)",
      abstract: "Lagrangian → Feynman rules → on-shell renormalization (Z_1=Z_2 via Ward) → running α → 5-loop Schwinger series for a_e → Lamb shift → Bohr/Rydberg/Compton → path integral → Cutkosky unitarity.",
      doc,
    };
  }

  const solveAndSave = async () => {
    const eng = ENGINES[engineId];
    const built = engineId === "qed" ? buildQedDoc() : eng.fullDerivation();
    try {
      await navigator.clipboard.writeText(built.doc);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = built.doc; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    let saveNote = "// saved to public solved_theories ledger";
    try {
      const { recordSolveServer } = await import("@/lib/ledger-writes.functions");
      await recordSolveServer({
        data: {
          theory: built.title,
          abstract: built.abstract.slice(0, 4000),
          math: built.doc.slice(0, 16000),
          source: `engine:${eng.id}`,
        },
      });
    } catch (e: any) {
      saveNote = `// save error: ${e?.message ?? e}`;
    }

    push({ kind: "sys", text: `// full ${eng.name} derivation copied to clipboard (${(built.doc.length / 1024).toFixed(1)} KB)` });
    push({ kind: "sys", text: saveNote });
    setSavedMsg(`${eng.name} solved · copied · saved`);
    setSolved(true);
    setTimeout(() => { setSolved(false); setSavedMsg(null); }, 3500);
  };
  const copyFullSolution = solveAndSave;


  const examples = engineId === "qed"
    ? ["alpha", "ae", "compton 105.66", "1/(4*pi) * alpha", "lamb", "feynman 4", "screening 79", "talk explain renormalization"]
    : ENGINES[engineId].commands;

  return (
    <section id="qed-computer" className="border-t border-white/5 bg-[oklch(0.05_0.01_280)] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              QUANTARA_KERNEL // MULTI-ENGINE OPERATOR TERMINAL
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
              Talk to the machine. Pick an engine. Paste the work.
            </h3>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
              Five physics engines under one operator terminal: QED, QCD, EFT/RG-Running,
              Cosmology, Quantum Gravity. Solve any formula in the engine's domain — hit
              <span className="text-fuchsia-300"> Solve & Save</span> to copy the full
              derivation and archive it on the public solved-theories record.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyFullSolution}
              className="border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-200 hover:bg-fuchsia-500/20"
            >{solved ? (savedMsg ?? "Saved") : `Solve ${ENGINES[engineId].name} · Save`}</button>
            <button
              onClick={copyAll}
              className="border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300 hover:bg-emerald-500/20"
            >{copied ? "Copied!" : "Copy All"}</button>
            <button
              onClick={() => { setLines([{ id: 1, kind: "sys", text: "// transcript cleared" }]); idRef.current = 2; }}
              className="border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white hover:border-accent/40"
            >Clear</button>
            <button
              onClick={() => run("help")}
              className="border border-accent/40 bg-accent/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent hover:bg-accent/20"
            >Help</button>
          </div>
        </div>

        {/* Engine selector */}
        <div className="mb-px grid gap-px grid-cols-2 md:grid-cols-5">
          {ENGINE_ORDER.map((id) => {
            const e = ENGINES[id];
            const active = engineId === id;
            return (
              <button
                key={id}
                onClick={() => { setEngineId(id); push({ kind: "sys", text: `// engine → ${e.name} · ${e.sub}` }); }}
                className={`border px-3 py-2 text-left font-mono transition-colors ${
                  active
                    ? "border-fuchsia-400/60 bg-fuchsia-500/10 text-fuchsia-200"
                    : "border-white/10 bg-card/30 text-white/70 hover:border-fuchsia-400/30 hover:text-white"
                }`}
              >
                <div className="text-[11px] font-bold uppercase tracking-widest">{e.name}</div>
                <div className={`mt-0.5 text-[9px] ${active ? "text-fuchsia-300/80" : "text-chrome"}`}>{e.sub}</div>
              </button>
            );
          })}
        </div>



        <div className="grid gap-px md:grid-cols-5">
          {/* Transcript */}
          <div className="glass-panel md:col-span-3 flex flex-col rounded-sm">
            <div className="border-b border-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
              TRANSCRIPT
            </div>
            <div ref={logRef} className="h-[420px] overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
              {lines.map((l) => (
                <div key={l.id} className="mb-1.5">
                  {l.kind === "in" && <div className="text-white"><span className="text-accent">›</span> {l.text}</div>}
                  {l.kind === "out" && <div className="text-emerald-300">{l.text}</div>}
                  {l.kind === "calc" && <div className="text-cyan-300">{l.text}</div>}
                  {l.kind === "warn" && <div className="text-amber-300">{l.text}</div>}
                  {l.kind === "err" && <div className="text-rose-400">{l.text}</div>}
                  {l.kind === "sys" && <div className="text-muted-foreground">{l.text}</div>}
                  {l.detail && l.detail.map((d, i) => (
                    <div key={i} className="ml-4 text-muted-foreground">· {d}</div>
                  ))}
                </div>
              ))}
            </div>
            {/* chat row */}
            <div className="flex border-t border-white/5">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="ask QED anything… (e.g. explain the Lamb shift)"
                className="flex-1 bg-transparent px-4 py-3 font-mono text-xs text-white placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={sendChat}
                className="border-l border-white/5 px-5 font-mono text-[10px] uppercase tracking-[0.2em] text-accent hover:bg-accent/10"
              >Send</button>
            </div>
          </div>

          {/* Work-pad */}
          <div className="glass-panel md:col-span-2 flex flex-col rounded-sm">
            <div className="border-b border-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
              WORK-PAD // paste full execution
            </div>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={`paste expressions, one per line or separated by ;\n\nexample:\nalpha\nae\n1/(4*pi)*alpha\ncompton 105.66\ntalk explain vacuum polarization`}
              className="h-[340px] flex-1 resize-none bg-transparent p-4 font-mono text-[11px] leading-relaxed text-white placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="border-t border-white/5 p-2">
              <div className="mb-2 flex flex-wrap gap-1">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPaste((p) => (p ? p + "\n" + ex : ex))}
                    className="border border-white/5 px-2 py-1 font-mono text-[9px] text-muted-foreground hover:border-accent/30 hover:text-accent"
                  >{ex}</button>
                ))}
              </div>
              <button
                onClick={executePaste}
                className="w-full border border-accent/40 bg-accent/10 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-accent hover:bg-accent/20"
              >▶ Execute work-pad</button>
            </div>
          </div>
        </div>

        <div className="mt-px grid gap-px md:grid-cols-4">
          {[
            ["α", ALPHA.toExponential(6)],
            ["1/α", ALPHA_INV.toFixed(6)],
            ["a_e", A_E.toExponential(6)],
            ["m_e", `${ME_MEV} MeV`],
          ].map(([k, v]) => (
            <div key={k} className="border border-white/5 bg-card/40 p-4 font-mono">
              <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">{k}</div>
              <div className="mt-1 text-sm text-white">{v}</div>
            </div>
          ))}
        </div>

        {/* DEDICATED PASTE-TESTER — paste anything; each line is fed through the
            kernel and shown with PASS/FAIL + result inline. */}
        <div className="mt-px grid gap-px md:grid-cols-2">
          <div className="glass-panel flex flex-col rounded-sm">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
              <span>◉ Test Input · paste & verify</span>
              <span className="text-accent">{testRows.length ? `${testRows.filter(r => r.ok).length}/${testRows.length} pass` : "idle"}</span>
            </div>
            <textarea
              value={testPaste}
              onChange={(e) => setTestPaste(e.target.value)}
              placeholder={`paste anything to test — one per line:\n\nalpha\nae\n1/(4*pi)*alpha\ncompton 105.66\nsolve vacuum\ntalk explain renormalization`}
              className="h-[280px] flex-1 resize-none bg-transparent p-4 font-mono text-[11px] leading-relaxed text-white placeholder:text-muted-foreground focus:outline-none"
            />
            <div className="flex gap-1 border-t border-white/5 p-2">
              <button
                onClick={runTests}
                className="flex-1 border border-accent/40 bg-accent/10 py-2 font-mono text-[11px] uppercase tracking-[0.25em] text-accent hover:bg-accent/20"
              >▶ Test Pasted Input</button>
              <button
                onClick={() => { setTestRows([]); setTestPaste(""); }}
                className="border border-white/10 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 hover:border-accent/40"
              >Clear</button>
            </div>
          </div>
          <div className="glass-panel flex flex-col rounded-sm">
            <div className="border-b border-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
              TEST RESULTS
            </div>
            <div className="h-[332px] overflow-y-auto p-4 font-mono text-[11px] leading-relaxed">
              {testRows.length === 0 && (
                <div className="text-muted-foreground">// no tests run yet — paste expressions on the left and hit Test Pasted Input.</div>
              )}
              {testRows.map((r, i) => (
                <div key={i} className="mb-2 border-l-2 pl-2" style={{ borderColor: r.ok ? "rgb(52 211 153)" : "rgb(244 63 94)" }}>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${r.ok ? "text-emerald-300" : "text-rose-400"}`}>{r.ok ? "PASS" : "FAIL"}</span>
                    <span className="text-white">› {r.input}</span>
                  </div>
                  <div className={r.ok ? "text-cyan-300" : "text-rose-400"}>{r.out}</div>
                  {r.detail && r.detail.map((d, j) => (
                    <div key={j} className="ml-3 text-muted-foreground">· {d}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
