// Coupled 4-loop QED + 4-loop QCD renormalization-group running.
// Piecewise integration across heavy-flavor thresholds with MS-bar matching.
// State vector Y = [alpha, alpha_s], independent variable t = ln(mu/GeV).
//
// Boundary at mu0 = 1 GeV uses data-driven HVP + leptonic VP values:
//   alpha^-1(1 GeV) ≈ 133.4532, alpha_s(1 GeV) ≈ 0.4785
//
// Coefficients per Erler / Chetyrkin et al., MS-bar scheme. See user spec.

export const ZETA3 = 1.202056903159594;
export const PI = Math.PI;

// Quark electric charges: [u, d, s, c, b, t]
const QUARK_Q = [2 / 3, -1 / 3, -1 / 3, 2 / 3, -1 / 3, 2 / 3];

export interface Constants {
  m_c: number;
  m_tau: number;
  m_b: number;
  m_z: number;
  m_t: number;
  alphaInvInit: number; // at mu0 = 1 GeV
  alphasInit: number;   // at mu0 = 1 GeV
}

export const DEFAULTS: Constants = {
  m_c: 1.27,
  m_tau: 1.77686,
  m_b: 4.18,
  m_z: 91.1876,
  m_t: 172.5,
  alphaInvInit: 133.4532,
  alphasInit: 0.4785,
};

export type State = [number, number]; // [alpha, alpha_s]

export function dYdt(state: State, Nf: number, Nlep: number): State {
  const [alpha, alphas] = state;
  let s2 = 0, s4 = 0, s6 = 0, s8 = 0;
  for (let i = 0; i < Nf; i++) {
    const q2 = QUARK_Q[i] * QUARK_Q[i];
    s2 += q2;
    s4 += q2 * q2;
    s6 += q2 * q2 * q2;
    s8 += q2 * q2 * q2 * q2;
  }
  const as_pi = alphas / PI;

  // QED (color factor d(R)=3 for quark loops)
  const b1 = (2 / 3) * Nlep + 2 * s2;
  const b2 = 0.5 * Nlep + 1.5 * s4;
  const b3 = -(121 / 288) * Nlep - (363 / 288) * s6 + as_pi * 4 * s4;
  const pure4 = -115 / 576 - (11 / 12) * ZETA3;
  const mixed4 = 111 / 32 - (57 / 4) * ZETA3;
  const b4 = pure4 * Nlep + 3 * (pure4 * s8 + as_pi * as_pi * s4 * mixed4);

  const a = alpha;
  const dAlpha =
    (b1 * a * a) / PI +
    (b2 * a ** 3) / PI ** 2 +
    (b3 * a ** 4) / PI ** 3 +
    (b4 * a ** 5) / PI ** 4;

  // QCD 4-loop
  const c0 = 11 - (2 / 3) * Nf;
  const c1 = 102 - (38 / 3) * Nf;
  const c2 = 2857 / 2 - (5033 / 18) * Nf + (325 / 54) * Nf * Nf;
  const c3 =
    (149753 / 6 + 3564 * ZETA3) -
    (1078361 / 162 + (6508 / 27) * ZETA3) * Nf +
    (50065 / 243 + (6472 / 81) * ZETA3) * Nf * Nf +
    (1093 / 729) * Nf ** 3;

  const x = alphas;
  const fp = 4 * PI;
  const dAlphas = -(
    (c0 * x * x) / fp +
    (c1 * x ** 3) / fp ** 2 +
    (c2 * x ** 4) / fp ** 3 +
    (c3 * x ** 5) / fp ** 4
  );
  return [dAlpha, dAlphas];
}

export interface Sample {
  mu: number;
  alphaInv: number;
  alphas: number;
  Nf: number;
}

