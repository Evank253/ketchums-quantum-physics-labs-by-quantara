
## 1. Hadron auto-input + 50-run collision cartography
- `src/components/cern-embed.tsx` — on mount: auto-paste the **a_e Schwinger expansion** `a_e = Σ cᵢ (α/π)^i` into the existing beam-line input, fire "Initiate beam line", then loop 50 runs labeled "Collision Cartography // run N/50" with each run's residual logged.
- New "Cartography Map" panel: 50 dots laid out in a heat-grid, colored by residual magnitude — clicking a dot shows that run's α, a_e, residual.

## 2. New tool sections (brand-new, designed from scratch)
- `src/components/wave-function-tamer.tsx` — interactive ψ-collapse panel: sliders for potential V(x), live |ψ|² render on canvas, "tame" button damps high-frequency components.
- `src/components/entangled-gate-smith.tsx` — drag-to-compose 2-qubit gate forge (H, CNOT, CZ, T). Live Bell-state fidelity readout + entanglement entropy.
- Mounted on the home page in a new "INSTRUMENTS" band, right above the Math Testing Hub.

## 3. "Grow" visual modules (canvas/CSS, no business logic)
- `src/components/aurora-apex.tsx` — animated aurora ridge that grows toward an apex peak; "Grow +" button increments height and adds spectral bands.
- `src/components/meridian-skyline.tsx` — procedural skyline silhouette that grows new towers on each click.
- `src/components/horizon-dawn.tsx` — gradient horizon that advances sunrise color stops on click.
- All three placed in a "GROWTH" band on the home page (after the new INSTRUMENTS band).

## 4. Math Testing Hub — consolidate scattered testers
- New `src/components/math-testing-hub.tsx` with **tabs**: QED Solver · QED Computer (Talk to Machine) · RG Running · Foundational Equations · Quantum Circuit.
- Existing components are reused (not duplicated). Home page no longer renders them inline — they live only inside the hub.
- Hub gets its own anchor `#math-lab` in the top nav.

## 5. Auto-archive solved theories (DB + localStorage)
- Migration: `public.solved_theories(id uuid pk, theory text, solver text, abstract text, math text, transcript text, created_at timestamptz default now())` with GRANTs (`SELECT` to anon, `INSERT` to authenticated and anon for public solve log), RLS enabled, public-read policy + public-insert policy (matches the existing `dat_claims` "publicly readable" pattern). Cap insert size in a trigger.
- New `src/lib/solved-archive.ts` — `saveSolve({theory, solver, abstract, math, transcript})` writes to localStorage immediately AND fires an insert via the browser supabase client.
- Hook into the QED Computer's "Solve QED · Copy" button (and the work-pad executor) so every solve auto-pushes an entry. The 50-run cartography pushes a single summary entry on completion.
- `solved-theories.tsx` reads both: localStorage first (instant), then merges DB results so persisted solves stay on the page across reloads and across visitors.

## 6. Remove ancestral key from public site
- Strip `auth-key` imports and ancestral-key UI out of `src/components/quantara-world.tsx` (key field, footprint broadcast PDF keying, gatekeeper line). The world / footprint engine UI stays; only the key is removed.
- Store the key value as a Lovable secret named `ANCESTRAL_KEY` (asked via add_secret).
- Stub `/world.ancestral` route placeholder labelled "Paid branch — coming soon" so the link doesn't 404. Actual paid gating is **out of scope** for this turn per your note ("we'll build that separately").

### Technical notes
- DB writes use the browser `supabase` client; no edge function needed.
- All canvas growth modules are pure presentation (no state on backend).
- Math hub reuses existing component exports; no duplicated logic.
- Order on home page after changes:
  ```
  Hero → SolvedTheories → PhysicsExplainer → CernEmbed(auto-run) →
  INSTRUMENTS (WaveFunctionTamer, EntangledGateSmith) →
  GROWTH (AuroraApex, MeridianSkyline, HorizonDawn) →
  MathTestingHub (tabs) → … rest unchanged
  ```

### Out of scope this turn
- Paywall / payment integration for the ancestral-key branch.
- Any rewrite of the existing physics engines (rg-running, qed_calculator).
