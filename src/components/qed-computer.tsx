import { useEffect, useRef, useState } from "react";
import { useWorld } from "@/lib/world-store";

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
function chat(msg: string): KernelOut {
  const m = msg.toLowerCase();
  const has = (kw: string[]) => kw.some((k) => m.includes(k));

  if (has(["what is qed", "explain qed", "quantum electrodynamics"]))
    return {
      out: "QED = relativistic QFT of electrons + photons. Gauge group U(1). Coupling α ≈ 1/137. Best-tested theory in physics: a_e agrees with experiment to >10 decimal places.",
      kind: "ok",
    };
  if (has(["alpha", "fine-structure", "fine structure"]))
    return { out: `α = ${ALPHA.toExponential(10)} (dimensionless). 1/α = ${ALPHA_INV.toFixed(9)}. Sets coupling strength of electromagnetism.`, kind: "ok" };
  if (has(["anomalous", "g-2", "g2", "magnetic moment"]))
    return { out: `a_e = (g−2)/2 = ${A_E.toExponential(10)}. Schwinger first term: α/(2π) ≈ ${(ALPHA / (2 * PI)).toExponential(6)}.`, kind: "ok" };
  if (has(["lamb"]))
    return { out: "Lamb shift: 2S_1/2 sits ~1058 MHz above 2P_1/2 in hydrogen — proof that QED radiative corrections are real.", kind: "ok" };
  if (has(["renormaliz"]))
    return { out: "QED is perturbatively renormalizable. UV divergences in self-energy, vertex, and vacuum-polarization are absorbed into m, e, and field-strength counterterms.", kind: "ok" };
  if (has(["vacuum polariz"]))
    return { out: "Vacuum polarization (Uehling): photon propagator is dressed by virtual e+e− loops → effective coupling runs with energy. α(M_Z) ≈ 1/128.", kind: "ok" };
  if (has(["help", "what can you", "commands"]))
    return kernel("help");
  if (has(["hi", "hello", "hey", "who are you"]))
    return { out: "QED_COMPUTER online. Paste numbers, expressions, or ask QED questions. Type 'help' for the command surface.", kind: "ok" };
  if (has(["solve", "iterate", "converge"]))
    return { out: "The Reality_B swarm above is already iterating α and a_e against measurement. Paste your blueprint constants here and I'll re-derive locally.", kind: "ok" };

  return {
    out: `// no rule matched. Try: help · alpha · ae · lamb · compton 105.66 · 1+alpha/(2*pi) · or 'talk explain renormalization'`,
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
  const [lines, setLines] = useState<Line[]>(() => [
    { id: 1, kind: "sys", text: "QED_COMPUTER // v1.0 · operator terminal" },
    { id: 2, kind: "sys", text: "type 'help' or paste expressions into the work-pad ▼" },
  ]);
  const idRef = useRef(3);
  const logRef = useRef<HTMLDivElement>(null);

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
    push({ kind: "in", text: raw });
    try {
      const r = kernel(raw);
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
    run(chatInput.startsWith("talk ") ? chatInput : `talk ${chatInput}`);
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
  const copyFullSolution = async () => {
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

0. THESIS
  QED is the quantum field theory of the electron-photon system,
  obtained by gauging the global U(1) phase symmetry of the free
  Dirac field. Its predictions match experiment to better than one
  part in 10^12, the most accurate match in physical science.

1. LAGRANGIAN
  L_QED  =  ψ̄ (i γ^μ D_μ − m) ψ  −  (1/4) F_{μν} F^{μν}  −  (1/2ξ)(∂_μ A^μ)^2

  with covariant derivative      D_μ = ∂_μ + i e A_μ
  and field strength             F_{μν} = ∂_μ A_ν − ∂_ν A_μ
  Lorenz gauge fixing parameter  ξ  (ξ=1 Feynman, ξ=0 Landau).

2. EULER–LAGRANGE EQUATIONS
  Dirac:    (i γ^μ ∂_μ − m) ψ = e γ^μ A_μ ψ
  Maxwell:  ∂_μ F^{μν} = e ψ̄ γ^ν ψ ≡ j^ν
  Current conservation:  ∂_ν j^ν = 0   (consequence of U(1)).

3. CANONICAL QUANTIZATION
  {ψ_α(x), ψ_β†(y)}_{x0=y0} = δ_{αβ} δ³(x−y)
  [A_μ(x), Π^ν(y)]_{x0=y0} = i δ_μ^ν δ³(x−y)
  Mode expansions:
    ψ(x)   = ∫ d³p/(2π)³ √(m/E_p) Σ_s [ b_{p,s} u_s(p) e^{−ipx}
                                       + d†_{p,s} v_s(p) e^{+ipx} ]
    A_μ(x) = ∫ d³k/(2π)³ 1/√(2ω_k) Σ_λ [ a_{k,λ} ε^λ_μ e^{−ikx} + h.c. ]

4. FEYNMAN RULES (momentum space, Feynman gauge)
  Fermion propagator   :  i (γ^μ p_μ + m) / (p² − m² + iε)
  Photon  propagator   :  −i g_{μν} / (k² + iε)
  Vertex                :  −i e γ^μ
  External e−          :  u_s(p)        External ē      :  ū_s(p)
  External e+          :  v_s(p)        External photon :  ε^λ_μ(k)
  Closed fermion loop  :  (−1) · trace

5. RENORMALIZATION (on-shell scheme)
  Bare ↔ renormalized:
    ψ_0 = √Z_2 ψ      A_0 = √Z_3 A     e_0 = (Z_1/(Z_2 √Z_3)) e
    m_0 = m + δm
  Ward–Takahashi identity:  Z_1 = Z_2   ⇒   e_0 = e/√Z_3.
  Counterterms cancel UV divergences order-by-order; physical
  observables are finite and gauge-invariant.

6. RUNNING COUPLING (one-loop vacuum polarization)
    α(μ²) = α(μ0²) / [ 1 − (α(μ0²)/(3π)) ln(μ²/μ0²) ]
  Landau pole at μ ≈ m_e exp(3π/(2α)) ≈ 10^286 GeV (irrelevant in
  practice; QED is embedded in the Standard Model far below).

7. FINE-STRUCTURE CONSTANT (CODATA reference)
    α        = 1/137.035 999 084
    α        = ${ALPHA.toExponential(12)}
    α/π      = ${x.toExponential(12)}

8. ANOMALOUS MAGNETIC MOMENT a_e  =  (g−2)/2
   Schwinger series in (α/π):
     a_e =  C1 (α/π)
          + C2 (α/π)^2
          + C3 (α/π)^3
          + C4 (α/π)^4
          + C5 (α/π)^5  +  …
   Coefficients (mass-independent QED):
     C1 = +1/2                                  = +0.5
     C2 = −0.328 478 965 …                      (Petermann/Sommerfield)
     C3 = +1.181 241 456 …                      (Laporta/Remiddi)
     C4 = −1.912 98 …                           (Kinoshita et al.)
     C5 = +7.791 …                              (Aoyama et al., five-loop)

   Numerical evaluation here:
     term 1  = ${c1.toExponential(12)}
     term 2  = ${c2.toExponential(12)}
     term 3  = ${c3.toExponential(12)}
     term 4  = ${c4.toExponential(12)}
     term 5  = ${c5.toExponential(12)}
     ─────────────────────────────────────────
     a_e(QED) = ${aeSum.toExponential(12)}
     a_e(exp) = ${A_E.toExponential(12)}     (CODATA)
     Δ        = ${(aeSum - A_E).toExponential(4)}

9. SCHWINGER ONE-LOOP DERIVATION (sketch)
   Vertex correction Γ^μ(p',p) = γ^μ F_1(q²) + (i σ^{μν} q_ν)/(2m) F_2(q²)
   At q² = 0:
     F_1(0) = 1                (charge)
     F_2(0) = α/(2π)           (anomaly)
   ⇒  μ = (e/2m) g S    with  g = 2(1 + F_2(0))  =  2 + α/π
   ⇒  a_e^{1-loop} = α/(2π) = ${(ALPHA / (2 * PI)).toExponential(12)}

10. LAMB SHIFT (2S_{1/2} − 2P_{1/2} in hydrogen)
    Leading Bethe estimate:
      ΔE_Lamb ≈ (8/3π) α^5 m_e c² · ln(1/α)
    Numerical:
      ΔE_Lamb ≈ ${lamb.toExponential(6)}  eV   (≈ 1058 MHz)

11. SECONDARY OBSERVABLES
    Bohr radius        a_0 = ħc/(α m_e c²)  = ${bohr.toExponential(9)}  fm
    Rydberg energy     Ry  = (1/2) α² m_e c² = ${rydberg.toExponential(9)}  eV
    Compton wavelength λ_C = ħc/(m_e c²)    = ${compton.toExponential(9)}  fm

12. WARD–TAKAHASHI IDENTITY (derivation)
    Gauge invariance ⇒  q_μ Γ^μ(p+q, p) = S_F^{-1}(p+q) − S_F^{-1}(p)
    Differentiating w.r.t. q at q=0 reproduces Z_1 = Z_2.

13. PATH INTEGRAL FORMULATION
    Z[J,η,η̄] = ∫ DA Dψ Dψ̄ exp{ i ∫ d⁴x [ L_QED + J·A + η̄ψ + ψ̄η ] }
    Generating functional W = −i ln Z gives connected Green functions;
    Legendre transform Γ[A,ψ,ψ̄] gives 1PI vertices — the proper
    self-energy Σ(p) and vertex Γ^μ used above.

14. CONSISTENCY / UNITARITY
    Optical theorem (Cutkosky):  2 Im M(a→a) = Σ_X |M(a→X)|² dΦ_X.
    QED amplitudes satisfy this order by order — internal proof that
    the renormalized theory is unitary and probability-conserving.

15. RESULT
    The QED Lagrangian, quantized canonically (or via path integral),
    renormalized on-shell with Z_1 = Z_2 enforced by the Ward identity,
    and expanded perturbatively in α/π, predicts:

        a_e (theory) = ${aeSum.toExponential(12)}
        a_e (CODATA) = ${A_E.toExponential(12)}
        agreement    ≈ 1 part in 10^12

    This is the solved theory.  All higher-order contributions
    (hadronic, electroweak) are sub-leading at the 10^-12 level
    and supplied by their own EFTs; pure QED converges on the
    experimental value as shown.

================================================================
END OF DERIVATION — ${new Date().toISOString()}
================================================================
`;
    try {
      await navigator.clipboard.writeText(doc);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = doc; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    push({ kind: "sys", text: "// full QED derivation copied to clipboard (15 sections, ~5 KB)" });
    push({ kind: "calc", text: `a_e(QED 5-loop) = ${aeSum.toExponential(12)}  vs CODATA ${A_E.toExponential(12)}` });
    setSolved(true);
    setTimeout(() => setSolved(false), 2500);
  };

  const examples = [
    "alpha",
    "ae",
    "compton 105.66",
    "1/(4*pi) * alpha",
    "lamb",
    "feynman 4",
    "screening 79",
    "talk explain renormalization",
  ];

  return (
    <section id="qed-computer" className="border-t border-white/5 bg-[oklch(0.05_0.01_280)] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              QED_COMPUTER // OPERATOR_TERMINAL
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
              Talk to the machine. Paste the work.
            </h3>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
              A dedicated QED computer. Drop in numbers, full derivations, or
              natural-language questions. The kernel parses expressions, runs
              Schwinger expansions, and answers back. Transcript persists locally.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyFullSolution}
              className="border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-200 hover:bg-fuchsia-500/20"
            >{solved ? "Solution copied" : "Solve QED · Copy"}</button>
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
      </div>
    </section>
  );
}
