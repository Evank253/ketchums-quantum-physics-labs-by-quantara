export type ComputeResult = {
  symbol: string;
  value: number;
  uncertainty: number;
  source: "engine" | "codata" | "literature";
  method: string;
  reference?: string;
  timestamp: string;
};

export type JobVerdict = "PASS" | "REVIEW" | "FAIL";

export type JobRecord = {
  id: string;
  user_id: string;
  model: string;
  inputs: Record<string, unknown>;
  status: "pending" | "running" | "complete" | "failed";
  engine_result: ComputeResult | null;
  codata_result: ComputeResult | null;
  literature_result: ComputeResult | null;
  sigma: number | null;
  verdict: JobVerdict | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

export type RunCard = {
  id: string;
  job_id: string;
  run_id: string;
  user_id: string;
  input_hash: string;
  output_hash: string;
  backend_version: string;
  seed: number | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export const BACKEND_VERSION = "ketchums-qed-engine@1.0.0";
