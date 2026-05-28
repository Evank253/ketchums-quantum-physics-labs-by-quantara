# Quantara Core

**Creator:** Evan Ketchum  
**Date:** 2026-05-27  
**Status:** Active — Protected Intellectual Property

---

## What This Is

`quantara-core` is the shared foundational layer of the Quantara Multiversal QED Ecosystem. It contains:

- Shared TypeScript types used by both the 3D World and the 4D Atlas
- All legal and licensing documentation
- The perturbative QED engine paper and run card data
- Creator Records for every documented breakthrough
- Research Program Notes for the 4 open QED frontiers

## Structure

```
quantara-core/
  src/
    types.ts              — Shared UnlockEvent, AtlasNode, Programme types
    breakthroughs.ts      — Shared breakthrough catalog
    run-cards.ts          — Run card types and helpers
    creator-records.ts    — Auto-generate creator record files
  creator_records/        — One .md file per breakthrough (timestamped)
  programs/               — 4 open research program notes
  engine/
    paper/                — QED engine preprint (Markdown)
    scripts/              — Creator record generator script
    run_cards.csv         — Exported engine run data
  data/                   — Plots, logs, supplemental data
  TERMS.md
  LICENSE_RESEARCH.md
  LICENSE_COMMERCIAL.md
  CREATOR_POLICY.md
```

## How to Use

This package is a **type library and documentation layer**. It does not run on its own.

- `quantara-3d` imports types from here and **writes** UnlockEvents and CreatorRecords.
- `quantara-4d` imports types from here and **reads** UnlockEvents to populate the Atlas.

## Legal

All content in this repository is protected under the Quantara Commercial & Institutional License. See `LICENSE_COMMERCIAL.md` and `TERMS.md`.

> Unauthorized commercial use, institutional deployment, or removal of creator attribution is a violation of these terms.
