## Scope this turn

Finish the remaining tracks from the earlier roadmap. No pricing/auth/billing changes — those landed last turn.

### 1. `/compare` — CODATA vs Computed (public, SSR)
- New public route `src/routes/compare.tsx`.
- Public server fn `getCompareTable` (no auth middleware, publishable-key client) reading the latest `PASS`-verdict `run_cards` joined to `compute_jobs`, grouped by symbol (`a_e`, `α⁻¹`, …).
- Renders a table: Symbol · Theory · CODATA value ± σ · Quantara computed ± σ · Residual · σ-deviation · Verdict badge · Run-card link.
- Adds narrow `TO anon SELECT` policy on `run_cards` + `compute_jobs` projecting only the safe columns the table needs (no `user_id`, no `inputs`).
- `head()` sets unique OG title/description + JSON-LD `Dataset` schema for institutional shareability.

### 2. `/run-card/$runId` — Public provenance page
- New route `src/routes/run-card.$runId.tsx`.
- Public server fn `getPublicRunCard({ runId })` returns the run card + linked job's engine/CODATA/literature results, sigma, verdict, backend_version, input_hash, output_hash, timestamp, mint tx hash (if any from `dat_mint_audit`).
- Page renders human-readable provenance card + collapsible raw JSON + "Copy citation" button + JSON-LD `Dataset`.
- `og:image` + `twitter:image` derived from a static branded card (no per-run image gen this turn).
- Linked from every `/compare` row and from `/billing`'s recent runs.

### 3. AI data cleaner cron + cold-compute fuel
- New `src/lib/data-cleaner.server.ts` with one entry point `runCleanerBatch()` doing:
  - Dedupe `chat_messages` (same user + same content within 60s).
  - Normalize `feedback` (trim, collapse whitespace, lowercase email).
  - Prune `compute_jobs` stuck in `running` > 30 min → mark `failed`.
  - Warm `compute_warmup_cache` (new tiny table: `cache_key text pk, payload jsonb, hit_count int, updated_at`) with hot QED inputs from the last 24h.
  - Log batch summary to `admin_logs` (`kind='data_cleaner'`).
  - Mint 5 $DAT to treasury per successful batch via existing `mintOnChain`, audited in `dat_mint_audit` with `action='cleaner-batch:<iso>'` (idempotent by action).
- New public cron endpoint `src/routes/api/public/hooks/data-cleaner.ts` — verifies `apikey` header, calls `runCleanerBatch`, returns counts.
- pg_cron job every 15 min (separate insert step, not in migration) hits that endpoint.
- `submitComputeJob` reads `compute_warmup_cache` first → returns cached engine result when input hash hits, increments `hit_count`. HUD on `/cold-compute` (existing `cold-compute-hud.tsx`) gets hits/misses surfaced via a new `getColdComputeStats` fn.

### 4. Verify DAT mint on chain
- New server fn `verifyDatChain` in `src/lib/dat-mint.functions.ts`:
  - `loadMintConfig()` → returns `{ ok, missing }`.
  - If ok: viem `publicClient` reads contract `name`, `symbol`, `totalSupply`, treasury `balanceOf(TREASURY_WALLET)`, current `blockNumber`, and last 5 `Transfer` events to treasury.
  - Returns a normalized status object.
- Surface on `/admin/security` (existing route — add a "DAT Chain Health" card) and on `/billing` (existing — add a small wallet-status panel showing balance + last mint tx).

### 5. Security rescan + Wiz import + admin report
- Trigger `security--run_security_scan`, then `security--get_scan_results`. For each high/critical finding the recent migrations actually resolved (RLS on new tables, function search_paths, anon revokes), call `security--manage_security_finding` `mark_as_fixed` with an evidence note. Ignore findings that are intentional public reads (e.g. `/compare`).
- Wiz: workspace connector. Add `src/lib/wiz-sync.server.ts` + cron-callable public route `/api/public/hooks/wiz-sync` that, when `WIZ_API_KEY` is present, queries Wiz issues for this project and upserts them into `security_findings` (existing table) tagged `source='wiz'`. If the secret is missing, the endpoint no-ops with a clear message and we surface a one-line "Connect Wiz API key to enable sync" note on the admin page.
- New `src/routes/admin.security.report.tsx` (admin-only via `has_role`) showing: latest scan summary, RLS coverage, Wiz issue counts by severity, DAT chain health from §4, data-cleaner batch history, last 20 `admin_logs` of kind `security_*`. "Email me this report" button enqueues to `transactional_emails` using the existing template registry.

### 6. Fix flagged security issues from prior migrations
After rescan, address whatever the linter reports. Expected hits from recent work:
- `siwe_nonces` deny-all already in place — confirm.
- New functions (`grant_plan_credits`, `consume_credit`, `check_user_quota`) — `SET search_path = public` already set; verify.
- Any table missing RLS — enable + scope.
- Any function flagged "search_path mutable" — re-issue with explicit `SET`.

## Technical details

- **Files created** (8): `src/routes/compare.tsx`, `src/routes/run-card.$runId.tsx`, `src/routes/admin.security.report.tsx`, `src/routes/api/public/hooks/data-cleaner.ts`, `src/routes/api/public/hooks/wiz-sync.ts`, `src/lib/data-cleaner.server.ts`, `src/lib/wiz-sync.server.ts`, `src/lib/compare.functions.ts`.
- **Files modified** (4): `src/lib/dat-mint.functions.ts` (+`verifyDatChain`), `src/lib/compute/jobs.functions.ts` (warmup cache read), `src/routes/admin.security.tsx` (+DAT/Wiz cards), `src/routes/billing.tsx` (+wallet status panel).
- **Migrations** (2):
  1. `compute_warmup_cache` table + narrow `TO anon SELECT` on `run_cards`/`compute_jobs` safe columns via a `public_run_cards` view (or RLS policy with column-level grants).
  2. Lock fixes from the linter (search_path, RLS gaps).
- **Cron** (separate insert, post-deploy): two `pg_cron` jobs — data-cleaner every 15 min, wiz-sync hourly. Both use the stable preview/prod URL + `apikey: <SUPABASE_PUBLISHABLE_KEY>` per the canonical pattern.
- **Secrets needed**: `WIZ_API_KEY` (optional — sync no-ops without it). Will request via `add_secret` only after user confirms they want Wiz live.
- **No changes** to QED engine, Atlas, Cybersecurity dashboards, pricing, auth, or billing flows.

## Out of scope
- Per-run-card OG image generation (uses a static branded image this turn).
- Migrating older `compute_jobs` rows into the warmup cache (cache fills naturally from live traffic + cleaner sweeps of last 24h).
- A second Wiz connector mode beyond the documented workspace-scoped scan.

Approve and I execute end-to-end, ending with the rescan + admin report.
