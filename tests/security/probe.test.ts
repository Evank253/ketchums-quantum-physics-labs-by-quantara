import { describe, it, expect } from "vitest";
describe("p", () => { it("r", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "anon";
  const { runWithStartContext } = await import("@tanstack/start-storage-context");
  const { recordSolveServer } = await import("../../src/lib/ledger-writes.functions");
  const r: any = await runWithStartContext({
    getRouter: async () => ({} as any), request: new Request("http://x/"),
    startOptions: {}, contextAfterGlobalMiddlewares: {},
    executedRequestMiddlewares: new Set(), handlerType: "serverFn",
  }, () => (recordSolveServer as any).__executeServer({ data: { theory: "x" }}));
  console.log("PROBE", JSON.stringify(r), "keys", r && Object.keys(r));
  expect(true).toBe(true);
});});
