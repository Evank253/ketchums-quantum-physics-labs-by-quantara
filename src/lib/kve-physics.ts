// KVE — Scalar-field FRW cosmology, in-browser TypeScript port.
// Canonical action: S = ∫ d⁴x √-g [ M_pl²/2 R - ½(∂φ)² - V(φ) ]
// Exponential potential: V(φ) = V₀ exp(-λ φ / M_pl)
// Evolved in N = ln a with ψ = dφ/dN.
//
// Units: M_pl = 1, V₀ = 1 (sets the energy scale). Ω_m0, Ω_r0 are present-day
// fractional densities; the scalar contributes the remainder via the
// constraint H² = ρ_tot / 3.

export interface KVEParams {
  lambda: number;       // potential slope λ
  omegaM0: number;      // Ω_m today
  omegaR0: number;      // Ω_r today
  phi0: number;         // φ at N = N_start
  psi0: number;         // dφ/dN at N = N_start
  nStart: number;       // ln a start (e.g. -12)
  nEnd: number;         // ln a end   (0 = today)
  steps: number;        // integration steps
}

export const DEFAULT_PARAMS: KVEParams = {
  lambda: 50.24,
  omegaM0: 0.315,
  omegaR0: 9e-5,
  phi0: 5.0,
  psi0: 1e-8,
  nStart: -12,
  nEnd: 0,
  steps: 1500,
};

export interface KVEFrame {
  N: number;
  a: number;
  phi: number;
  psi: number;
  V: number;
  rhoM: number;
  rhoR: number;
  rhoPhi: number;
  pPhi: number;
  H: number;          // Hubble (in units where 3H² = ρ_tot)
  w: number;          // p_φ / ρ_φ
  wEff: number;       // total p / ρ
  OmegaM: number;
  OmegaR: number;
  OmegaPhi: number;
  delta: number;      // matter density contrast (growth)
  dDelta: number;     // dδ/dN
  D: number;          // normalized growth factor D(a)/D(a_end)
  civIndex: number;   // interpretive overlay (NOT physics)
}

export interface KVEResult {
  frames: KVEFrame[];
  cpl: { w0: number; wa: number };
}

function V(phi: number, lambda: number): number {
  return Math.exp(-lambda * phi);
}
function dV(phi: number, lambda: number): number {
  return -lambda * V(phi, lambda);
}

// State vector: [phi, psi, delta, dDelta]
function rhs(
  state: number[],
  N: number,
  p: KVEParams,
): number[] {
  const [phi, psi, delta, dDelta] = state;

  const rhoM = p.omegaM0 * Math.exp(-3 * N);
  const rhoR = p.omegaR0 * Math.exp(-4 * N);

  const Vp = V(phi, p.lambda);
  const kin = 0.5 * psi * psi * (rhoM + rhoR + Vp); // ½ψ² · H² scales out; keep simple
  // The N-time scalar kinetic energy ½φ̇² = ½ ψ² H². Using H² = ρ_tot/3 we
  // close the system self-consistently below.

  // First, get tentative H² ignoring kin (good when psi small), then refine.
  let rhoPhi = Vp;
  let rhoTot = rhoM + rhoR + rhoPhi;
  let H2 = rhoTot / 3;
  // refine once with kin
  const kinReal = 0.5 * psi * psi * H2;
  rhoPhi = kinReal + Vp;
  const pPhi = kinReal - Vp;
  rhoTot = rhoM + rhoR + rhoPhi;
  H2 = rhoTot / 3;
  const pTot = pPhi + rhoR / 3;
  const HdotOverH2 = -0.5 * (3 * (rhoTot + pTot)) / rhoTot; // Ḣ/H² = -½(1+w_eff)·3

  const dphi = psi;
  const dpsi = -(3 + HdotOverH2) * psi - dV(phi, p.lambda) / H2;

  // Growth: δ'' + (2 + Ḣ/H²) δ' - 3/2 Ω_m δ = 0
  const OmegaM = rhoM / rhoTot;
  const d2delta = -(2 + HdotOverH2) * dDelta + 1.5 * OmegaM * delta;

  // suppress kin to avoid unused warning
  void kin;

  return [dphi, dpsi, dDelta, d2delta];
}

