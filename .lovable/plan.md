
## Scope (locked by your answers)

Trial+pay = **Stripe** ($29 / $99 / $499). Free shape = **5 runs / 7-day trial**. Mint target = **your treasury 0x15B3…86DD**. IP protection = **hide anything risky to your work**.

## What I'll ship this turn

### 1. Trial + quota enforcement (server-side, can't be bypassed)
- Migration: `subscriptions` table (user_id, plan, status, trial_ends_at, current_period_end, stripe_customer_id, stripe_subscription_id).
- DB trigger: on new auth user → insert row `plan='trial', trial_ends_at=now()+7 days`.
- `submitComputeJob` gains a gate: if `plan='trial'` AND (trial expired OR monthly runs ≥ 5) → throw "Trial expired — subscribe to continue". Paid plans get tiered quotas: starter=100, pro=2000, institution=unlimited.
- **Fix pending status**: insert as `pending`, flip to `running` after gate passes, then `complete`/`failed`. (Today it skips `pending`.)

### 2. Stripe (seamless, Lovable-managed)
- Enable via `enable_stripe_payments` tool (no API key from you).
- Three products: Starter $29/mo, Pro $99/mo, Institution $499/mo.
- Server route `/api/public/webhooks/stripe` (signature-verified) updates `subscriptions` on `customer.subscription.*` and `invoice.paid`.
- `/pricing` page + "Subscribe" CTA on the institutional dashboard when gated.

### 3. Roles
- Add `viewer` to `app_role` enum.
- RLS on `dat_mint_audit`, `compute_jobs` (all users), `run_cards` (all users): **only admin** can SELECT, plus the row owner can see their own. Viewers can see nothing sensitive.
- `/institution` admin tab only visible to `admin` role.

### 4. API key rotation
- `rotateApiKey(keyId)` server fn: revokes old, issues new with same label, returns plaintext once. UI button next to each key.

### 5. Auto-mint on verified completion
- On `verdict='PASS'` AND `sigma < 1`, fire `dat-mint.functions.ts → mintForRun()` that mints **to your treasury** (`TREASURY_BASE_PROFILE_URL` owner) and logs in `dat_mint_audit`. Idempotent by `run_id`.

### 6. IP / source hardening
- `vite.config.ts`: disable sourcemaps in production, enable aggressive minify, drop `console.*` and `debugger`.
- Remove public docs routes from sitemap (`/benchmarks`, `/annex`, `/legal/blueprint` stay reachable by direct URL but are noindex).
- Move `QED_COEFFS`, sigma formula, and CODATA constants behind a server fn only — the client gets the *result*, never the coefficients. (Engine adapter on server; client engine file becomes a thin wrapper that calls `runEngineServer`.)
- Add `robots.txt` deny for `/institution`, `/auth`, `/api/*`.

### 7. Math annex live re-run + admin-only logs + CERN email
- New server fn `runAnnexBatch()` (admin-only) iterates every theory in `foundational-equations.ts` / annex list, executes the engine, stores result in new `annex_runs` table with sigma+verdict.
- New `admin_logs` table (admin-only RLS) — every annex run, every auto-mint, every CERN dispatch writes here.
- On PASS verdict, queue an email via **Lovable Emails** (built-in) to `cern-publications@cern.ch` + a configurable institution list, with the run-card JSON attached as link. Each dispatch logged in `admin_logs`.
- New `/admin/logs` route (gated by `admin` role) showing annex_runs + admin_logs feed.

### 8. GitHub
- Lovable auto-pushes to GitHub *only if you connected the GitHub integration* (Project → Settings → GitHub). I can't enable that for you — it requires your OAuth. **Tell me if you want me to walk you through it.** Until then, the repo lives only in Lovable.

## What I am NOT doing this turn (call them out if you want them)
- Switching from "5 runs / 7-day trial" to "1–3 projects" model (you picked the runs model).
- Splitting DAT between user/treasury (you said treasury only).
- Refactoring every component to remove the engine module — only the QED coefficients move server-side; the rest of the UI stays.

## Order of operations
1. Migrations (subscriptions, annex_runs, admin_logs, viewer role, RLS tightening, trigger).
2. Server fns (quota gate, rotation, annex batch, auto-mint, CERN dispatch).
3. Stripe enable + webhook + pricing page.
4. Email scaffold for CERN dispatch.
5. Admin logs route.
6. IP hardening (vite config, server-only coefficients, robots).
7. Verify build, then I'll ask you to sign up so the trial+admin promotion fires.

Approve and I execute end-to-end.
