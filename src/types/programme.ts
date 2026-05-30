// Quantara core type definitions — shared across 3D world and 4D Atlas.

export type Programme =
  | "perturbative"
  | "closed_form"
  | "lattice"
  | "SMEFT"
  | "prediction";

export type DimensionTag = "3D" | "4D_seed";

export interface UnlockEvent {
  id: string;
  unlockedAt: number;
  discoveredBy: string;
  programme: Programme;
  dim: DimensionTag;
}

export interface AtlasNode {
  id: string;
  label: string;
  programme: Programme;
  domain: "QED" | "QCD" | "GR" | "CondMat" | "Info";
  difficulty: number;
  unlockedBy3D: string[];
}
