/**
 * @vitest-environment node
 *
 * Regression: anonymous callers of protected ledger server fns must NOT
 * throw through the global error boundary (which produced 500 + blank
 * screen). They must return a structured AUTH_REQUIRED payload.
 *
 * We invoke the underlying server handler directly so we can inspect the
 * return value; the start-client wrapper used in browser/SSR strips the
 * payload when invoked outside a real HTTP request.
 */
import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.SUPABASE_URL ||= "https://example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY ||= "anon-key-placeholder";
});

async function invokeHandler(fn: any, data: unknown) {
  const { runWithStartContext } = await import("@tanstack/start-storage-context");
  const request = new Request("http://localhost/_serverFn/test", { method: "POST" });
  return await runWithStartContext(
    {
      getRouter: async () => ({}) as any,
      request,
      startOptions: {},
      contextAfterGlobalMiddlewares: {},
      executedRequestMiddlewares: new Set(),
      handlerType: "serverFn",
    },
    () => fn.__executeServer({ data }),
  );
}

describe("ledger writes — anonymous calls return structured 401", () => {
  it("recordSolveServer does not throw and returns AUTH_REQUIRED", async () => {
    const { recordSolveServer } = await import("../../src/lib/ledger-writes.functions");
    const { isAuthRequired } = await import("../../src/lib/auth-session");
    let res: any;
    await expect(
      (async () => {
        res = await invokeHandler(recordSolveServer, { theory: "anon test" });
      })(),
    ).resolves.not.toThrow();
    const payload = res?.result ?? res;
    expect(isAuthRequired(payload)).toBe(true);
    expect(payload.status).toBe(401);
    expect(payload.code).toBe("AUTH_REQUIRED");
  });

  it("enqueueDispatchServer does not throw and returns AUTH_REQUIRED", async () => {
    const { enqueueDispatchServer } = await import("../../src/lib/ledger-writes.functions");
    const { isAuthRequired } = await import("../../src/lib/auth-session");
    const res: any = await invokeHandler(enqueueDispatchServer, { theory: "anon dispatch" });
    expect(isAuthRequired(res?.result ?? res)).toBe(true);
  });

  it("recordAchievementServer does not throw and returns AUTH_REQUIRED", async () => {
    const { recordAchievementServer } = await import("../../src/lib/ledger-writes.functions");
    const { isAuthRequired } = await import("../../src/lib/auth-session");
    const res: any = await invokeHandler(recordAchievementServer, {
      achievement_id: "first_credit",
    });
    expect(isAuthRequired(res?.result ?? res)).toBe(true);
  });
});
