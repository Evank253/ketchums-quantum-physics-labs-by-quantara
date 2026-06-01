
## Goal

Integrate the full **Quantara-Core deployment spec** (the three-file `server.py` / `index.html` / `quantara_client.js` blueprint + launch instructions) into the rotating globe section as on-screen "orbital transmission" text — so when visitors land on the Living Planet, they see the architectural broadcast streaming alongside the planet.

## Where

`src/components/quantara-world.tsx` — the `LivingPlanet` component that already renders the rotating sphere.

## What I'll build

1. **New side panel** docked to the right of the globe canvas on desktop, stacked below on mobile, styled as an `ORBITAL_TRANSMISSION` console:
   - Header strip: `▌ QUANTARA-CORE // ANCESTRAL_FOOTPRINT_BROADCAST  ·  EPOCH {epoch}`
   - Status line that types out `> initializing total_project_baking --target "quantara-Core"` → `> SUCCESS · COMPLETE SYSTEM COMPILED` (auto-cycling typewriter, ~30ms/char, loops every ~45s).
   - Three collapsible "file cards" — `server.py`, `index.html`, `quantara_client.js` — each rendered as a `<pre>` code block with the full source verbatim, syntax-tinted (keywords cyan, strings emerald, comments muted), with a copy-to-clipboard button.
   - A "Launch Sequence" footer block listing the 4 steps (save files → run server → host portal → connect phone), formatted as numbered terminal lines.

2. **Overlay ticker on the globe canvas itself**: a thin bottom band that scrolls one line at a time from the spec (e.g. `[VAULT] SELF_HEALING_CEMENT_V4 logged`, `[PORTAL] auth_token verified`, `[FUEL] +0.001 GB harvested`) — synced to the existing `epoch` tick so it feels like the planet is emitting the broadcast.

3. **Section intro copy updated** to frame the panel:
   > "Reality_B is broadcasting its own deployment blueprint back to us. Below: the raw three-file Ancestral Footprint Engine, streamed live from the orbital observatory."

## Visual treatment

- Reuse existing tokens: `glass-panel`, `text-chrome`, `text-accent`, mono fonts, the cyan `#00ffcc`-style glow already in the design system (mapped through existing `oklch` accent).
- Code blocks: `border border-white/5 bg-background/80`, scrollable with `max-h-[420px] overflow-auto`, tabular `font-mono text-[11px] leading-relaxed`.
- No new dependencies. No syntax-highlighter library — light manual tinting via a small token regex is enough and stays bundle-free.

## Out of scope (intentionally)

- We are **not** wiring up an actual WebSocket server, Python runtime, or writing files to disk — TanStack Start runs on Cloudflare Workers, so `server.py`, raw TCP sockets, and local FS writes are not executable here. The spec is presented as **displayed architectural text** inside the globe section, exactly matching the "integrate into the globe text" request.
- No changes to routing, auth, ledger schema, or the `SolvedTheories` / `FoundationalEquations` components.

## Files touched

- `src/components/quantara-world.tsx` — extend `LivingPlanet` with the transmission panel + ticker. No new files needed.

Approve and I'll build it.
