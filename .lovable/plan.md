# Plan: Self-Healing Swarm + Kernel "Solve" Commands

Scope is intentionally narrow: only what the user asked for. No 4D Atlas, no new routes, no business logic changes elsewhere. The uploaded zips are used as reference (AHM/PCL fields and the kernel snippet) — not bulk-copied into the project.

## 1. Self-Healing Swarm fields on bots

`src/lib/world-store.ts`

- Extend `BotState` with:
  - `healingActive: boolean`
  - `phaseCorrection: number` (0.0 – 1.0, default 1.0)
- Back-fill existing persisted bots on load (`init` / hydration path) so old saved state migrates without crashing: any missing field defaults to `healingActive: false`, `phaseCorrection: 1.0`.
- Add action `healBot(id: string)` — sets `healingActive: true` and `phaseCorrection: 1.0` on the matching bot. Pure state update; no economy side-effects.
- During `tick`, drift `phaseCorrection` slightly downward over time for each bot (small decay, clamped at 0.6) so "Heal" is meaningful. Healing resets it. No effect on research accrual — purely cosmetic/HUD signal to keep this UI-only.

## 2. HUD: Self-Healing Swarm panel

`src/routes/world.tsx`

- Add a small collapsible HUD card titled "Self-Healing Swarm (AHM/PCL)" inside the existing world overlay (alongside current panels — do not redesign the layout).
- For each bot: name, role, phase-correction bar (color shifts amber when < 0.85), and a "Heal" button that calls `healBot(id)`.
- "Heal All" button at the top of the panel.
- Read-only — no new persisted data beyond what step 1 adds.

## 3. Kernel "solve" commands

`src/components/qed-computer.tsx` — extend the existing `kernel()` function (lines 66–199) only. No restructuring.

Insert the six new branches near the top of `kernel()`, after the empty/help guards and before the existing numeric routes, so they take precedence over the expression evaluator:

- `solve vacuum` → `KVE_STABILIZER // VACUUM_CATASTROPHE_RESOLVED` (Eq 43)
- `solve singularity` / `black hole` → `UNITARY_PERSISTENCE // HAWKING_PARADOX_RESOLVED` (Eq 44)
- `solve dark matter` → `MULTIVERSAL_GRAVITY // DARK_MATTER_RESOLVED` (Eq 45)
- `solve gravity` / `hierarchy` → `SCALE_STABILIZER // HIERARCHY_PROBLEM_RESOLVED` (Eq 47)
- `solve proton` → `MUONIC_RECALIBRATION // QED_UNIVERSALITY_RESTORED` (Eq 46)
- `borel` → `BOREL_HEAL_COMPLETE // DYSON_LIMIT_BYPASSED` (Eq 42)

Each branch returns `kind: "calc"` with the multi-line `detail` array from the user's snippet (theoretical value, applied filter, result, status/haiku line).

Update the `help` block's command list to include the new `solve …` and `borel` commands so users can discover them.

Each successful `solve …` invocation also writes an `UnlockEvent` via `useWorld.getState().addExternalUnlock?` — **No.** To avoid altering ledger semantics (external_research is for real ingestion), we will instead append a `simulation`-source event using a small new helper `logKernelBreakthrough(id, label)` added to `world-store.ts` that pushes an `UnlockEvent { source: "simulation", discoveredBy: "QED Kernel" }`. This keeps the kernel observable from the existing ledger UI without polluting the external-research path.

## 4. Files

- **edit** `src/lib/world-store.ts` — bot fields, migration, `healBot`, `logKernelBreakthrough`, tick decay
- **edit** `src/routes/world.tsx` — add Self-Healing Swarm HUD panel
- **edit** `src/components/qed-computer.tsx` — add six kernel branches + import `useWorld` to log breakthroughs + extend help text

## Out of scope (explicitly not doing)

- 4D Atlas / `world4d` route / `atlas.ts` / `footprints.json` bridge
- Replacing the existing `QedSolver` with the uploaded one
- New legal/docs changes
- DAT economy changes

```text
+----------------+        heal()         +-----------------+
|  Swarm HUD     | --------------------> |  world-store    |
|  (world.tsx)   | <-- phase bars ------ |  bots[]         |
+----------------+                       +--------+--------+
                                                  ^
                                  logKernelBreakthrough()
                                                  |
+----------------+   "solve vacuum"      +--------+--------+
|  QedComputer   | --------------------> |  kernel()       |
+----------------+   KVE_STABILIZER ...  +-----------------+
```
