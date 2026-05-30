/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { creditDat, readDat, writeDat } from "../../src/lib/dat-tokens";
import { readLedger, clearLedger, logLedger } from "../../src/lib/learning-ledger";

describe("Learning Ledger autosave", () => {
  beforeEach(() => {
    clearLedger();
    writeDat(0);
  });

  it("logs explicit ledger writes", () => {
    logLedger("benchmark", "manual", { ok: true });
    const all = readLedger();
    expect(all.length).toBe(1);
    expect(all[0].kind).toBe("benchmark");
  });

  it("crediting $DAT increases balance (autosave is async)", () => {
    creditDat(5);
    expect(readDat()).toBe(5);
  });
});
