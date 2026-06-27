# Build Checklist

Run before every release / merge to `main`.

## 1. Local verification
- [ ] `bun install --frozen-lockfile`
- [ ] `bun run lint --max-warnings=0`
- [ ] `bunx tsc --noEmit`
- [ ] `bunx vitest run`
- [ ] `bun run build` (production)
- [ ] `bun run build:dev` (SSR prerender; catches `requireSupabaseAuth` leakage into public loaders)

## 2. Dependency / supply-chain
- [ ] `bun audit --audit-level=high` returns 0 findings
- [ ] No new entries in `overrides` / `pnpm.overrides` unless tracked in `docs/SECURITY_OVERRIDES.md`
- [ ] Dependabot PRs reviewed and merged or explicitly deferred
- [ ] CodeQL workflow green in the last run

## 3. Backend / Supabase
- [ ] No new `CREATE TABLE public.*` without `GRANT` statements in same migration
- [ ] All new tables have `ENABLE ROW LEVEL SECURITY` + at least one policy
- [ ] Privileged SECURITY DEFINER functions revoke EXECUTE from end-users
- [ ] Cron jobs use `SUPABASE_SERVICE_ROLE_KEY` header, not client tokens
- [ ] `bunx supabase db lint` clean (run via Lovable supabase linter tool)

## 4. Auth / RLS regression
- [ ] Sign-in (email + Google) succeeds in preview
- [ ] Protected routes under `_authenticated/` redirect anonymous users to `/auth`
- [ ] Anonymous ledger calls return structured `{ ok:false, code:"AUTH_REQUIRED" }`, not a 500
- [ ] `tests/security/*.test.ts` all pass

## 5. Runtime
- [ ] `/admin/security` shows 0 unresolved critical findings
- [ ] `/admin/cron` shows green for `nexus-healer`, `email-dispatcher`
- [ ] `/admin/email-health` queue depth < 100, no dead-lettered messages
- [ ] `/lovable/email/health` returns `{ ok: true }`

## 6. Visual / publish
- [ ] Homepage and `/pricing`, `/billing`, `/run-card/$runId` render without console errors
- [ ] Mobile viewport (375x812) — on-screen joystick + chat widget functional
- [ ] OG metadata present on every public route (title, description, og:image where applicable)
