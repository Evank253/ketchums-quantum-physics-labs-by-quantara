
# Quantara monetization + Base identity layer

Wallet you provided (`0x15B3…86DD`) is **already** the configured `TREASURY_WALLET` in `src/lib/treasury.ts` and the destination for DAT mints. Nothing to change there — minted DAT already routes to your Coinbase address. I'll verify the contract reads correctly as part of step 1.

## Scope this turn

### 1. Pricing migration (Stripe stays + new tiers added)
- Keep Stripe rail. Add new products via `payments--create_product`:
  - `researcher` — $99/mo (replaces "Pro")
  - `professional` — $499/mo (replaces "Institution")
  - `institutional` — $2,500/mo (new)
  - `enterprise` — contact-sales (no Stripe product, route to email)
  - `qed_benchmark_pack` — $299 one-time
  - `physics_dataset_pack` — $499 one-time
  - `institutional_license_year` — $5,000/yr
  - `private_deployment` — $25,000 one-time
  - `custom_research_contract` — contact-sales
- DB migration: extend `subscriptions.plan` allowed values, add `credits_remaining`, `credits_granted`, `purchased_addons jsonb` columns.
- Server-side `check_user_quota` updated: `explorer=5 lifetime`, `researcher=100/mo`, `professional=1000/mo`, `institutional=10000/mo`, `enterprise=unlimited`.
- Stripe webhook updated to allocate credits on `customer.subscription.created/updated` and `checkout.session.completed` (for one-off add-ons).
- Existing `starter`/`pro`/`institution` rows are mapped on read: starter→researcher, pro→professional, institution→institutional.

### 2. Base Account sign-in + wallet binding (additive, not replacement)
**Architectural note:** I'm pushing back on *literal* wallet-first auth that throws out Supabase. RLS, `_authenticated` gating, edge functions, and ~40 server fns all key off `auth.uid()`. Ripping Supabase out would brick the app. Instead:

- **"Sign in with Base"** is now the **primary, prominent** CTA on `/auth` (email/password demoted to "advanced").
- SIWE flow (`wallet_connect` + `signInWithEthereum` capability) → server fn `verifySiweAndLink` validates nonce/signature → either (a) finds Supabase user already bound to that wallet and issues a session via magic-link-style admin token, or (b) creates an anonymous Supabase user, stamps `profiles.wallet_address`, and signs them in.
- New tables: `profiles (user_id, wallet_address unique, display_name)`, `siwe_nonces (nonce, expires_at, used)`.
- Wallet binding for existing email users: `/billing` page has "Link Base wallet" button (SIWE → write `profiles.wallet_address`).
- DAT mint claims already accept a wallet — now they auto-fill from `profiles.wallet_address`.

### 3. Base Pay (USDC) checkout — second payment rail
- Add `@base-org/account` via npm.
- New component `<BasePayButton plan="researcher" />` calling `window.base.pay({ amount, to: TREASURY_WALLET, testnet: env==='dev' })`.
- New server fn `verifyBasePayment({ paymentId, planId })` → polls `getPaymentStatus`, on `completed` writes `subscriptions` row + credits (parallel to Stripe webhook path).
- Public route `/api/public/base-pay/webhook` for any push notifications (optional — polling is primary).
- Pricing page (`/pricing`) gets **two buttons per tier**: "Pay with Card" (Stripe) and "Pay with USDC" (Base Pay).

### 4. `/billing` page
- Current plan, credits remaining (with progress bar), period end.
- Linked wallet + "Link / change wallet" SIWE button.
- "Buy credits" / upgrade plan grid.
- Add-ons store (benchmark pack, dataset pack, etc.).
- Manage Stripe subscription → portal session.
- Recent USDC payments table from `base_payments` (new table).

### 5. Provenance run-cards + CODATA comparison
- Public route `/compare` — server-rendered table: theory · CODATA value · Quantara computed value · residual · σ · verdict. Pulls from existing `solved_theories` + `run_cards`.
- Each row links to `/run-card/$runId` — public page showing the full provenance JSON (theory, solver, alpha, residual, version, timestamp, wallet, tx hash if minted).
- Run-card writes already exist in `ledger-writes.functions.ts`; just need the public view + index.
- `og:image` and JSON-LD `Dataset` schema on each run-card for institutional shareability.

### 6. Earlier-unfinished tracks (rolled in)
- **Re-run security scan + import Wiz findings + admin report**: trigger `security--run_security_scan`, sync any persisted Wiz findings into `security_findings`, generate `/admin/security/report` route with weekly email digest via existing `transactional_emails` queue.
- **AI data-cleaning agents**: new `data_cleaner.server.ts` runs on pg_cron every 15 min — dedupes `chat_messages`, normalizes `feedback`, prunes orphaned `compute_jobs`, mints small DAT credits (5 $DAT) into treasury per successful cleanup batch. Logs to `admin_logs`.
- "Cold compute fuel" framing: cleaner output feeds a `compute_warmup_cache` (in-memory + pg) that `submitComputeJob` reads first → measurable latency drop; HUD shows hits/misses.
- **Verify DAT chain**: server fn `verifyDatChain` checks `loadMintConfig`, reads contract balance, returns block height + last 5 mints. Surface on `/admin/security` and `/billing`.

## Technical details

- **Files created**: `src/lib/base-auth.functions.ts`, `src/lib/base-pay.functions.ts`, `src/lib/credits.functions.ts`, `src/lib/data-cleaner.server.ts`, `src/components/sign-in-with-base.tsx`, `src/components/base-pay-button.tsx`, `src/routes/billing.tsx`, `src/routes/compare.tsx`, `src/routes/run-card.$runId.tsx`, `src/routes/admin.security.report.tsx`, `src/routes/api/public/base-pay/webhook.ts`, plus migrations.
- **Files modified**: `src/routes/auth.tsx` (promote Base sign-in), `src/routes/pricing.tsx` (5 tiers + dual pay buttons), `src/lib/payments.functions.ts` (credit grants on webhook events), `src/lib/compute/jobs.functions.ts` (quota check uses new credits column), `src/integrations/supabase/types.ts` (regenerated post-migration).
- **Stripe**: 8 new products via `payments--create_product`. Tax codes: `txcd_10103001` (SaaS) for subs, `txcd_10000000` (digital goods) for packs.
- **Deps to add**: `@base-org/account` (Base SDK), `viem` (already installed for DAT mint — reused for SIWE verify).
- **No Edge Functions** — all server-side in TanStack `createServerFn` / public routes.

## Order of execution
1. Migrations (profiles, siwe_nonces, base_payments, credits columns, plan enum widening).
2. Base SIWE auth fns + sign-in component + `/auth` revamp.
3. Stripe product creation + webhook credit allocation + new tiers in pricing page.
4. Base Pay button + verification fn.
5. `/billing` page wiring everything.
6. `/compare` + `/run-card/$id` provenance pages.
7. Data cleaner cron + DAT chain verify.
8. Security rescan + Wiz import + admin report.
9. Re-run security scan post-build, mark fixes.

## Out of scope (call out if you want)
- Migrating *existing* paying users from old Stripe plans onto new ones (need your call: grandfather vs force-upgrade).
- A new ERC-20 contract — keeping current DAT contract at `DAT_CONTRACT_ADDRESS`.
- Mobile-native wallet deep links (Base SDK handles popup + mobile browser flows; native deep-link is a separate effort).
- Replacing Supabase Auth entirely with SIWE-only (would require custom JWT signer + RLS rewrite of ~40 fns — high risk, low reward since SIWE-first UX is achievable while keeping Supabase under the hood).

Approve and I execute end-to-end.
