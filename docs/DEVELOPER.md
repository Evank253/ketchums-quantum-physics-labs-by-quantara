# Developer Guide

## Repo map

| Area | Path | Role |
|---|---|---|
| Core engine | `src/engine/` | QED perturbative calculator (target 10⁻¹¹) |
| 3D World | `src/routes/world.tsx`, `src/components/quantara-world.tsx` | Live bot swarm + unlocks |
| 4D Atlas | `src/routes/atlas.tsx`, `src/lib/atlas.ts` | Research-node atlas, gated by world footprints |
| Benchmarks | `benchmarks/`, `src/routes/benchmarks.tsx` | QED suite + dashboard |
| Ledger | `src/lib/learning-ledger.ts`, `src/routes/ledger.tsx` | Append-only autosave |
| API | `src/routes/api/` | HTTP endpoints (qed, benchmark, health, webhook) |
| Tests | `tests/{unit,integration,benchmarks}` | Vitest suites |

## Data flow

```
World (3D) ──unlocks──► Atlas (4D, read-only)
   │
   ├──creditDat()──► dat-tokens ──► Learning Ledger (autosave)
   └──runBenchmarks()──► /benchmarks ──► Learning Ledger
```

## Separation Law

The 4D Atlas reads world state but never writes back. Only humans observe
both layers.
