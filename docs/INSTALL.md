# Install

```bash
git clone https://github.com/Evank253/Quantara-Core.git
cd Quantara-Core
bun install      # or: npm ci
bun dev          # http://localhost:8080
```

Requires Node 20+ or Bun 1.1+. Copy `.env.example` to `.env` for local secrets.

## Verify

```bash
bun run test                 # vitest: unit + integration + perf
curl localhost:8080/api/health
curl localhost:8080/api/qed
```
