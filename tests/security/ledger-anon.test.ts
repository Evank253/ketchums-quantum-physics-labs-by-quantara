/**
 * @vitest-environment node
 *
 * Regression: anonymous callers of protected ledger server fns must receive
 * a structured AUTH_REQUIRED response, NOT an uncaught throw that surfaces
 * as a 500 + blank screen via the global error boundary.
 */
import { describe, it, expect, beforeAll } from "vitest";

// Minimum env so the inline auth client can be constructed if reached.
beforeAll(() => {
  process.env.SUPABASE_URL ||= "https://example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY ||= "anon-key-placeholder";
});

describe("ledger writes — anonymous calls", () => {
  it("recordSolveServer returns structured 401 without auth", async () => {
    const { recordSolveServer } = await import("../../src/lib/ledger-writes.functions");
    const { isAuthRequired } = await import("../../src/lib/auth-session");
    const res = await recordSolveServer({ data: { theory: "anon test" } } as any);
    expect(isAuthRequired(res)).toBe(true);
    expect((res as any).status).toBe(401);
    expect((res as any).code).toBe("AUTH_REQUIRED");
  });

  it("enqueueDispatchServer returns structured 401 without auth", async () => {
    const { enqueueDispatchServer } = await import("../../src/lib/ledger-writes.functions");
    const { isAuthRequired } = await import("../../src/lib/auth-session");
    const res = await enqueueDispatchServer({ data: { theory: "anon dispatch" } } as any);
    expect(isAuthRequired(res)).toBe(true);
  });

  it("recordAchievementServer returns structured 401 without auth", async () => {
    const { recordAchievementServer } = await import("../../src/lib/ledger-writes.functions");
    const { isAuthRequired } = await import("../../src/lib/auth-session");
    const res = await recordAchievementServer({
      data: { achievement_id: "first_credit" },
    } as any);
    expect(isAuthRequired(res)).toBe(true);
  });
});
