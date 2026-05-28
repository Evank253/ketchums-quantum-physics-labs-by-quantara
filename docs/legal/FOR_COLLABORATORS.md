# For Collaborators — Quantara QED Engine & World

**Creator:** Evan Ketchum  
**Contact:** Evan.ketchum2026@outlook.com  
**Date:** 2026-05-27

---

## What This Is

**The Quantara QED Engine** is a perturbative quantum electrodynamics computation framework with:

- Explicit physics content (Lagrangian, on-shell renorm scheme, gauge ξ, loop orders 1–6, diagram counts)
- Validated numerics (verified against Aoyama et al. 2019/2020)
- Full uncertainty decomposition (σ_trunc, σ_num, σ_hw, σ_total)
- Per-run signed "run cards" for complete reproducibility

**The Quantara World** is a virtual research interface that:

- Treats each engine milestone or external result as a visible "breakthrough" artifact
- Maintains a ledger of formulas, blueprints, and metadata
- Clearly labels everything: `established`, `frontier`, or `speculative`
- Connects 3D simulation research to a 4D research atlas via "digital footprint" data bridges

---

## What It Is Not

- Not a closed-form or nonperturbative solution of QED in 4D
- Not a replacement for lattice, constructive, or SMEFT work
- Not a claim of new experimental anomalies

---

## How You Can Use It

### As a Provenance and Visualization Layer for Your Codes

1. You compute with your existing QED / Lattice / SMEFT tools.
2. You upload your numeric outputs and method notes to Quantara.
3. Each run gets a signed run card + Creator Record (including your name and references).
4. Your results appear in the world ledger, linked to your publication or preprint.

### As an Educational / Planning Environment

- Show students how perturbative QED is structured, loop by loop.
- Organize open problems into clear research programs.
- Plan milestones and track progress visually.

---

## Run Card Format

Each Quantara run card includes:

| Category | Fields |
|---|---|
| **Physics** | loop orders, diagram counts, renorm scheme, gauge, acceleration params |
| **Numerics** | integral method, precision bits, tolerance, samples, verification refs |
| **Engine** | seeds, spec, QPU/simulator flags |
| **Results** | 1/α, aₑ, residuals, σ_trunc, σ_num, σ_hw, σ_total |
| **Cost** | T-gates, depth, wall-clock, energy (if modelled) |
| **Provenance** | commit hash, container digest, calibration/model ID |

---

## Attribution & Creator Records

Quantara maintains Creator Records for each engine milestone and ledger entry.

- External collaborators appear as co-creators on any records that include their work.
- We ask that you cite the Quantara QED Engine and your own underlying codes in any publications.

---

## Revenue / Commercial Model

- Academic/non-commercial use: free with attribution (see `LICENSE_RESEARCH.md`).
- Commercial/institutional use (companies, national labs, universities deploying as infrastructure): subject to license fee and revenue-sharing terms (see `LICENSE_COMMERCIAL.md`).

---

## How to Reach Us

If you are interested, please email **Evan.ketchum2026@outlook.com** with:

1. A 1–2 paragraph description of your QED / lattice / SMEFT work.
2. A link to your code or a recent paper.
3. What you would like Quantara to visualize or help organize.

**Target collaborator groups:**
- Perturbative QED / Laporta-type groups
- Lattice QCD/QED / muon g-2 groups (BMW, RBC/UKQCD, etc.)
- SMEFT / precision electroweak groups
- Experimental groups (g-2 at Fermilab, Lamb shift, MUonE, etc.)
