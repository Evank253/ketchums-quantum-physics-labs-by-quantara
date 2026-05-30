import { describe, it, expect } from "vitest";
import { QEDEngine } from "../../src/engine/qed_calculator";
import { runBenchmarks } from "../../benchmarks/qed_benchmarks";

// Integration-style: exercises the handler logic directly (no HTTP boot).
// The HTTP wrappers are thin and pass-through; logic correctness is what we
// assert. Real HTTP smoke is covered by stack_modern--invoke-server-function.

describe("API surface", () => {
  it("/api/qed equivalent: returns converged a_e", () => {
    const e = new QEDEngine();
    const ae = e.calculateAe();
    expect(ae).toBeGreaterThan(0);
    expect(e.converged()).toBe(true);
  });

  it("/api/benchmark equivalent: returns full result shape", () => {
    const r = runBenchmarks();
    expect(r.loops).toBe(6);
    expect(r.precision).toBe("10^-11");
    expect(r.residual).toBeLessThan(1e-11);
    expect(typeof r.performance_vs_feyncalc).toBe("string");
    expect(r.timestamp).toBeGreaterThan(0);
  });
});
