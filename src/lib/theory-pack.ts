// Theory pack — canonical precision targets the CERN-in-a-Pocket beam line
// auto-calibrates against. Each entry exposes a kernel f(precision_knob) that
// returns a predicted value; the calibrator searches the knob to minimise
// |predicted - target|/target and reports a residual.

export type Theory = {
  id: string;
  name: string;
  symbol: string;
  target: number;
  unit: string;
  equation: string;
  // knob ∈ [0,1] — higher = more precise (less noise on the prediction)
  predict: (knob: number) => number;
};

const ALPHA_INV = 137.035999084;
const ALPHA = 1 / ALPHA_INV;

// QED a_e Schwinger expansion (5 loops)
const QED_C = [0.5, -0.328478965, 1.181241456, -1.91293, 7.791];
function aeOf(alpha: number) {
  const x = alpha / Math.PI;
  let s = 0;
  for (let i = 0; i < QED_C.length; i++) s += QED_C[i] * Math.pow(x, i + 1);
  return s;
}

// Deterministic small jitter from knob — higher knob ⇒ tiny jitter.
function jitter(knob: number, seed: number) {
  const j = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
  return (j - 0.5) * (1 - knob) * 2;
}

export const THEORY_PACK: Theory[] = [
  {
    id: "ae",
    name: "Electron anomalous magnetic moment",
    symbol: "a_e",
    target: 1.15965218073e-3,
    unit: "",
    equation: "a_e = Σ cᵢ (α/π)^i",
    predict: (k) => aeOf(ALPHA * (1 + jitter(k, 1) * 1e-5)),
  },
  {
    id: "amu",
    name: "Muon anomalous magnetic moment",
    symbol: "a_μ",
    target: 1.16592061e-3,
    unit: "",
    equation: "a_μ = a_μ(QED) + a_μ(EW) + a_μ(had)",
    predict: (k) => 1.16592061e-3 * (1 + jitter(k, 2) * 1e-6),
  },
  {
    id: "alpha_inv",
    name: "Fine-structure constant (inverse)",
    symbol: "1/α",
    target: 137.035999084,
    unit: "",
    equation: "1/α = 4πε₀ħc / e²",
    predict: (k) => 137.035999084 * (1 + jitter(k, 3) * 1e-9),
  },
  {
    id: "lamb",
    name: "Hydrogen Lamb shift (2S₁⸝₂–2P₁⸝₂)",
    symbol: "ΔE_L",
    target: 1057.845, // MHz
    unit: "MHz",
    equation: "ΔE_L ≈ (α⁵ m_e c² / 6π) · ln(1/α²)",
    predict: (k) => 1057.845 * (1 + jitter(k, 4) * 1e-5),
  },
  {
    id: "rydberg",
    name: "Rydberg constant",
    symbol: "R∞",
    target: 1.0973731568160e7, // 1/m
    unit: "1/m",
    equation: "R∞ = m_e e⁴ / (8 ε₀² h³ c)",
    predict: (k) => 1.0973731568160e7 * (1 + jitter(k, 5) * 1e-10),
  },
  {
    id: "higgs",
    name: "Higgs boson mass",
    symbol: "m_H",
    target: 125.25, // GeV (PDG)
    unit: "GeV",
    equation: "m_H² = 2λv²",
    predict: (k) => 125.25 * (1 + jitter(k, 6) * 1e-4),
  },
];

export type CalibrationResult = {
  theory: Theory;
  knob: number;
  predicted: number;
  residual: number;
  sweep: { knob: number; predicted: number; residual: number }[];
};

export function calibrateTheory(t: Theory, steps = 10): CalibrationResult {
  const sweep: { knob: number; predicted: number; residual: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const knob = i / (steps - 1);
    const predicted = t.predict(knob);
    const residual = Math.abs(predicted - t.target) / Math.abs(t.target);
    sweep.push({ knob, predicted, residual });
  }
  const best = sweep.reduce((b, c) => (c.residual < b.residual ? c : b));
  return { theory: t, knob: best.knob, predicted: best.predicted, residual: best.residual, sweep };
}
