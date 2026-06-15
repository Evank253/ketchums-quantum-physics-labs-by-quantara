## 1. License + Copyright + Trademark Lockdown

**Rewrite `docs/legal/TERMS.md`, `LICENSE_RESEARCH.md`, `LICENSE_COMMERCIAL.md`** and add a new **`docs/legal/LICENSE.md`** ("All Rights Reserved — No Use Without Written Permission") that states:

- © 2026 Evan Ketchum. All rights reserved.
- No copying, forking, cloning, mirroring, redistribution, derivative works, reverse engineering, decompilation, or training of AI/ML models on this code, content, math, theories, ledger entries, or world data — in whole or in part — without prior signed written permission from Evan Ketchum.
- Viewing the published site does **not** grant any license. Source visibility (browser devtools, public repo, archive) does **not** grant any license.
- Academic citation only permitted with explicit attribution: *"Ketchum's Quantum Physics Labs · Quantara — © Evan Ketchum, used by permission."*
- Violators are liable for statutory damages, injunctive relief, disgorgement of profits, and legal fees. Jurisdiction + governing law clause.

**Trademark notices** added to TERMS, footer, and `<head>` meta:

> Ketchum's Quantum Physics Labs™, Ketchum's QED Engine™, Ketchum's QCD Engine™, Ketchum's Quantara Engine™, Ketchum's World Engine™, Ketchum's Atlas Engine™, Ketchum's Self-Healing Swarm™, Quantara™ — all trademarks of Evan Ketchum. Unauthorized use prohibited.

**Engine renames in UI** (where engine names appear): prefix every engine with **"Ketchum's"** — e.g. *Ketchum's QED Engine*, *Ketchum's KVE Lab*, *Ketchum's CERN-in-a-Pocket Engine*, *Ketchum's Wave Tamer*, *Ketchum's Gate Smith*, *Ketchum's World Engine*, *Ketchum's Atlas Engine*. Files touched: `src/components/qed-engine-overview.tsx`, `qed-computer.tsx`, `kve-lab.tsx`, `cern-embed.tsx`, `wave-function-tamer.tsx`, `entangled-gate-smith.tsx`, `quantara-world.tsx`, plus the homepage hero/captions in `src/routes/index.tsx` and the site footer.

**Site-wide additions:**

- `src/components/site-footer.tsx` — add a copyright + trademark block and links to the new `/legal/license` route.
- `src/routes/__root.tsx` — add `<meta name="copyright" content="© Evan Ketchum — All Rights Reserved">` and a `rel="license"` link to `/legal/license`.
- New route `src/routes/legal.license.tsx` rendering the lockdown license via `MarkdownDoc`.
- `public/robots.txt` — add `User-agent: GPTBot / ClaudeBot / CCBot / Google-Extended / anthropic-ai / PerplexityBot — Disallow: /` to block AI training scrapers.
- `public/llms.txt` — replace with a notice that training/ingestion is prohibited.

## 2. Treasury Wallet (where $DAT lands)

Hard-code your wallet as the **Creator Treasury** so all minting reward flows credit it visibly and on-chain.

- New file `src/lib/treasury.ts` exporting `TREASURY_WALLET = "0x15B3E693Ac1B76A49cdc61FCfe8696F6dd1586DD"` + Basescan link helper.
- `src/components/dat-wallet.tsx` — add a "Creator Treasury" panel at the top showing your address, on-chain $DAT balance, and an Etherscan/Basescan deep link. Always visible (even without a connected wallet).
- `src/lib/dat-mint.functions.ts` — add a new server fn `getTreasuryBalance()` that reads the on-chain balance of the treasury address.
- New homepage HUD slot in `src/components/dat-hud.tsx` showing "Treasury · {balance} $DAT" with link to the wallet panel.
- `src/lib/dat-mint.server.ts` — add an optional auto-mint to treasury hook: whenever a user claims, mint a configurable royalty (default 10%) to `TREASURY_WALLET` in the same tx batch (separate `mint()` call, recorded in `dat_claims` with `reason='creator royalty'`).

