// Statistical comparison helpers — never use the word "match" / "proves".

export function sigmaDeviation(
  measured: number,
  reference: number,
  uncertainty: number,
): number {
  if (!isFinite(uncertainty) || uncertainty <= 0) return Infinity;
  return Math.abs(measured - reference) / uncertainty;
}

export function verdictFor(sigma: number): "PASS" | "REVIEW" | "FAIL" {
  if (sigma < 1) return "PASS";
  if (sigma < 3) return "REVIEW";
  return "FAIL";
}

export function formatSigma(sigma: number): string {
  if (!isFinite(sigma)) return "∞σ";
  if (sigma < 0.01) return `<0.01σ`;
  return `${sigma.toFixed(2)}σ`;
}
