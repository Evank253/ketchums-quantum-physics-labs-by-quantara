
# Plan: Engine polish + walkable Quantara world

Two parts. Part 1 is small QED engine polish you already asked for. Part 2 is the big new feature: a 3D world you walk through as an avatar, meet the bots, and read a live ledger of every artifact / breakthrough they "discover" with formulas and blueprints.

Important honesty note up front: the bots are a deterministic simulation. They are not real AI agents discovering real physics. The "breakthroughs" are procedurally generated from a curated catalog of real and speculative tech (with real formulas where they exist, clearly-labeled speculative formulas where they don't). The world keeps advancing while you're offline by computing elapsed time on next load — no server-side mining, no real crypto, no real research. I'll label this clearly in the UI so it isn't mistaken for actual science output.

---

## Part 1 — QED engine polish (small)

Already mostly built. Remaining gaps:

1. **Presets** — confirm the 5 presets render in a dropdown with descriptions on hover.
2. **Persistence** — already saving `spec` and `runs` to localStorage; add a "Clear saved state" button.
3. **Validate + clamp** — already in `validateSpec`; add inline red border + tooltip when a value gets clamped, so the user sees what changed.
4. **Export results summary** — new button "Export summary" in `qed-engine-overview.tsx` that builds a single Markdown blob (spec + last run + frontiers + presets used) and triggers a download as `qed-summary-YYYYMMDD-HHMM.md`. Also a "Copy summary" button next to it.

All client-side, no backend.

---

## Part 2 — Quantara World (walkable 3D)

### 2a. Tech choice

- **react-three-fiber** + **drei** + **three** for the 3D scene.
- **zustand** for world state (already lightweight, fits the existing localStorage pattern).
- No backend. Offline growth handled by storing `lastTick` timestamp and replaying elapsed seconds on load (capped at 7 days to avoid runaway numbers).

### 2b. New route

`src/routes/world.tsx` → `/world`. Own `head()` metadata. Link from the main nav.

### 2c. Scene contents

- Ground plane that scales with `world.size` (grows as bot population grows; never shrinks).
- 6–10 bot avatars (instanced meshes, named: Axiom, Borel, Cayley, Dirac, Euler, Feynman, Gauss, Hilbert, Ising, Jacobi). Each wanders on a simple steering loop and emits a speech bubble when it "discovers" something.
- Buildings that spawn as breakthroughs are unlocked (lab, foundry, observatory, reactor, archive, gate).
- First-person WASD + mouse-look controls via `PointerLockControls`. Mobile fallback: on-screen joystick (`nipplejs`-style, but I'll write a tiny custom one to avoid the dep).
- Minimap in a corner.

### 2d. Live growth loop

- A single `useEffect` tick at 1 Hz while the tab is open.
- On mount: compute `elapsed = min(now - lastTick, 7 days)`, advance the sim by that many simulated seconds in a fast loop, then resume real-time ticks.
- Each tick: bots accumulate "research points" → when a threshold is hit, the next item from the breakthrough catalog unlocks, a building spawns, world size nudges up.
- All state persisted to `localStorage` under `quantara.world.v1` after every unlock and every 30 s.

### 2e. Breakthrough catalog + ledger

A curated list in `src/lib/breakthroughs.ts` of ~40 entries. Each entry:

```
{
  id, name, tier, discoveredBy, summary,
  formula: { latex, plain, variables: [{symbol, meaning, units}] },
  blueprint: {
    components: [{name, qty, spec}],
    assemblySteps: [string],
    asciiSchematic: string,    // monospaced diagram
    powerBudget, footprint, risks
  },
  realityTag: 'established' | 'frontier' | 'speculative'
}
```

Mix of real (Shor's algorithm, QEC surface code, photolithography node shrink, fusion ignition criterion Q>1, Penning trap g-2 measurement) and speculative (warp metric, axion haloscope tuning, room-temp superconductor target). Every speculative entry carries the `speculative` tag visibly.

Ledger UI: a sortable, filterable table at `/world/ledger` (child route) with expandable rows showing formula (KaTeX), variable table, ASCII schematic, and a "Copy blueprint" button.

### 2f. Files

- `src/routes/world.tsx` — scene
- `src/routes/world.ledger.tsx` — ledger table
- `src/lib/world-store.ts` — zustand store + persistence + offline catch-up
- `src/lib/breakthroughs.ts` — catalog
- `src/components/world/Bot.tsx`, `Building.tsx`, `Player.tsx`, `Minimap.tsx`, `HUD.tsx`
- `src/components/world/BreakthroughToast.tsx`
- Add KaTeX (`katex` + CSS import) for formula rendering
- Update `src/routes/index.tsx` nav to link `/world`

### 2g. Packages to add

`three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `katex`.

### 2h. Explicit non-goals

- No real crypto mining, no wallet routing, no real blockchain interaction.
- The bots do not call any real AI or solve real open problems; their "discoveries" come from the curated catalog in deterministic order with light randomization.
- This is a creative simulation/game layer, clearly labeled as such in the world HUD.

---

## Open questions before I build

1. First-person walk (WASD + mouse) or third-person follow-cam on your avatar?
2. Catalog size: start with ~40 curated entries and unlock at ~1 every few real minutes, or denser (1/minute)?
3. Should the ledger be export-as-PDF too, or Markdown download is enough?
