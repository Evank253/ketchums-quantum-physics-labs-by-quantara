import { describe, it, expect } from "vitest";
import { QEDEngine } from "../../src/engine/qed_calculator";

describe("QED Engine", () => {
  it("achieves <1e-11 residual vs CODATA a_e", () => {
    const engine = new QEDEngine();
    const ae = engine.calculateAe();
    expect(ae).toBeGreaterThan(0);
    expect(engine.getResidual()).toBeLessThan(1e-11);
  });

  it("reports convergence", () => {
    expect(new QEDEngine().converged()).toBe(true);
  });
});
