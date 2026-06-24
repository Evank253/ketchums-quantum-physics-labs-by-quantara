/**
 * @vitest-environment node
 *
 * Regression: anonymous callers of protected ledger writes must receive a
 * structured AUTH_REQUIRED response, NOT an uncaught throw that surfaces as
 * a 500 + blank screen via the global error boundary.
 *
 * We exercise the shared `validateBearerFromRequest` helper (used by every
 * ledger server fn before any DB write) plus the client-side `isAuthRequired`
 * predicate that gates UI fallback paths.
 */
import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.SUPABASE_URL ||= "https://example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY ||= "anon-key-placeholder";
});

describe("ledger writes — anonymous bearer validation", () => {
  it("returns null and logs metadata when no Authorization header is present", async () => {
    const { validateBearerFromRequest } = await import("../../src/lib/ledger-auth.server");
    const warnings: unknown[][] = [];
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => warnings.push(args);
    try {
      const req = new Request("http://localhost/_serverFn/recordSolveServer", { method: "POST" });
      const userId = await validateBearerFromRequest("recordSolveServer", req);
      expect(userId).toBeNull();
    } finally {
      console.warn = origWarn;
    }
    const joined = warnings.map((a) => a.join(" ")).join("\n");
    expect(joined).toContain("[ledger-auth] missing bearer");
    expect(joined).toContain("recordSolveServer");
    expect(joined).toContain('"has_auth_header":false');
  });

  it("returns null when Authorization header is malformed (not Bearer)", async () => {
    const { validateBearerFromRequest } = await import("../../src/lib/ledger-auth.server");
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { authorization: "Basic abc" },
    });
    const orig = console.warn;
    console.warn = () => {};
    try {
      expect(await validateBearerFromRequest("enqueueDispatchServer", req)).toBeNull();
    } finally {
      console.warn = orig;
    }
  });

  it("returns null for an invalid bearer token (does not throw)", async () => {
    const { validateBearerFromRequest } = await import("../../src/lib/ledger-auth.server");
    const req = new Request("http://localhost/x", {
      method: "POST",
      headers: { authorization: "Bearer not-a-real-jwt" },
    });
    const orig = console.warn;
    console.warn = () => {};
    try {
      const res = await validateBearerFromRequest("recordAchievementServer", req);
      expect(res).toBeNull();
    } finally {
      console.warn = orig;
    }
  });

  it("AUTH_REQUIRED constant has the documented public shape", async () => {
    const { AUTH_REQUIRED } = await import("../../src/lib/ledger-auth.server");
    expect(AUTH_REQUIRED).toMatchObject({
      ok: false,
      code: "AUTH_REQUIRED",
      status: 401,
    });
    expect(typeof AUTH_REQUIRED.message).toBe("string");
  });

  it("isAuthRequired predicate matches the structured payload", async () => {
    const { isAuthRequired } = await import("../../src/lib/auth-session");
    const { AUTH_REQUIRED } = await import("../../src/lib/ledger-auth.server");
    expect(isAuthRequired(AUTH_REQUIRED)).toBe(true);
    expect(isAuthRequired({ ok: true, row: {} })).toBe(false);
    expect(isAuthRequired(null)).toBe(false);
    expect(isAuthRequired(undefined)).toBe(false);
  });
});
