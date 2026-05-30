## End-to-end verification + visual layer

### 1. Verify (no source changes unless red)
- `bun run test` — all 4 suites (unit, integration ×2, perf).
- `bunx tsc --noEmit` — full project typecheck.
- `bun run build` — production build.
- Smoke the live API: `/api/health`, `/api/qed`, `/api/benchmark` via `invoke-server-function`.
- If any step fails, fix the source (not the test) and re-run until green.

### 2. Visual / theme layer (additive, no logic changes)
Goal: more "living simulation" texture without rewriting the home page.

- **`src/components/quantara-fx.tsx`** — three reusable, GPU-cheap background atoms used across routes:
  - `<StarField>` — slow-drifting CSS radial-gradient star layer.
  - `<GridHorizon>` — perspective scanline grid (synthwave/tron register).
  - `<NoiseOverlay>` — film-grain SVG noise at 4% opacity.
  - `<AuroraBlobs>` — three blurred conic-gradient blobs (primary / accent / emerald) drifting at 60s.
- **`src/styles.css`** — add tokens + keyframes (no token renames):
  - `--gradient-aurora`, `--gradient-grid`, `--shadow-glow-cyan`, `--shadow-glow-amber`.
  - Keyframes: `aurora-drift`, `scanline`, `pulse-glow`, `float-y`.
  - Utility classes: `.text-gradient-aurora`, `.surface-glass`, `.hairline`, `.glow-cyan`, `.glow-amber`.
- **Apply lightly** (no copy/structure changes):
  - `routes/index.tsx` — mount `<AuroraBlobs>` + `<NoiseOverlay>` behind the hero, add `.text-gradient-aurora` to the H1, swap the existing nav pills to `.surface-glass` + `.glow-*`.
  - `routes/benchmarks.tsx` — `<GridHorizon>` behind the metrics grid.
  - `routes/ledger.tsx` — `<StarField>` behind the stat tiles.
  - `routes/atlas.tsx` — already has `<Stars>`, just add `<NoiseOverlay>` for film texture.

All FX components are pure CSS/SVG (no extra deps), use semantic tokens, and respect `prefers-reduced-motion`.

### Out of scope
- No new routes, no copy rewrites, no structural redesign — only background/texture/typography polish.
- No new third-party libraries.

Approve and I'll run the verification, then ship the visual layer.