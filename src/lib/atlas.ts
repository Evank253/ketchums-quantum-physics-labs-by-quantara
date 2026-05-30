/**
 * quantara-4d/src/lib/atlas.ts
 * The 4D Research Atlas node catalog.
 * Creator: Evan Ketchum — 2026-05-27
 *
 * Each AtlasNode is a research concept or milestone.
 * Nodes are locked until their required 3D UnlockEvents (digital footprints) exist.
 *
 * Data flows: 3D world writes footprints → this atlas reads them.
 * This file NEVER imports from quantara-3d directly.
 */

export type Programme =
  | "perturbative"
  | "closed_form"
  | "lattice"
  | "SMEFT"
  | "prediction"
  | "data";

export type Domain = "QED" | "QCD" | "GR" | "CondMat" | "Info";

export interface AtlasNode {
  id: string;
  label: string;
  description: string;
  programme: Programme;
  domain: Domain;
  difficulty: number;       // 1–10, maps to Y axis
  epoch: number;            // Minimum epoch / unlock order
  unlockedBy3D: string[];   // IDs of 3D UnlockEvents required
  realityTag: "established" | "frontier" | "speculative";
  references: string[];
}

// ─── The Atlas Node Catalog ───────────────────────────────────────────────────
// Start with foundational nodes. Add more as 3D breakthroughs grow.

