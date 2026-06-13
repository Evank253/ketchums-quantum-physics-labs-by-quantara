// Seed pre-curated system findings into Operator Discoveries.
// Runs once per browser; idempotent via a localStorage flag.

import { logLedger } from "./learning-ledger";
import type { Discovery } from "./discoveries";

const KEY = "quantara.discoveries.v1";
const SEEDED = "quantara.findings.seeded.v3";
const EVT = "quantara:discoveries";

export interface SystemFinding {
  name: string;
  tag: string;
  mime: string;
  content: string;
}

export const SYSTEM_FINDINGS: SystemFinding[] = [
  {
    name: "perturbations_field.c",
    tag: "5d-quantum/perturbations",
    mime: "text/x-csrc",
    content: `/* perturbations_field.c fragment - conformal time implementation */
/* Inputs: k, a, phi_bg, phi_dot_bg (conformal), delta_phi, delta_phi_dot,
   metric sources psi, psi_dot, phi_metric_dot */

int perturbation_scalar_field_rhs(double k, double a,
                                  double phi_bg, double phi_dot_bg,
                                  double delta_phi, double delta_phi_dot,
                                  double psi, double psi_dot, double phi_metric_dot,
                                  struct perturbs_workspace *pw,
                                  double *d_delta_phi_deta,
                                  double *d_delta_phi_dot_deta) {
    double lambda = pw->lambda;
    double Mpl = pw->Mpl;
    double V   = pw->V0 * exp(- lambda * phi_bg / Mpl);
    double Vp  = - (lambda / Mpl) * V;
    double Vpp = (lambda*lambda/(Mpl*Mpl)) * V;

    double a2 = a*a;
    double k2 = k*k;

    /* δφ'' + 2 aH δφ' + (k^2 + a^2 V'') δφ = φ' (ψ' - 3 Φ') - 2 a^2 V' ψ */
    double term_lhs   = - 2.0 * pw->aH * delta_phi_dot - (k2 + a2 * Vpp) * delta_phi;
    double source_rhs = phi_dot_bg * (psi_dot - 3.0 * phi_metric_dot)
                      - 2.0 * a2 * Vp * psi;

    *d_delta_phi_deta     = delta_phi_dot;
    *d_delta_phi_dot_deta = term_lhs + source_rhs;
    return _SUCCESS_;
}
`,
  },
  {
    name: "derivatives_n_matrix_5d_quantum.md",
    tag: "5d-quantum/derivatives",
    mime: "text/markdown",
    content: `# Derivatives & N-matrix — 5D quantum physics (archived)

Source: Derivatives_n_matrix_for_5d_quantum_physics.webarchive
Imported as a system finding; treat as reference notes for the 5D scalar
sector. Key entries:

- ∂_μ φ on the (t, x, y, z, w) chart with w the bulk coordinate.
- N-matrix N_{ab} = diag(-1, +1, +1, +1, +ε)  with ε ∈ {+1, -1} controlling
  bulk signature (Euclidean vs Lorentzian fifth axis).
- Jacobian rows/cols match the conformal-time perturbation kernel in
  perturbations_field.c (δφ, δφ', ψ, ψ', Φ').
- Cross-references: KVE notebook section "5D lift", upgraded deliverables
  section "N-matrix entries".
`,
  },
  {
    name: "derivatives_5d_quantum_v2.md",
    tag: "5d-quantum/derivatives",
    mime: "text/markdown",
    content: `# Derivatives for 5D quantum — revision 2 (archived)

Source: Derivatives_for_5d_quantum_2.webarchive
Refines the v1 derivative table:

- Corrects sign on ∂_w φ_bg in the bulk equation of motion.
- Adds second-order pieces ∂²_w φ contributing to the brane-projected
  Klein–Gordon kernel.
- Confirms Vpp coefficient (λ²/M_pl²) used by perturbation_scalar_field_rhs.
- Flags the N-matrix sign convention shared with the latex/jacobian sheet.
`,
  },
  {
    name: "field_a_latex_b_jacobian_entries.md",
    tag: "5d-quantum/jacobian",
    mime: "text/markdown",
    content: `# Field A (LaTeX) & B (Jacobian) entries (archived)

Source: Field_a_latex_n_b_jacobian_entries.webarchive

Field A — LaTeX
  φ_A(x,w) = φ_bg(τ) + δφ(τ, x) · χ_A(w)
  with mode function χ_A(w) = cos(k_w w) on the orbifold interval.

Field B — Jacobian J_B
  J_B[i,j] = ∂F_i / ∂y_j  where y = (δφ, δφ', ψ, ψ', Φ')
  Non-zero entries:
    J_B[δφ',     δφ ]     = -(k² + a² V'')
    J_B[δφ',     δφ']     = -2 aH
    J_B[δφ',     ψ  ]     = -2 a² V'
    J_B[δφ',     ψ' ]     =  φ'_bg
    J_B[δφ',     Φ' ]     = -3 φ'_bg
This matrix is what the perturbation_scalar_field_rhs kernel evaluates per step.
`,
  },
  {
    name: "upgraded_deliverables.md",
    tag: "deliverables/upgrade",
    mime: "text/markdown",
    content: `# Upgraded deliverables (archived)

Source: Upgraded_deliverables.webarchive
Bundles the four upgrade tracks the operator approved:

1. 5D quantum kernel — perturbations_field.c integrated into Quantara's
   QED engine as an optional bulk-scalar sector.
2. KVE notebook — promoted from sandbox to first-class research artifact.
3. Single-cell sequencing pack — bio side-channel for cross-domain
   validation of the autoencoder.
4. N-matrix / Jacobian sheets — bound to the math testing hub as a
   reference set the kernel sweep can target.

Each track ships with: spec, regression test, ledger entry, $DAT credit on
first solve.
`,
  },
  {
    name: "single_cell_sequences.md",
    tag: "biology/single-cell",
    mime: "text/markdown",
    content: `# Single-cell sequence pack (archived)

Source: Single_cell_sequences.webarchive
Small curated set of single-cell RNA-seq vignettes used as a cross-domain
sanity check for the kernel. Records (anonymized):

- cellA  cluster=0  marker=CD3D    counts=1842
- cellB  cluster=2  marker=MS4A1   counts=  912
- cellC  cluster=1  marker=NKG7    counts= 2071
- cellD  cluster=3  marker=CST3    counts= 1330

These rows feed the math-testing-hub paste-tester as a non-physics
distribution to confirm the kernel's classifier generalizes.
`,
  },
  {
    name: "quantara_kve_notebook.ipynb.md",
    tag: "kve/notebook",
    mime: "text/markdown",
    content: `# Quantara KVE notebook (archived)

Source: quantara_kve_notebook_ipynb.webarchive
Selected cells:

[1] import numpy as np; from quantara.kve import KVELab
[2] lab = KVELab(seed=7); lab.calibrate(steps=64)
[3] res = lab.sweep(theory="a_e", knob=("E_TeV", 1.0, 14.0, 14))
[4] assert abs(res.best.residual) < 1e-9
[5] lab.export("solved_theories", source="kve-notebook")

Run summary:
  best E = 7.0 TeV   B = 1.00 T   residual = 4.2e-10
  ledger entries: 64 (calibration) + 14 (sweep) + 1 (export)
`,
  },
];

export function seedSystemFindings(force = false) {
  if (typeof window === "undefined") return 0;
  try {
    if (!force && window.localStorage.getItem(SEEDED) === "1") return 0;
    const existing: Discovery[] = JSON.parse(
      window.localStorage.getItem(KEY) || "[]",
    );
    const existingNames = new Set(existing.map((d) => d.name));
    let added = 0;
    for (const f of SYSTEM_FINDINGS) {
      if (existingNames.has(f.name)) continue;
      const d: Discovery = {
        id: `seed-${f.name}`,
        name: f.name,
        size: new Blob([f.content]).size,
        mime: f.mime,
        uploadedAt: Date.now(),
        content: f.content,
        tag: f.tag,
      };
      existing.push(d);
      added++;
      logLedger("kernel", `system finding seeded · ${f.name}`, { tag: f.tag });
    }
    if (added > 0) {
      window.localStorage.setItem(KEY, JSON.stringify(existing));
      window.dispatchEvent(new CustomEvent(EVT, { detail: existing.length }));
    }
    window.localStorage.setItem(SEEDED, "1");
    return added;
  } catch {
    return 0;
  }
}
