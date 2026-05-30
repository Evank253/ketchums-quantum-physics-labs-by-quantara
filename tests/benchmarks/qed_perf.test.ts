import { describe, it, expect } from "vitest";
import { QEDEngine } from "../../src/engine/qed_calculator";

describe("QED performance budget", () => {
  it("6-loop a_e under 5ms with residual < 1e-11", () => {
    const t0 = performance.now();
    const e = new QEDEngine();
    e.calculateAe();
    const dt = performance.now() - t0;
    expect(dt).toBeLessThan(5);
    expect(e.getResidual()).toBeLessThan(1e-11);
  });
});