export const ATLAS_NODES: AtlasNode[] = [

  // ── Perturbative QED Layer (accessible first) ─────────────────────────────

  {
    id: "atlas-qed-1loop",
    label: "1-Loop QED (Schwinger)",
    description: "The Schwinger result: aₑ = α/(2π). First perturbative correction to the electron magnetic moment.",
    programme: "perturbative",
    domain: "QED",
    difficulty: 1,
    epoch: 1,
    unlockedBy3D: [],  // Always visible — established physics
    realityTag: "established",
    references: [
      "J. Schwinger (1948). On Quantum-Electrodynamics and the Magnetic Moment of the Electron. Phys. Rev. 73, 416."
    ],
  },

  {
    id: "atlas-qed-6loop",
    label: "6-Loop Perturbative QED Engine",
    description: "Quantara's perturbative engine: 198,432 diagrams, CODATA-verified to 10⁻¹¹ relative precision.",
    programme: "perturbative",
    domain: "QED",
    difficulty: 4,
    epoch: 1,
    unlockedBy3D: ["BREAKTHROUGH-02-QED-CONVERGENCE"],
    realityTag: "established",
    references: [
      "T. Aoyama et al. (2020). Physics Reports 887, 1–166.",
      "E. Ketchum (2026). Quantara QED Engine Preprint."
    ],
  },

  {
    id: "atlas-run-card-standard",
    label: "Run Card Provenance Standard",
    description: "A standardized format for logging QED computation runs with full physics, numerics, cost, and provenance.",
    programme: "perturbative",
    domain: "Info",
    difficulty: 2,
    epoch: 1,
    unlockedBy3D: ["BREAKTHROUGH-02-QED-CONVERGENCE"],
    realityTag: "established",
    references: [
      "E. Ketchum (2026). Quantara Run Card Format Specification."
    ],
  },

  {
    id: "atlas-self-healing-swarm",
    label: "Self-Healing Bot Swarm (AHM/PCL)",
    description: "Autonomous Healing Multiplier + Phase Correction Layer. Distributed agents maintain coherence through node loss.",
    programme: "data",
    domain: "Info",
    difficulty: 5,
    epoch: 1,
    unlockedBy3D: ["BREAKTHROUGH-01-SELF-HEALING-SWARM"],
    realityTag: "established",
    references: [
      "E. Ketchum (2026). Quantara AHM/PCL Protocol."
    ],
  },

  {
    id: "atlas-mobile-engineering",
    label: "Mobile-First Quantum Engineering Paradigm",
    description: "First documentation of a complete quantum simulation ecosystem built entirely on mobile hardware.",
    programme: "data",
    domain: "Info",
    difficulty: 3,
    epoch: 1,
    unlockedBy3D: ["BREAKTHROUGH-03-MOBILE-ENGINEERING"],
    realityTag: "established",
    references: [
      "E. Ketchum (2026). Mobile-First Development of a QED Simulation Ecosystem."
    ],
  },

  // ── Closed-Form QED Frontier (requires perturbative 4D seeds) ────────────

  {
    id: "atlas-dse-truncation",
    label: "DSE Truncation Space",
    description: "Dyson-Schwinger equation truncations with controlled error bounds. Key path to closed-form QED.",
    programme: "closed_form",
    domain: "QED",
    difficulty: 8,
    epoch: 5,
    unlockedBy3D: ["BREAKTHROUGH-02-QED-CONVERGENCE"],
    realityTag: "frontier",
    references: [
      "C.D. Roberts, A.G. Williams (1994). Prog. Part. Nucl. Phys. 33, 477."
    ],
  },

  {
    id: "atlas-borel-resumm",
    label: "Borel-Padé Resummation",
    description: "Trans-series improvements to the perturbative expansion. Not yet a full closed-form solution.",
    programme: "closed_form",
    domain: "QED",
    difficulty: 7,
    epoch: 3,
    unlockedBy3D: ["BREAKTHROUGH-02-QED-CONVERGENCE"],
    realityTag: "frontier",
    references: [
      "G.V. Dunne (2002). Ann. Phys."
    ],
  },

  // ── Lattice QED Frontier ─────────────────────────────────────────────────

  {
    id: "atlas-lattice-qed-continuum",
    label: "Lattice QED Continuum Limit",
    description: "Nonperturbative formulation of QED via lattice regularization. Whether 4D QED has a continuum limit remains open.",
    programme: "lattice",
    domain: "QED",
    difficulty: 9,
    epoch: 10,
    unlockedBy3D: ["BREAKTHROUGH-02-QED-CONVERGENCE"],
    realityTag: "frontier",
    references: [
      "BMW Collaboration (2020). Nature 593, 51–55."
    ],
  },

  // ── SMEFT Frontier ────────────────────────────────────────────────────────

  {
    id: "atlas-smeft-qed",
    label: "SMEFT Extension of QED Engine",
    description: "Extending the run card format to include Wilson coefficient inputs and SMEFT shifts to precision observables.",
    programme: "SMEFT",
    domain: "QED",
    difficulty: 8,
    epoch: 8,
    unlockedBy3D: ["BREAKTHROUGH-02-QED-CONVERGENCE"],
    realityTag: "frontier",
    references: [
      "I. Brivio, M. Trott (2019). Phys. Rept. 793, 1–98."
    ],
  },

  // ── New Prediction Frontier ───────────────────────────────────────────────

  {
    id: "atlas-new-prediction",
    label: "Pre-Registered New Physics Prediction",
    description: "A falsifiable, pre-registered prediction for a precision observable. Requires ≥5σ confirmation by independent groups.",
    programme: "prediction",
    domain: "QED",
    difficulty: 10,
    epoch: 20,
    unlockedBy3D: [
      "BREAKTHROUGH-02-QED-CONVERGENCE",
      "BREAKTHROUGH-04-MULTIVERSAL-BLUEPRINT",
    ],
    realityTag: "speculative",
    references: [
      "Muon g-2 Collaboration (2021). Phys. Rev. Lett. 126, 141801.",
      "L. Morel et al. (2020). Nature 588, 61–65."
    ],
  },
];

// ─── Helper: filter nodes visible given current footprints ───────────────────

export function getUnlockedNodes(
  footprintIds: string[],
  currentEpoch: number
): AtlasNode[] {
  return ATLAS_NODES.filter(
    (node) =>
      node.epoch <= currentEpoch &&
      node.unlockedBy3D.every((req) => footprintIds.includes(req))
  );
}

export function getLockedNodes(
  footprintIds: string[],
  currentEpoch: number
): AtlasNode[] {
  return ATLAS_NODES.filter(
    (node) =>
      node.epoch > currentEpoch ||
      !node.unlockedBy3D.every((req) => footprintIds.includes(req))
  );
}