## 3. Wallet Connect — MetaMask, Rabby, Coinbase, mobile

There is no "MetaMask API key". Two clean upgrades to the existing connect flow in `src/components/dat-wallet.tsx`:

**a) Keep the existing EIP-1193 path** (already works with MetaMask/Rabby/Coinbase desktop extensions) and improve the empty state with deep links to install MetaMask + Coinbase Wallet + Rabby.

**b) Add WalletConnect v2** so mobile wallets (and users without an extension) can connect by scanning a QR. Requires:
- `bun add @walletconnect/ethereum-provider`
- New secret **`VITE_WALLETCONNECT_PROJECT_ID`** (you create it free at cloud.walletconnect.com — I'll prompt for it via the secrets tool).
- New `src/lib/wallet-connect.ts` exposing a `connectWalletConnect()` helper that returns an EIP-1193 provider; `dat-wallet.tsx` gets a second "Connect with WalletConnect (mobile)" button next to the existing connect button.

## 4. RPC + On-chain Mint Secrets

Today `dat_mint.server.ts` falls back to public `sepolia.base.org`, which rate-limits and silently fails under load. Add and wire:

- **`BASE_SEPOLIA_RPC_URL`** — a dedicated RPC (Alchemy / Infura / QuickNode free tier). Server-only secret.
- **`DAT_CONTRACT_ADDRESS`** — the deployed ERC-20 address on Base Sepolia.
- **`DAT_MINTER_PRIVATE_KEY`** — owner key with `mint(address,uint256)` permission. Server-only.

I'll request all three via the secrets tool in build mode. `dat-mint.server.ts` will prefer `BASE_SEPOLIA_RPC_URL` when set.

> Note on contract deployment: I can't deploy an ERC-20 from inside Lovable. I'll provide a ready-to-deploy `contracts/Dat.sol` (OpenZeppelin `ERC20 + Ownable` with owner-only `mint`) and a one-line Remix/Foundry deploy walkthrough in `docs/DEPLOY_DAT.md`. You deploy, paste the address + minter key into the secrets prompt, and the engine activates.

## 5. Security Memory + Findings

- Update `security--update_memory` to record: "All public-table writes are server-only via service role; treasury wallet is hard-coded; license = All Rights Reserved (no scraping/training)."
- Re-run security scan after changes; mark any prior findings related to public DAT writes / license exposure as fixed.

---

## Files Created
- `docs/legal/LICENSE.md` (new lockdown)
- `docs/DEPLOY_DAT.md`
- `contracts/Dat.sol`
- `src/lib/treasury.ts`
- `src/lib/wallet-connect.ts`
- `src/routes/legal.license.tsx`

## Files Edited
- `docs/legal/TERMS.md`, `LICENSE_RESEARCH.md`, `LICENSE_COMMERCIAL.md`
- `src/components/dat-wallet.tsx`, `dat-hud.tsx`, `site-footer.tsx`
- `src/components/qed-engine-overview.tsx`, `qed-computer.tsx`, `kve-lab.tsx`, `cern-embed.tsx`, `wave-function-tamer.tsx`, `entangled-gate-smith.tsx`, `quantara-world.tsx`
- `src/routes/__root.tsx`, `src/routes/index.tsx`
- `src/lib/dat-mint.functions.ts`, `src/lib/dat-mint.server.ts`
- `public/robots.txt`, `public/llms.txt`

## Secrets I'll Prompt For (build mode)
- `VITE_WALLETCONNECT_PROJECT_ID`
- `BASE_SEPOLIA_RPC_URL`
- `DAT_CONTRACT_ADDRESS`
- `DAT_MINTER_PRIVATE_KEY`

Approve and I'll execute in this order: legal docs → trademark renames → treasury wiring → WalletConnect → secrets prompt → contract deploy guide.