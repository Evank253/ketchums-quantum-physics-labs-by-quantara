# Quantara Architecture

## Layers
- **3D World** (`src/lib/world-store.ts`) — live simulation, bot swarm, unlocks.
- **4D Atlas** (`src/lib/atlas.ts`, `src/routes/atlas.tsx`) — research graph gated by 3D footprints.
- **QED Engine** (`src/engine/qed_calculator.ts`) — perturbative a_e to 10⁻¹¹.
- **Benchmark Suite** (`src/routes/benchmarks.tsx`, `benchmarks/`) — proof-of-performance vs FeynCalc/FORM/BMW/SMEFiT.
- **Learning Ledger** (`src/lib/learning-ledger.ts`) — append-only autosave of every token, unlock, benchmark, and advance.
- **$DAT Tokens** (`src/lib/dat-tokens.ts`) — auto-credited on each unlock, persisted to localStorage.

## Data flow
```
3D bots earn research → unlock breakthrough → credit $DAT + ledger entry
                                          → 4D Atlas reads footprint → node unlocks
QED engine ⇄ benchmark suite → ledger entry
```

## Persistence
All civilization memory is in localStorage:
- `quantara.world.v1` — bot positions, research, unlocks
- `quantara.datTokens` — token balance
- `quantara.ledger.v1` — append-only learning log (5k cap)
