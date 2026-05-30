// HMAC-verified intake for external bot/advance reports.
// External callers POST signed JSON; verified payloads are echoed back so the
// frontend ledger can mirror them (storage is client-side localStorage).
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

const PayloadSchema = z.object({
  kind: z.enum(["benchmark", "bot_advance", "unlock", "kernel"]),
  label: z.string().min(1).max(256),
  data: z.record(z.string(), z.unknown()).optional(),
});

function verify(sig: string | null, body: string, secret: string): boolean {
  if (!sig) return false;
  try {
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.WEBHOOK_SECRET;
        if (!secret) {
          return new Response("Webhook not configured", { status: 503 });
        }
        const body = await request.text();
        const sig = request.headers.get("x-webhook-signature");
        if (!verify(sig, body, secret)) {
          return new Response("Invalid signature", { status: 401 });
        }
        let json: unknown;
        try {
          json = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const parsed = PayloadSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json(
            { ok: false, error: parsed.error.flatten() },
            { status: 422 },
          );
        }
        return Response.json({
          ok: true,
          accepted: { ...parsed.data, ts: Date.now() },
        });
      },
    },
  },
});
