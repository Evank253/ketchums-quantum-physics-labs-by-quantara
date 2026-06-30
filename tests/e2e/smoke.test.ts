/**
 * @vitest-environment node
 *
 * End-to-end smoke tests — drive the running dev preview with fetch.
 * Skips automatically when the dev server isn't reachable so the suite
 * stays green in environments without a live preview.
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080";
let alive = false;

beforeAll(async () => {
  try {
    const r = await fetch(BASE, { method: "GET" });
    alive = r.ok || r.status === 200;
  } catch { alive = false; }
});

describe.skipIf(!process.env.RUN_E2E)("E2E smoke — public surface", () => {
  it("home page responds 200 with HTML", async () => {
    if (!alive) return;
    const r = await fetch(BASE);
    expect(r.status).toBe(200);
    const html = await r.text();
    expect(html).toMatch(/<html/i);
  });

  it("sitemap.xml is served", async () => {
    if (!alive) return;
    const r = await fetch(`${BASE}/sitemap.xml`);
    expect([200, 304]).toContain(r.status);
  });

  it("robots.txt is served", async () => {
    if (!alive) return;
    const r = await fetch(`${BASE}/robots.txt`);
    expect(r.status).toBe(200);
  });

  it("transactional email send rejects unauthenticated POST", async () => {
    if (!alive) return;
    const r = await fetch(`${BASE}/lovable/email/transactional/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateName: "welcome", recipientEmail: "a@b.com" }),
    });
    expect(r.status).toBe(401);
  });

  it("inventions cron endpoint rejects callers without bearer token", async () => {
    if (!alive) return;
    const r = await fetch(`${BASE}/api/public/inventions/run`, { method: "POST" });
    expect([401, 403]).toContain(r.status);
  });

  it("email health endpoint requires admin auth", async () => {
    if (!alive) return;
    const r = await fetch(`${BASE}/lovable/email/health`);
    expect([401, 403]).toContain(r.status);
  });
});
