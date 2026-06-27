// Catalog of theoretical formulas exposed in the solve box.
// Each entry can be symbolically displayed (LaTeX) and many can be numerically
// evaluated via mathjs with an arbitrary variable map.

export interface FormulaEntry {
  id: string;
  category:
    | "QM"
    | "QED"
    | "QCD"
    | "GR"
    | "Cosmology"
    | "EM"
    | "Classical"
    | "Thermo"
    | "StatMech"
    | "Symbolic";
  name: string;
  latex: string;
  description: string;
  // mathjs-compatible expression (null = display only).
  expression: string | null;
  // Default variable values used to seed the evaluator.
  defaults?: Record<string, number>;
  citation?: string;
}

export const FORMULA_CATALOG: FormulaEntry[] = [
  // ───────── Quantum Mechanics ─────────
  {
    id: "schrodinger-time-dep",
    category: "QM",
    name: "Time-dependent Schrödinger equation",
    latex: "i\\hbar\\,\\partial_t\\psi = \\hat{H}\\psi",
    description: "Evolution of a quantum state under Hamiltonian H.",
    expression: null,
  },
  {
    id: "schrodinger-stat",
    category: "QM",
    name: "Stationary Schrödinger equation (1D)",
    latex: "-\\frac{\\hbar^2}{2m}\\psi''(x) + V(x)\\psi = E\\psi",
    description: "Eigenvalue form for stationary states.",
    expression: null,
  },
  {
    id: "infinite-well",
    category: "QM",
    name: "Infinite square well energy E_n",
    latex: "E_n = \\frac{n^2 \\pi^2 \\hbar^2}{2 m L^2}",
    description: "Energy levels of a particle in an infinite well of width L.",
    expression: "(n^2 * pi^2 * hbar^2) / (2 * m * L^2)",
    defaults: { n: 1, hbar: 1.054571817e-34, m: 9.1093837015e-31, L: 1e-9 },
  },
  {
    id: "harmonic-oscillator",
    category: "QM",
    name: "Harmonic oscillator energy E_n",
    latex: "E_n = \\hbar\\omega\\left(n + \\tfrac{1}{2}\\right)",
    description: "Quantized energies of a 1D harmonic oscillator.",
    expression: "hbar * omega * (n + 1/2)",
    defaults: { n: 0, hbar: 1.054571817e-34, omega: 1e14 },
  },
  {
    id: "heisenberg",
    category: "QM",
    name: "Heisenberg uncertainty",
    latex: "\\Delta x \\, \\Delta p \\ge \\tfrac{\\hbar}{2}",
    description: "Lower bound on position-momentum spread.",
    expression: "hbar / 2",
    defaults: { hbar: 1.054571817e-34 },
  },
  {
    id: "de-broglie",
    category: "QM",
    name: "de Broglie wavelength",
    latex: "\\lambda = h/p",
    description: "Matter-wave wavelength for momentum p.",
    expression: "h / p",
    defaults: { h: 6.62607015e-34, p: 1e-24 },
  },
  {
    id: "born-rule",
    category: "QM",
    name: "Born rule",
    latex: "P(x) = |\\psi(x)|^2",
    description: "Probability density from a wavefunction.",
    expression: null,
  },

  // ───────── QED ─────────
  {
    id: "fine-structure",
    category: "QED",
    name: "Fine-structure constant α",
    latex: "\\alpha = \\frac{e^2}{4\\pi\\varepsilon_0 \\hbar c}",
    description: "Dimensionless coupling of QED.",
    expression: "e^2 / (4 * pi * eps0 * hbar * c)",
    defaults: {
      e: 1.602176634e-19,
      eps0: 8.8541878128e-12,
      hbar: 1.054571817e-34,
      c: 299792458,
    },
    citation: "CODATA 2022",
  },
  {
    id: "ae-schwinger",
    category: "QED",
    name: "Electron anomalous moment a_e (5-loop)",
    latex:
      "a_e = c_1 x + c_2 x^2 + c_3 x^3 + c_4 x^4 + c_5 x^5,\\; x = \\alpha/\\pi",
    description: "Schwinger + higher-order QED expansion.",
    expression:
      "(0.5)*x + (-0.328478965)*x^2 + (1.181241456)*x^3 + (-1.91293)*x^4 + (7.791)*x^5",
    defaults: { x: 7.2973525693e-3 / Math.PI },
    citation: "CODATA 2022, a_e ref ≈ 1.159652180730e-3",
  },
  {
    id: "lamb-shift",
    category: "QED",
    name: "Lamb shift (leading)",
    latex:
      "\\Delta E \\approx \\frac{\\alpha^5 m_e c^2}{6\\pi n^3}\\ln\\!\\frac{1}{\\alpha^2}",
    description: "QED splitting of hydrogen 2S_{1/2}–2P_{1/2}.",
    expression:
      "(alpha^5 * me * c^2) / (6 * pi * n^3) * log(1/alpha^2)",
    defaults: {
      alpha: 7.2973525693e-3,
      me: 9.1093837015e-31,
      c: 299792458,
      n: 2,
    },
  },
  {
    id: "klein-gordon",
    category: "QED",
    name: "Klein–Gordon equation",
    latex: "(\\Box + m^2)\\,\\phi = 0",
    description: "Relativistic scalar field equation.",
    expression: null,
  },
  {
    id: "dirac",
    category: "QED",
    name: "Dirac equation",
    latex: "(i\\gamma^\\mu \\partial_\\mu - m)\\psi = 0",
    description: "Relativistic spin-½ wave equation.",
    expression: null,
  },

  // ───────── QCD ─────────
  {
    id: "qcd-lagrangian",
    category: "QCD",
    name: "QCD Lagrangian",
    latex:
      "\\mathcal{L}_{QCD} = -\\tfrac{1}{4}G^a_{\\mu\\nu}G^{a\\,\\mu\\nu} + \\bar{\\psi}(i\\gamma^\\mu D_\\mu - m)\\psi",
    description: "SU(3) gauge theory of quarks and gluons.",
    expression: null,
  },
  {
    id: "alpha-s",
    category: "QCD",
    name: "Running coupling α_s(Q)",
    latex:
      "\\alpha_s(Q) = \\frac{1}{b_0 \\ln(Q^2/\\Lambda^2)},\\; b_0 = (33-2n_f)/(12\\pi)",
    description: "One-loop running of the strong coupling.",
    expression:
      "1 / (((33 - 2*nf)/(12*pi)) * log(Q^2 / Lambda^2))",
    defaults: { nf: 5, Q: 91.1876, Lambda: 0.21 },
  },

  // ───────── General Relativity ─────────
  {
    id: "efe",
    category: "GR",
    name: "Einstein field equations",
    latex:
      "G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}",
    description: "Curvature–matter relation in GR.",
    expression: null,
  },
  {
    id: "schwarzschild-radius",
    category: "GR",
    name: "Schwarzschild radius",
    latex: "r_s = \\frac{2GM}{c^2}",
    description: "Event horizon radius of a non-rotating black hole.",
    expression: "(2 * G * M) / c^2",
    defaults: { G: 6.6743e-11, M: 1.989e30, c: 299792458 },
  },
  {
    id: "friedmann",
    category: "Cosmology",
    name: "First Friedmann equation",
    latex:
      "H^2 = \\frac{8\\pi G}{3}\\rho - \\frac{kc^2}{a^2} + \\frac{\\Lambda c^2}{3}",
    description: "Hubble rate from energy density + curvature + Λ.",
    expression: null,
  },
  {
    id: "hubble",
    category: "Cosmology",
    name: "Hubble's law",
    latex: "v = H_0 d",
    description: "Recession velocity vs. comoving distance.",
    expression: "H0 * d",
    defaults: { H0: 67.4, d: 1.0 },
  },

  // ───────── Electromagnetism ─────────
  {
    id: "maxwell-gauss-e",
    category: "EM",
    name: "Gauss law (E)",
    latex: "\\nabla \\cdot \\mathbf{E} = \\rho/\\varepsilon_0",
    description: "Electric flux from charge density.",
    expression: null,
  },
  {
    id: "maxwell-gauss-b",
    category: "EM",
    name: "Gauss law (B)",
    latex: "\\nabla \\cdot \\mathbf{B} = 0",
    description: "No magnetic monopoles.",
    expression: null,
  },
  {
    id: "maxwell-faraday",
    category: "EM",
    name: "Faraday's law",
    latex: "\\nabla \\times \\mathbf{E} = -\\partial_t \\mathbf{B}",
    description: "Changing B induces curl of E.",
    expression: null,
  },
  {
    id: "maxwell-ampere",
    category: "EM",
    name: "Ampère–Maxwell law",
    latex:
      "\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\partial_t \\mathbf{E}",
    description: "Current and displacement-current sources for B.",
    expression: null,
  },
  {
    id: "lorentz",
    category: "EM",
    name: "Lorentz force",
    latex: "\\mathbf{F} = q(\\mathbf{E} + \\mathbf{v} \\times \\mathbf{B})",
    description: "Force on a charge in EM field.",
    expression: null,
  },

  // ───────── Classical / Thermo ─────────
  {
    id: "newton2",
    category: "Classical",
    name: "Newton's second law",
    latex: "F = m a",
    description: "Force is rate of change of momentum.",
    expression: "m * a",
    defaults: { m: 1, a: 9.81 },
  },
  {
    id: "lagrangian",
    category: "Classical",
    name: "Euler–Lagrange equation",
    latex:
      "\\frac{d}{dt}\\frac{\\partial L}{\\partial \\dot q} - \\frac{\\partial L}{\\partial q} = 0",
    description: "Stationarity of the action.",
    expression: null,
  },
  {
    id: "hamiltonian",
    category: "Classical",
    name: "Hamilton's equations",
    latex:
      "\\dot q = \\partial H / \\partial p,\\; \\dot p = -\\partial H / \\partial q",
    description: "Symplectic form of mechanics.",
    expression: null,
  },
  {
    id: "navier-stokes",
    category: "Classical",
    name: "Navier–Stokes (incompressible)",
    latex:
      "\\rho(\\partial_t \\mathbf{u} + \\mathbf{u}\\cdot\\nabla \\mathbf{u}) = -\\nabla p + \\mu \\nabla^2 \\mathbf{u} + \\mathbf{f}",
    description: "Momentum balance for a Newtonian fluid.",
    expression: null,
  },
  {
    id: "boltzmann-entropy",
    category: "StatMech",
    name: "Boltzmann entropy",
    latex: "S = k_B \\ln W",
    description: "Entropy from microstate count.",
    expression: "kB * log(W)",
    defaults: { kB: 1.380649e-23, W: 1e10 },
  },
  {
    id: "planck-radiation",
    category: "Thermo",
    name: "Planck radiation law",
    latex:
      "B_\\nu(T) = \\frac{2h\\nu^3}{c^2}\\frac{1}{e^{h\\nu/k_B T}-1}",
    description: "Blackbody spectral radiance.",
    expression:
      "(2*h*nu^3 / c^2) * 1/(exp(h*nu/(kB*T)) - 1)",
    defaults: {
      h: 6.62607015e-34,
      nu: 5e14,
      c: 299792458,
      kB: 1.380649e-23,
      T: 5778,
    },
  },

  // ───────── Symbolic / Pure Math ─────────
  {
    id: "euler-id",
    category: "Symbolic",
    name: "Euler's identity",
    latex: "e^{i\\pi} + 1 = 0",
    description: "Most beautiful equation in mathematics.",
    expression: "exp(i*pi) + 1",
  },
  {
    id: "gauss-integral",
    category: "Symbolic",
    name: "Gaussian integral",
    latex: "\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}",
    description: "Cornerstone of probability and QFT.",
    expression: "sqrt(pi)",
  },
  {
    id: "basel",
    category: "Symbolic",
    name: "Basel problem",
    latex: "\\sum_{n=1}^{\\infty} 1/n^2 = \\pi^2/6",
    description: "Riemann ζ(2).",
    expression: "pi^2 / 6",
  },
  {
    id: "stirling",
    category: "Symbolic",
    name: "Stirling's approximation",
    latex: "\\ln n! \\approx n\\ln n - n",
    description: "Asymptotic of the factorial.",
    expression: "n*log(n) - n",
    defaults: { n: 100 },
  },
  {
    id: "fourier",
    category: "Symbolic",
    name: "Fourier transform",
    latex:
      "\\hat f(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi}\\,dx",
    description: "Decomposition into frequencies.",
    expression: null,
  },
];

export const FORMULA_CATEGORIES = Array.from(
  new Set(FORMULA_CATALOG.map((f) => f.category)),
);
