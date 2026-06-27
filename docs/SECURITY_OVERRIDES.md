# Security Override Audit

Every entry in `package.json#overrides` and `package.json#pnpm.overrides` must be justified here. Remove the entry when the upstream package ships a transitive fix.

| Package | Pinned version | Reason | Upstream tracking | Re-check |
|---|---|---|---|---|
| `undici` | `7.28.0` | Fixes TLS bypass via SOCKS5 (high), Set-Cookie injection (moderate), WS fragment DoS (high), SOCKS5 pool reuse (high), cache whitespace bypass (moderate). Reached transitively via `@cloudflare/vite-plugin` -> `miniflare`. | https://github.com/nodejs/undici/security | When `@cloudflare/vite-plugin` ships an update bundling undici >= 7.28.0 |
| `ws` | `8.21.0` | Memory-exhaustion DoS from tiny fragments. Reached transitively via `@base-org/account`, `viem`, `react-email`, `@cloudflare/vite-plugin`. | https://github.com/websockets/ws/security | When all four parents publish releases bundling ws >= 8.21.0 |
| `brace-expansion` | `5.0.6` | Quadratic DoS via large numeric ranges. Reached via `minimatch` / `glob` chains in `react-email`. | https://github.com/juliangruber/brace-expansion/security | When `react-email` bumps its `glob` dependency |
| `js-yaml` | `4.2.0` | Quadratic DoS in merge-key alias handling. Reached via `@tanstack/react-start` -> `nitro`. | https://github.com/nodeca/js-yaml/security | When `@tanstack/react-start` updates nitro |
| `entities` | `4.5.0` (pnpm only) | Aligns html-parser entity decoding across react-email + react-markdown subtrees to a single audited version. | n/a | Re-check quarterly |

## Process

1. Run `bun audit --audit-level=high` weekly (automated in `security-audit` CI job).
2. Any new high/critical finding → either bump the offending direct dependency or add an override row here with a tracking link.
3. Run `node scripts/audit-overrides.mjs` (see below) to flag overrides that are now obsolete.

## Removal criteria

Drop an override when **all** the following are true:
- `bun why <package>` shows every parent has its own version that's already patched.
- Removing the override and running `bun install && bun audit --audit-level=high` produces 0 high/critical findings.
- CI's `security-audit` job stays green for one full cycle.
