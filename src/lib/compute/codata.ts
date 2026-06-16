// CODATA 2022 reference values and uncertainties for the constants the
// QED engine targets. These are static — no network fetches.

export type CodataConstant = {
  symbol: string;
  name: string;
  value: number;
  uncertainty: number; // 1-sigma standard uncertainty
  unit: string;
  source: string;
};

export const CODATA: Record<string, CodataConstant> = {
  a_e: {
    symbol: "a_e",
    name: "Electron magnetic-moment anomaly",
    value: 1.15965218059e-3,
    uncertainty: 1.3e-13,
    unit: "(dimensionless)",
    source: "CODATA 2022",
  },
  alpha_inv: {
    symbol: "α⁻¹",
    name: "Inverse fine-structure constant",
    value: 137.035999084,
    uncertainty: 2.1e-8,
    unit: "(dimensionless)",
    source: "CODATA 2022",
  },
};

export function codataFor(symbol: string): CodataConstant | null {
  return CODATA[symbol] ?? null;
}
