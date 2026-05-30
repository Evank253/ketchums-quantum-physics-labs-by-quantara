# Quantara HTTP API

All endpoints return JSON. Base URL = your deployment origin.

## `GET /api/health`

Liveness probe.

```json
{ "status": "ok", "service": "quantara", "ts": 1730000000000 }
```

## `GET /api/qed?loops=6`

Run the QED perturbative calculator. `loops` ∈ [1, 6].

```json
{
  "loops": 6,
  "ae_predicted": 0.001159652181,
  "ae_codata":    0.00115965218073,
  "residual": 9.1e-12,
  "converged": true,
  "precision_target": 1e-11,
  "ts": 1730000000000
}
```

## `GET|POST /api/benchmark`

Run the full QED benchmark suite.

```json
{
  "precision": "10^-11",
  "residual": 9.1e-12,
  "ae_predicted": 0.001159652181,
  "ae_codata": 0.00115965218073,
  "convergence_rate": "exponential",
  "performance_vs_feyncalc": "72x faster (0.041ms / 6 loops)",
  "loops": 6,
  "timestamp": 1730000000000
}
```

## `POST /api/public/webhook`

External advance/benchmark intake. **HMAC-signed.**

Headers: `x-webhook-signature: <hex hmac-sha256 of body with WEBHOOK_SECRET>`

Body:

```json
{ "kind": "bot_advance", "label": "string", "data": { "any": "json" } }
```

Returns `200` on accept, `401` on bad signature, `422` on invalid payload,
`503` if `WEBHOOK_SECRET` is not set.
