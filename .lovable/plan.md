
# Quantara Legal & Creator Policy Integration

Goal: bring the 7 uploaded documents into the project as both source files and visible UI, and enforce the CREATOR_POLICY's separation between simulation vs external_research breakthroughs.

## 1. Copy docs into the repo

Create `docs/legal/` and copy each upload verbatim (so the markdown is the source of truth):

- `docs/legal/TERMS.md`
- `docs/legal/LICENSE_RESEARCH.md`
- `docs/legal/LICENSE_COMMERCIAL.md`
- `docs/legal/CREATOR_POLICY.md`
- `docs/legal/FOR_COLLABORATORS.md`
- `docs/legal/ARCHITECTURAL_BLUEPRINT.md`
- `docs/legal/README.md`

Use Vite's `?raw` import so the same markdown renders in the UI without duplication.

## 2. Legal routes (TanStack Start, file-based)

Add a parent route + leaf routes under `src/routes/`:

```text
legal.tsx                 -> /legal       (index hub: cards linking to each doc)
legal.terms.tsx           -> /legal/terms
legal.research-license.tsx
legal.commercial-license.tsx
legal.creator-policy.tsx
legal.collaborators.tsx
legal.blueprint.tsx
```

Each leaf:
- Imports its markdown via `?raw`
- Renders with `react-markdown` + `remark-gfm` (install both)
- Sets unique `head()` meta (title, description, og:title/description)
- Uses `prose` styling for readability

`/legal` hub: grid of cards summarizing each doc with a "Read →" link, plus the creator/contact block.

## 3. Footer attribution (site-wide)

Add `<SiteFooter />` rendered in `src/routes/__root.tsx` (outside the 3D `/world` route — wrap with a route-aware check so it does NOT mount on `/world` or `/world/ledger` where the canvas is fullscreen).

Footer contents:
- "© 2026 Evan Ketchum — Quantara Platform. All rights reserved."
- Links: Terms · Research License · Commercial License · Creator Policy · Collaborators · Blueprint
- Contact: Evan.ketchum2026@outlook.com

## 4. Ledger: simulation vs external_research labeling

Per CREATOR_POLICY §1 and §5, every ledger entry must show its class.

- Extend `UnlockEvent` in `src/lib/world-store.ts` with `source: "simulation" | "external_research"` (default `"simulation"` for bot-driven unlocks; back-fill existing persisted events on `init()`).
- Extend the type to optionally carry `authors?: string[]`, `references?: string[]`, `runCardId?: string` for external entries.
- In `src/routes/world.ledger.tsx`:
  - Add a colored badge per row: amber "SIMULATION" or emerald "EXTERNAL RESEARCH"
  - Add a Source filter to the existing filters (Category / Tier / Unlock / Search)
  - Make the PDF export include the source label and (when external) the authors + references block
  - Add a small disclaimer banner at the top echoing CREATOR_POLICY §5

## 5. Creator Record scaffolding

New module `src/lib/creator-records.ts`:

- Type `CreatorRecord { id, breakthroughId, kind: "simulation"|"external_research", authors: string[], platformCreator: "Evan Ketchum", commit?, configRef?, isoTimestamp, notes? }`
- `buildCreatorRecord(event)` → returns a Markdown string in the format documented in CREATOR_POLICY §2 / FOR_COLLABORATORS Run Card table
- `downloadCreatorRecord(event)` → triggers a `.md` download named `creator-record-<breakthroughId>-<timestamp>.md`

Wire a "Download Creator Record" button into each ledger row.

## 6. External Result ingestion form (small)

On `/world/ledger`, add a collapsible "Log external result" panel that lets a user paste:
- Breakthrough ID (select from catalog)
- Author names (comma-separated)
- References (URLs / DOIs)
- Optional notes

Submission writes a new `UnlockEvent` with `source: "external_research"` into the world store (separate list, no research-cost deduction — it does not consume bot research) and immediately offers the Creator Record download. Stored in `localStorage` so it persists across sessions.

## 7. Index page nudges

`src/routes/index.tsx`: add small links in the header/nav to `/legal` and surface the "Simulation, not solved physics" disclaimer near the QED Engine section (one line, sourced from `TERMS.md` §3).

## Technical notes

- Install: `bun add react-markdown remark-gfm`
- Markdown imports use `?raw` to keep a single source of truth; no duplication of legal text in TSX.
- Route filenames use dots per TanStack convention; `createFileRoute("/legal/terms")` etc.
- Schema migration in `world-store.ts` `init()`: any existing persisted `UnlockEvent` without `source` is treated as `"simulation"`.
- No business-logic change to QED engine or 3D simulation; this is purely additive (docs UI + ledger metadata + scaffolding).

## Files touched

Created:
- `docs/legal/*.md` (7 files, copies of uploads)
- `src/routes/legal.tsx`, `legal.terms.tsx`, `legal.research-license.tsx`, `legal.commercial-license.tsx`, `legal.creator-policy.tsx`, `legal.collaborators.tsx`, `legal.blueprint.tsx`
- `src/components/site-footer.tsx`
- `src/components/markdown-doc.tsx` (shared md renderer)
- `src/lib/creator-records.ts`

Edited:
- `src/routes/__root.tsx` (mount footer except on /world*)
- `src/lib/world-store.ts` (add `source` etc., migrate persisted state)
- `src/routes/world.ledger.tsx` (badges, source filter, ingestion panel, creator-record export)
- `src/routes/index.tsx` (legal nav + simulation disclaimer)
- `package.json` / `bun.lock` (react-markdown, remark-gfm)
