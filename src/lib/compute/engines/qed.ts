// Thin adapter that wraps the existing QED engine in the typed result envelope
// expected by the institutional pipeline. No new physics here.

import { QEDEngine } from "@/engine/qed_calculator";
import type { ComputeResult } from "../result-types";

export type QedInputs = {
  loops?: number; // 1..6
  precision?: number;
};

export function runQed(inputs: QedInputs): ComputeResult {
  const loops = Math.max(1, Math.min(6, Math.floor(inputs.loops ?? 5)));
  const precision = inputs.precision ?? 1e-11;
  const engine = new QEDEngine(precision, loops);
  const value = engine.calculateAe();
  // Engine uncertainty grows with truncation order; conservative estimate.
  const uncertainty = Math.max(precision, 1e-11) * Math.pow(10, 6 - loops);
  return {
    symbol: "a_e",
    value,
    uncertainty,
    source: "engine",
    method: `perturbative Σ to ${loops} loops`,
    reference: "Aoyama et al. (Phys. Rep. 887, 2020) coefficients",
    timestamp: new Date().toISOString(),
  };
}

export const QED_MODEL_ID = "qed.electron_anomaly";
