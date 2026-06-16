// Regression tests for Nexus Auto-Healer decision logic. These run in CI
// without DB access and lock the autonomy contract:
//   - critical + quarantine_key  → quarantine that surface
//   - critical without key       → alert only (manual intervention required)
//   - high                       → alert
//   - low/medium                 → noop (logged, not acted on)
//   - passing                    → always noop
import { describe, it, expect } from "vitest";
import { classifyAction, summarize, type SelfTestCheck } from "../../src/lib/nexus-healer.server";

const mk = (over: Partial<SelfTestCheck>): SelfTestCheck => ({
  id: "x", title: "x", severity: "low", passed: false, ...over,
});

describe("Nexus Auto-Healer classifyAction", () => {
  it("passes through when check passes", () => {
    expect(classifyAction(mk({ passed: true, severity: "critical" })).kind).toBe("noop");
  });
  it("quarantines critical with a key", () => {
    const a = classifyAction(mk({ severity: "critical", quarantine_key: "chat_messages" }));
    expect(a.kind).toBe("quarantine");
    expect(a.target).toBe("chat_messages");
  });
  it("alerts on critical without a quarantine key", () => {
    const a = classifyAction(mk({ severity: "critical" }));
    expect(a.kind).toBe("alert");
    expect(a.severity).toBe("critical");
  });
  it("alerts on high", () => {
    expect(classifyAction(mk({ severity: "high" })).kind).toBe("alert");
  });
  it("does not act on medium / low", () => {
    expect(classifyAction(mk({ severity: "medium" })).kind).toBe("noop");
    expect(classifyAction(mk({ severity: "low" })).kind).toBe("noop");
  });
});

describe("summarize", () => {
  it("counts failing buckets", () => {
    const s = summarize({
      ran_at: "now", passed: false,
      checks: [
        mk({ passed: true, severity: "critical" }),
        mk({ passed: false, severity: "critical" }),
        mk({ passed: false, severity: "high" }),
        mk({ passed: false, severity: "low" }),
      ],
    });
    expect(s).toEqual({ total: 4, failing: 3, critical: 1, high: 1 });
  });
});