function rk4Step(
  state: number[],
  N: number,
  h: number,
  p: KVEParams,
): number[] {
  const k1 = rhs(state, N, p);
  const s2 = state.map((s, i) => s + 0.5 * h * k1[i]);
  const k2 = rhs(s2, N + 0.5 * h, p);
  const s3 = state.map((s, i) => s + 0.5 * h * k2[i]);
  const k3 = rhs(s3, N + 0.5 * h, p);
  const s4 = state.map((s, i) => s + h * k3[i]);
  const k4 = rhs(s4, N + h, p);
  return state.map(
    (s, i) => s + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]),
  );
}

export function simulate(params: Partial<KVEParams> = {}): KVEResult {
  const p: KVEParams = { ...DEFAULT_PARAMS, ...params };
  const h = (p.nEnd - p.nStart) / p.steps;

  // Initial growth: matter-dominated attractor δ ∝ a => D ∝ e^N, D'=D
  let state = [p.phi0, p.psi0, Math.exp(p.nStart), Math.exp(p.nStart)];

  const frames: KVEFrame[] = [];
  for (let i = 0; i <= p.steps; i++) {
    const N = p.nStart + i * h;
    const [phi, psi, delta, dDelta] = state;

    const rhoM = p.omegaM0 * Math.exp(-3 * N);
    const rhoR = p.omegaR0 * Math.exp(-4 * N);
    const Vp = V(phi, p.lambda);
    // self-consistent H² via two passes
    let H2 = (rhoM + rhoR + Vp) / 3;
    const kin = 0.5 * psi * psi * H2;
    const rhoPhi = kin + Vp;
    const pPhi = kin - Vp;
    const rhoTot = rhoM + rhoR + rhoPhi;
    H2 = rhoTot / 3;
    const H = Math.sqrt(Math.max(H2, 1e-300));
    const pTot = pPhi + rhoR / 3;

    frames.push({
      N,
      a: Math.exp(N),
      phi,
      psi,
      V: Vp,
      rhoM,
      rhoR,
      rhoPhi,
      pPhi,
      H,
      w: rhoPhi > 0 ? pPhi / rhoPhi : -1,
      wEff: pTot / rhoTot,
      OmegaM: rhoM / rhoTot,
      OmegaR: rhoR / rhoTot,
      OmegaPhi: rhoPhi / rhoTot,
      delta,
      dDelta,
      D: delta, // normalize below
      civIndex: 0,
    });

    if (i < p.steps) state = rk4Step(state, N, h, p);
  }

  // Normalize growth factor so D(today) = 1
  const Dtoday = frames[frames.length - 1].delta || 1;
  for (const f of frames) {
    f.D = f.delta / Dtoday;
    // Interpretive overlay (NOT physics): logistic of normalized growth,
    // gated by matter dominance. Pure visualization metaphor.
    const g = Math.max(0, Math.min(1, f.D));
    f.civIndex = g * f.OmegaM;
  }

  // CPL fit w(a) ≈ w0 + wa(1-a) on low-z slice (N > -1)
  const slice = frames.filter((f) => f.N > -1 && isFinite(f.w));
  let w0 = -1;
  let wa = 0;
  if (slice.length > 3) {
    // least squares
    let s11 = 0, s12 = 0, s22 = 0, t1 = 0, t2 = 0;
    for (const f of slice) {
      const x1 = 1;
      const x2 = 1 - f.a;
      s11 += x1 * x1;
      s12 += x1 * x2;
      s22 += x2 * x2;
      t1 += x1 * f.w;
      t2 += x2 * f.w;
    }
    const det = s11 * s22 - s12 * s12;
    if (Math.abs(det) > 1e-12) {
      w0 = (s22 * t1 - s12 * t2) / det;
      wa = (-s12 * t1 + s11 * t2) / det;
    }
  }

  return { frames, cpl: { w0, wa } };
}
