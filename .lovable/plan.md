## Goal

Three things, in this order, no scope creep:

1. **Unblock the build** (current `build:dev` is failing on `@walletconnect/ethereum-provider`).
2. **Hide your Lovable / API keys** — never reachable from the published site or client bundle.
3. **Ship the Institutional MVP**: roles, compute-jobs pipeline (engine vs CODATA vs literature, σ deviation, PASS/FAIL), immutable run-cards, and a dedicated `/institution` dashboard — **fully separated** from the $DAT token system so failures in one can't take down the other.

No changes to existing physics UI, no changes to the existing $DAT wallet code beyond finishing the 4 secrets prompt.

---

## Part 1 — Fix the broken build (blocker)

Root cause: `@walletconnect/ethereum-provider`'s ESM bundle uses a pre-bundled chunk that Rollup can't statically analyze in Worker SSR. The package was added last turn for the WalletConnect button.

Fix: make WalletConnect a **pure browser-side dynamic import** and exclude it from SSR pre-bundling.

- `src/lib/wallet-connect.ts` — already uses `await import(...)`. Add a `typeof window === "undefined"` guard at the top of `getWalletConnectProvider()` that throws a clean "browser only" error. This prevents any SSR codepath from touching the module.
- `vite.config.ts` — add `optimizeDeps.exclude: ["@walletconnect/ethereum-provider"]` and `ssr.noExternal` adjustment so the Worker build never tries to bundle it. (Knowledge says don't set `ssr.external`; the right knob here is `optimizeDeps.exclude` + leaving the dynamic import unbundled on the client.)
- `src/components/dat-wallet.tsx` — wrap the WalletConnect button in a `typeof window !== "undefined"` mount guard and lazy-load on click only.

If that still doesn't pass Rollup on the Worker SSR pass, **remove `@walletconnect/ethereum-provider`** and replace with a "Open in MetaMask Mobile" deep link (`https://metamask.app.link/dapp/...`) — same UX outcome, zero build risk. I'll decide based on the first build result and won't loop on it.

---

## Part 2 — Hide Lovable / API keys

Reality check up front so we don't ship security theater:
- Anything prefixed `VITE_*` in `.env` is **inlined into the client bundle** — that includes `VITE_SUPABASE_PUBLISHABLE_KEY`. That key is the **publishable anon key**; it is *designed* to be public (RLS is the security boundary). It's not a secret and can't be hidden. I will not pretend otherwise.
- The keys that **must** stay server-only are: `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `QUANTARA_MASTER_KEY`, `QUANTARA_BASE_SEPOLIA_KEY`, `ANCESTRAL_KEY`, and the 4 new wallet secrets below. These already live in the secrets vault — `process.env.*` only, never `VITE_*`.

What I'll actually do:
1. **Audit grep**: scan the whole `src/` tree for any `import.meta.env.*` and `process.env.*` reference. Anything secret-shaped that's read client-side gets moved behind a server function.
2. **Strip `LOVABLE_API_KEY` usage from any `.functions.ts` module-scope** (per the server-function-authoring rules, env reads must be inside `.handler()`).
3. **Rotate `LOVABLE_API_KEY`** via `ai_gateway--rotate_lovable_api_key` so the previous value (if it ever leaked into a build artifact) is dead.
4. **Add `security--update_memory`** entry: "Service role + LOVABLE_API_KEY + QUANTARA_* + DAT_MINTER_PRIVATE_KEY are server-only; publishable anon key is intentionally public and protected by RLS."

I will **not** rename secrets in the vault to "off-website" names — Lovable Cloud requires the canonical `SUPABASE_*` / `LOVABLE_API_KEY` names to function. Renaming breaks the platform. The vault is already invisible to the published site.

---

## Part 3 — Wallet / RPC / Contract secrets (finish from last turn)

Prompt once for all four via the secrets tool:
- `VITE_WALLETCONNECT_PROJECT_ID` *(this one is public by design — the WC project id is meant to be in the client; the secret vault just persists it across builds)*
- `BASE_SEPOLIA_RPC_URL` (server-only)
- `DAT_CONTRACT_ADDRESS` (server-only)
- `DAT_MINTER_PRIVATE_KEY` (server-only)

If you skip any, the wallet/treasury panel falls back to "not configured" state — no crash.

---

## Part 4 — Institutional MVP (fully isolated from token system)

Hard isolation rule: **no import from `src/lib/dat-*` inside any institution file, and vice versa.** Two independent subsystems sharing only `auth.users`.

### 4a. Database (one migration)

```text
public.app_role           enum('free','pro','institution','admin')
public.user_roles         (user_id → auth.users, role app_role, unique pair)
public.has_role(uuid, app_role)  security definer fn  -- for RLS
public.compute_jobs       (id, user_id, model, inputs jsonb, status,
                           engine_result jsonb, codata_result jsonb,
                           literature_result jsonb, sigma numeric,
                           verdict text, created_at, completed_at)
public.run_cards          (id, job_id → compute_jobs, run_id text unique,
                           input_hash text, output_hash text,
                           backend_version text, seed bigint,
                           created_at)        -- append-only via revoked UPDATE/DELETE
public.institution_api_keys (id, user_id, key_hash, label, last_used_at,
                             revoked_at, created_at)
public.usage_counters     (user_id, period_start, runs_count)
```

Every table: explicit `GRANT`s for `authenticated` + `service_role` (no `anon`); RLS on; policies scoped via `has_role(auth.uid(), …)`; `run_cards` gets a trigger that blocks UPDATE/DELETE for everyone except service_role.

### 4b. Server functions (`src/lib/compute/*.functions.ts`)

- `submitComputeJob({model, inputs})` — `requireSupabaseAuth` + role/quota gate; inserts pending job; returns id.
- `runComputeJob(jobId)` server-only worker: calls deterministic engine → CODATA lookup → literature lookup → σ = |engine − codata| / uncertainty → PASS if σ < 1; writes `engine_result`, `codata_result`, `literature_result`, `sigma`, `verdict`; writes immutable `run_card` with sha256 hashes; updates `usage_counters`.
- `getMyJobs()`, `getJobById(id)`, `getRunCard(runId)` — RLS-scoped reads.
- `issueApiKey(label)` / `revokeApiKey(id)` — institution role only; key returned **once**, only hash stored.

### 4c. CODATA + literature data (static, shipped)

`src/lib/compute/codata.ts` — small typed JSON of CODATA 2022 values + uncertainties for the QED constants the engine already targets (`a_e`, `α⁻¹`, electron g-2). `src/lib/compute/literature.ts` — published benchmark values (Aoyama 2019 etc.) with citations. Pure data, no fetching.

### 4d. Engine adapter

`src/lib/compute/engines/qed.ts` — thin wrapper around the existing `src/engine/qed_calculator.ts` that returns the **typed result envelope** the spec calls for:
```text
{ value, uncertainty, source: 'engine', method, reference, timestamp, run_id }
```
No new physics. Just rewraps existing output.

### 4e. Public API route (for institution role only)

`src/routes/api/v1/jobs.ts` — `POST` accepts `Authorization: Bearer <api_key>`, validates against `institution_api_keys.key_hash`, runs through the same `submitComputeJob` pipeline. Rate-limited per key. **Not** under `/api/public/*` (those bypass auth on published sites). Returns OpenAPI-shaped JSON.

`src/routes/api/openapi.json.ts` — generates an OpenAPI 3.0 doc describing `POST /api/v1/jobs`, `GET /api/v1/jobs/:id`, `GET /api/v1/run-cards/:runId`.

### 4f. Dashboard UI (`/institution`, protected)

New layout: `src/routes/_authenticated/institution.tsx` with these tabs:
1. **Submit Job** — JSON editor + model dropdown.
2. **Job History** — table of past jobs with σ, verdict, link to run-card.
3. **Run Cards Explorer** — read-only view of any run-card by id (hashes, inputs, outputs, backend version, seed).
4. **Usage** — runs this period vs quota (Free=10, Pro=∞, Institution=∞ + API).
5. **API Keys** — issue/revoke (institution role only).
6. **Subscription** — placeholder card linking to a Stripe upgrade flow stub (no Stripe wiring this turn — that's its own slice).

Also need: `src/routes/_authenticated/route.tsx` (Lovable Supabase integration ships this — verify it exists; if not, the integration auto-adds it).

A small **role-promote** server fn (admin-only) so you can promote your own user to `institution` for testing. No self-service role grants.

### 4g. Wording sweep — only on new compute output

Per your prior direction we only update copy on the **new** institutional pipeline. Existing showcase UI stays untouched. The new dashboard renders results as: `"within Xσ of CODATA (uncertainty = …)"` — never "matches" / "proves".

---

## Files

### Created
- `supabase/migrations/<ts>_institutional_mvp.sql`
- `src/lib/compute/codata.ts`, `literature.ts`, `result-types.ts`, `sigma.ts`, `hash.ts`
- `src/lib/compute/engines/qed.ts`
- `src/lib/compute/jobs.functions.ts`, `jobs.server.ts`
- `src/lib/compute/api-keys.functions.ts`
- `src/lib/compute/roles.functions.ts` (has_role helpers, admin promote)
- `src/routes/_authenticated/institution.tsx`, `institution.submit.tsx`, `institution.history.tsx`, `institution.runs.tsx`, `institution.usage.tsx`, `institution.keys.tsx`, `institution.subscription.tsx`
- `src/routes/api/v1/jobs.ts`, `src/routes/api/v1/jobs.$id.ts`, `src/routes/api/v1/run-cards.$runId.ts`, `src/routes/api/openapi[.]json.ts`

### Edited
- `vite.config.ts` — `optimizeDeps.exclude` for walletconnect
- `src/lib/wallet-connect.ts` — SSR guard
- `src/components/dat-wallet.tsx` — lazy mount guard
- `src/components/site-footer.tsx` / `__root.tsx` — add `/institution` link in protected nav only

### Untouched (explicitly)
- All existing physics components (`qed-computer.tsx`, `cern-embed.tsx`, `kve-lab.tsx`, etc.)
- All `dat-*` files except finishing the secrets prompt
- `src/integrations/supabase/*` (auto-generated)

---

## Secrets prompted this turn
1. `VITE_WALLETCONNECT_PROJECT_ID`
2. `BASE_SEPOLIA_RPC_URL`
3. `DAT_CONTRACT_ADDRESS`
4. `DAT_MINTER_PRIVATE_KEY`

Plus `ai_gateway--rotate_lovable_api_key` to refresh the Lovable key.

---

## Order of execution
1. Fix `vite.config.ts` + wallet-connect SSR guard → confirm build green.
2. Rotate `LOVABLE_API_KEY` + update security memory.
3. Prompt for the 4 wallet secrets.
4. Migration: roles + compute_jobs + run_cards + api_keys + usage_counters + grants + RLS + immutability trigger.
5. CODATA/literature data + result-types + engine adapter + sigma + hash.
6. Server functions (jobs, run-cards, api-keys, roles).
7. `/institution` dashboard tabs.
8. `/api/v1/*` route + OpenAPI doc.
9. Self-promote me to `institution` (admin fn run once).
10. Smoke test: submit a QED job from the dashboard, see σ + verdict + run-card hash.

Approve and I'll execute in this exact order.