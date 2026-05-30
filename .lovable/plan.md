## Audit vs your checklist

### ✅ Already present
- **Frontend UI**: full React app, `/world` 3D viewer, `/atlas` 4D atlas, `/benchmarks`, `/ledger`, `/synthesis`, responsive Tailwind, nav.
- **Source & deps**: `package.json` (TanStack Start + R3F + drei + zustand + recharts + zod).
- **QED engine**: `src/engine/qed_calculator.ts` + unit test in `tests/unit/`.
- **Benchmark runner**: `benchmarks/qed_benchmarks.ts` + `/benchmarks` UI.
- **Learning Ledger** (autosave of tokens/unlocks/benchmarks/bot advances): `src/lib/learning-ledger.ts` + `/ledger`.
- **Docker**: `Dockerfile` (Node 20).
- **CI**: `.github/workflows/deploy.yml` (build + test).
- **Docs (partial)**: `docs/api/qed-engine.md`, `docs/architecture/README.md`, `docs/guides/run-benchmarks.md`, full `docs/legal/*`.

### ❌ Missing / thin → what I'll add

**1. Backend / API endpoints** (`src/api/` is empty)
- `src/routes/api/qed.ts` — `GET /api/qed` returns live `a_e`, residual, convergence.
- `src/routes/api/benchmark.ts` — `POST /api/benchmark` runs the suite, returns result JSON, logs to ledger.
- `src/routes/api/ledger.ts` — `GET /api/ledger` exports the ledger as JSON (server-side passthrough contract).
- `src/routes/api/health.ts` — `GET /api/health` liveness probe.
- `src/routes/api/public/webhook.ts` — signed webhook intake for external advance reports (HMAC-verified).

**2. Validation & testing**
- `tests/integration/api.test.ts` — hits the API routes, asserts shape + status.
- `tests/integration/ledger.test.ts` — autosave path: credit DAT → ledger entry exists.
- `tests/benchmarks/qed_perf.test.ts` — perf budget: 6-loop QED < 5 ms, residual < 1e-11.
- `vitest.config.ts` — wire unit/integration/benchmark suites; add `"test": "vitest run"` to `package.json`.

**3. Documentation**
- `docs/INSTALL.md` — clone, `bun install`, `bun dev`.
- `docs/DEVELOPER.md` — repo map (Core / 3D / 4D / Benchmarks / Ledger), data flow, Separation Law.
- `docs/DEPLOY.md` — Docker build/run, Cloudflare Workers (Wrangler), env vars, custom domain.
- `docs/api/README.md` — full HTTP API reference (request/response for each route above).
- `docs/REPRODUCIBILITY.md` — pinned coefficients, CODATA refs, exact commands to reproduce benchmark numbers.

**4. Deployment / environment**
- `.env.example` — `LOVABLE_API_KEY`, `WEBHOOK_SECRET`, `SESSION_SECRET`.
- Tighten `.github/workflows/deploy.yml` — add lint + typecheck + vitest, cache bun.
- `Dockerfile` — multi-stage (builder → slim runtime), healthcheck on `/api/health`.
- `docs/SCALING.md` — Workers concurrency notes, ledger size cap, future Cloud (Supabase) migration path for persistent storage.

### Out of scope (flag, don't build)
- Real database — current ledger is `localStorage`. Migrating to Lovable Cloud (Postgres) is a separate decision; I'll note the path in `SCALING.md` but won't enable Cloud unless you say so.
- GPU/lattice QCD compute — stays simulated until you wire a real worker.

### Technical notes
- All new API routes are TanStack `createFileRoute` server handlers under `src/routes/api/`; webhook lives at `/api/public/webhook` so it bypasses auth and verifies HMAC with `WEBHOOK_SECRET`.
- Benchmark + QED endpoints reuse the existing `QEDEngine` and `runBenchmarks()` — no logic duplication.
- Integration tests use Vitest + `fetch` against `invoke-server-function` style in-process handlers (no live server needed).

Approve and I'll build it.