export function integrateRK4(
  state: State,
  tStart: number,
  tEnd: number,
  Nf: number,
  Nlep: number,
  steps: number,
  samples?: Sample[],
): State {
  const h = (tEnd - tStart) / steps;
  let t = tStart;
  let s: State = [state[0], state[1]];
  for (let i = 0; i < steps; i++) {
    const k1 = dYdt(s, Nf, Nlep);
    const s2: State = [s[0] + 0.5 * h * k1[0], s[1] + 0.5 * h * k1[1]];
    const k2 = dYdt(s2, Nf, Nlep);
    const s3: State = [s[0] + 0.5 * h * k2[0], s[1] + 0.5 * h * k2[1]];
    const k3 = dYdt(s3, Nf, Nlep);
    const s4v: State = [s[0] + h * k3[0], s[1] + h * k3[1]];
    const k4 = dYdt(s4v, Nf, Nlep);
    s = [
      s[0] + (h / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
      s[1] + (h / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    ];
    t += h;
    if (samples && (i % Math.max(1, Math.floor(steps / 60)) === 0 || i === steps - 1)) {
      samples.push({ mu: Math.exp(t), alphaInv: 1 / s[0], alphas: s[1], Nf });
    }
  }
  return s;
}

// MS-bar matching when crossing a heavy quark threshold (mu = m_q).
// Uses 3-loop QCD decoupling and mixed gluonic correction to alpha.
export function applyQuarkMatching(state: State, Nf: number, Qq: number): State {
  const [alpha, alphas] = state;
  const C2 = 7 / 24;
  const C3 = 56473 / 124416 - (82043 / 27648) * ZETA3 - (955 / 3456) * Nf;
  const as_pi = alphas / PI;
  const alphasNew = alphas * (1 + C2 * as_pi ** 2 + C3 * as_pi ** 3);

  const K2 = 5 * Qq * Qq;
  const K3 = ((20 / 3) * ZETA3 - 55 / 12) * Qq * Qq;
  const a_pi = alpha / PI;
  const alphaNew = alpha * (1 + K2 * a_pi * as_pi + K3 * a_pi * as_pi * as_pi);
  return [alphaNew, alphasNew];
}

// Tau threshold: leptonic-only, no QCD piece.
export function applyTauMatching(state: State): State {
  const [alpha, alphas] = state;
  return [alpha * (1 - (15 / 64) * (alpha / PI) ** 3), alphas];
}

export interface RunResult {
  samples: Sample[];
  alphaInv_Mz: number;
  alphas_Mz: number;
  alphaInv_1TeV: number;
  constants: Constants;
}

export function runFullEvolution(c: Constants = DEFAULTS): RunResult {
  const samples: Sample[] = [];
  let state: State = [1 / c.alphaInvInit, c.alphasInit];
  let Nf = 3;
  let Nlep = 2;

  samples.push({ mu: 1.0, alphaInv: 1 / state[0], alphas: state[1], Nf });

  // 1 GeV -> m_c (Nf=3, Nlep=2)
  state = integrateRK4(state, Math.log(1.0), Math.log(c.m_c), Nf, Nlep, 2000, samples);
  state = applyQuarkMatching(state, Nf, 2 / 3);
  Nf = 4;

  // m_c -> m_tau (Nf=4, Nlep=2)
  state = integrateRK4(state, Math.log(c.m_c), Math.log(c.m_tau), Nf, Nlep, 1500, samples);
  state = applyTauMatching(state);
  Nlep = 3;

  // m_tau -> m_b (Nf=4, Nlep=3)
  state = integrateRK4(state, Math.log(c.m_tau), Math.log(c.m_b), Nf, Nlep, 2000, samples);
  state = applyQuarkMatching(state, Nf, -1 / 3);
  Nf = 5;

  // m_b -> M_Z (Nf=5, Nlep=3)
  state = integrateRK4(state, Math.log(c.m_b), Math.log(c.m_z), Nf, Nlep, 3000, samples);
  const stateMz: State = [state[0], state[1]];

  // M_Z -> m_t (continue)
  state = integrateRK4(state, Math.log(c.m_z), Math.log(c.m_t), Nf, Nlep, 2000, samples);
  state = applyQuarkMatching(state, Nf, 2 / 3);
  Nf = 6;

  // m_t -> 1 TeV
  state = integrateRK4(state, Math.log(c.m_t), Math.log(1000), Nf, Nlep, 2000, samples);
  const state1TeV: State = [state[0], state[1]];

  return {
    samples,
    alphaInv_Mz: 1 / stateMz[0],
    alphas_Mz: stateMz[1],
    alphaInv_1TeV: 1 / state1TeV[0],
    constants: c,
  };
}
