# Scaling

## Today

- Frontend + SSR on Cloudflare Workers (edge, global).
- Ledger persisted in browser `localStorage`, capped at 5000 entries
  (`MAX_ENTRIES` in `src/lib/learning-ledger.ts`).
- QED engine is pure compute, no I/O — scales linearly with requests.

## Path to durable storage

When per-user history needs to survive devices, migrate the ledger to
Lovable Cloud (Postgres):

1. Enable Lovable Cloud.
2. Create `ledger_entries(id, user_id, ts, kind, label, data jsonb)` with
   RLS scoped to `auth.uid()`.
3. Replace the `localStorage` read/write inside
   `src/lib/learning-ledger.ts` with a server fn that hits Supabase.
4. Keep the `logLedger()` call sites unchanged — only the transport
   changes.

## Worker concurrency

The QED endpoint is CPU-only and finishes in <5 ms; Cloudflare Workers
handle this at edge-instance concurrency with no extra config.

## Lattice / GPU work

Lattice-QCD style workloads do **not** belong inside the Worker. Off-load
to a queue + external GPU worker and post results back via
`/api/public/webhook`.
