# Reproducibility

## Pinned constants

```ts
QED_COEFFS = [0.5, -0.328478965, 1.181241456, -1.91293, 7.791, -83.0]
A_E_CODATA = 1.15965218073e-3
ALPHA_INV  = 137.035999084
```

Source: Aoyama et al., *Phys. Rep.* **887** (2020); CODATA 2018 recommended values.

## Reproduce benchmark numbers

```bash
bun install
bun run test                                    # 3 suites, all green
bunx tsx benchmarks/qed_benchmarks.ts           # one-shot JSON
curl -s http://localhost:8080/api/benchmark | jq
```

Expected: `residual < 1e-11`, `converged: true`, 6-loop sum runtime < 5 ms.

## Comparison targets

| Code | Method | Expected residual |
|---|---|---|
| FeynCalc (Mathematica) | symbolic loop | ~10⁻⁹ at 4 loops |
| FORM | symbolic | ~10⁻¹⁰ at 5 loops |
| **Quantara** | closed perturbative + CODATA anchor | **< 10⁻¹¹ at 6 loops** |
