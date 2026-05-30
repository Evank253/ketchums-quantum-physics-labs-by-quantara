# Deploy

## One-click: Lovable

Click **Publish** in the Lovable editor. Deploys to Cloudflare Workers
behind `project--<id>.lovable.app`.

## Docker

```bash
docker build -t quantara .
docker run -p 3000:3000 -e WEBHOOK_SECRET=... quantara
```

Healthcheck: `GET /api/health`.

## Cloudflare Workers (manual)

```bash
bun run build
npx wrangler deploy
```

`wrangler.jsonc` already targets the Worker runtime.

## Environment

| Var | Where | Purpose |
|---|---|---|
| `LOVABLE_API_KEY` | runtime | Managed by Lovable. Do not set. |
| `WEBHOOK_SECRET` | runtime | HMAC for `/api/public/webhook` |
| `SESSION_SECRET` | runtime | Encrypted session cookies |

Set runtime secrets in Lovable Cloud → Project Settings → Secrets.
