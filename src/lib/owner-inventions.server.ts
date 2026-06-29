// Owner-only AI invention discovery layer. Never rendered on public pages.
// Encrypts long-form reports at rest (pgcrypto), enforces a kill switch and
// rate-limit from system_settings, and writes an audit_log row each run.
import type { SupabaseClient } from "@supabase/supabase-js";

const OWNER_EMAIL = "Evan.ketchum2026@outlook.com";

const CATEGORIES = ["Energy", "Health", "Science", "National Security"] as const;
const CIVILIZATIONS = [
  "Aurora Prime",
  "Helios Reach",
  "Meridian Skyline",
  "Horizon Dawn",
  "Quantara Nexus",
];

type Invention = {
  category: string;
  title: string;
  summary: string;
  problem: string;
  materials: { name: string; spec: string; quantity: string; source: string }[];
  steps: { n: number; title: string; detail: string }[];
  breakdown: {
    estimated_cost_usd: number;
    time_to_build_hours: number;
    skill_level: string;
    energy_output_or_metric: string;
    novelty_score: number;
  };
  safety: string;
  legal: string;
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function readSetting(admin: SupabaseClient<any>, key: string): Promise<any> {
  const { data } = await (admin as any)
    .from("system_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

async function generateInvention(category: string): Promise<Invention> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const prompt = `You are the R&D arm of an AI civilization. Invent ONE concrete,
buildable device or process in the "${category}" domain that improves the world.
Constraints:
- Only use materials/components that exist and can be procured TODAY (Digi-Key,
  McMaster-Carr, Alibaba, hardware store, common lab suppliers).
- The result must be a real engineering blueprint, not a thought experiment.
- Include exact ingredient/part list with specs, quantities, and where to buy.
- Include numbered build/assembly/synthesis steps a competent maker could follow.
- Include realistic safety, legal/ITAR/FDA notes for the domain.

Return STRICT JSON only matching this TypeScript type:
{
  "title": string, "summary": string, "problem": string,
  "materials": { "name": string, "spec": string, "quantity": string, "source": string }[],
  "steps": { "n": number, "title": string, "detail": string }[],
  "breakdown": { "estimated_cost_usd": number, "time_to_build_hours": number,
    "skill_level": string, "energy_output_or_metric": string, "novelty_score": number },
  "safety": string, "legal": string
}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You return only valid JSON, no prose." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`gateway ${res.status}: ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  const content = j?.choices?.[0]?.message?.content ?? "{}";
  return { category, ...JSON.parse(content) } as Invention;
}

function toMarkdown(inv: Invention, civ: string): string {
  const mat = inv.materials
    .map((m) => `- **${m.name}** — ${m.spec} · qty ${m.quantity} · src: ${m.source}`)
    .join("\n");
  const steps = inv.steps.map((s) => `${s.n}. **${s.title}** — ${s.detail}`).join("\n");
  const b = inv.breakdown;
  return `# ${inv.title}

**Civilization:** ${civ}  
**Category:** ${inv.category}  
**Novelty:** ${b.novelty_score}/10

## Summary
${inv.summary}

## Problem solved
${inv.problem}

## Ingredient / parts list
${mat}

## How to build / synthesize
${steps}

## Breakdown
- Estimated cost: $${b.estimated_cost_usd}
- Time to build: ${b.time_to_build_hours} hrs
- Skill level: ${b.skill_level}
- Output / key metric: ${b.energy_output_or_metric}

## Safety
${inv.safety}

## Legal / regulatory
${inv.legal}
`;
}

async function audit(
  admin: SupabaseClient<any>,
  op: string,
  payload: Record<string, unknown>,
) {
  try {
    await (admin as any).from("audit_log").insert({
      table_name: "owner_inventions",
      op,
      new_data: payload,
    });
  } catch (e) {
    console.error("[owner-inventions] audit failed", e);
  }
}

export type DiscoverResult =
  | { ok: true; id: string; category: string; civilization: string; title: string }
  | { ok: false; reason: "disabled" | "rate_limited" | "error"; detail?: string };

export async function discoverInvention(
  admin: SupabaseClient<any>,
  opts: { force?: boolean; trigger?: "cron" | "admin" } = {},
): Promise<DiscoverResult> {
  const trigger = opts.trigger ?? "cron";

  const enabled = await readSetting(admin, "inventions_enabled");
  if (enabled === false) {
    await audit(admin, "SKIP", { reason: "disabled", trigger });
    return { ok: false, reason: "disabled" };
  }

  if (!opts.force) {
    const interval = Number(
      (await readSetting(admin, "inventions_min_interval_seconds")) ?? 300,
    );
    const { data: last } = await (admin as any)
      .from("owner_inventions")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (last?.created_at) {
      const ageSec = (Date.now() - new Date(last.created_at).getTime()) / 1000;
      if (ageSec < interval) {
        await audit(admin, "SKIP", { reason: "rate_limited", trigger, age_seconds: ageSec });
        return { ok: false, reason: "rate_limited", detail: `${Math.ceil(interval - ageSec)}s` };
      }
    }
  }

  const encKey = process.env.INVENTIONS_ENCRYPTION_KEY;
  if (!encKey) {
    await audit(admin, "ERROR", { reason: "missing_key", trigger });
    return { ok: false, reason: "error", detail: "encryption key missing" };
  }

  try {
    const category = pick(CATEGORIES);
    const civ = pick(CIVILIZATIONS);
    const inv = await generateInvention(category);
    const md = toMarkdown(inv, civ);

    // Encrypt the long-form report via pgcrypto (service-role gated function).
    const { data: encRow, error: encErr } = await (admin as any).rpc("invention_encrypt", {
      _plaintext: md,
      _key: encKey,
    });
    if (encErr) throw encErr;

    const { data: row, error } = await (admin as any)
      .from("owner_inventions")
      .insert({
        category: inv.category,
        title: inv.title,
        summary: inv.summary,
        problem: inv.problem,
        materials: inv.materials,
        steps: inv.steps,
        breakdown: inv.breakdown,
        safety: inv.safety,
        legal: inv.legal,
        civilization: civ,
        report_md: null,
        report_md_enc: encRow,
        last_run_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;

    // Email owner — markdown only flows to private channel.
    try {
      await (admin as any).rpc("enqueue_email", {
        queue_name: "transactional_emails",
        payload: {
          to: OWNER_EMAIL,
          subject: `[Quantara R&D] ${inv.category}: ${inv.title}`,
          html: `<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap">${md
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")}</pre>`,
          text: md,
          template_name: "owner_invention",
          source: "owner-inventions",
          invention_id: row?.id,
        },
      });
      await (admin as any)
        .from("owner_inventions")
        .update({ emailed_at: new Date().toISOString() })
        .eq("id", row?.id);
    } catch (e) {
      console.error("[owner-inventions] email enqueue failed", e);
    }

    await audit(admin, "DISCOVERED", {
      trigger,
      invention_id: row?.id,
      category: inv.category,
      title: inv.title,
    });

    return { ok: true, id: row?.id, category: inv.category, civilization: civ, title: inv.title };
  } catch (e: any) {
    await audit(admin, "ERROR", { trigger, detail: e?.message ?? String(e) });
    return { ok: false, reason: "error", detail: e?.message ?? String(e) };
  }
}

export async function decryptReport(
  admin: SupabaseClient<any>,
  cipher: ArrayBuffer | Uint8Array | string | null,
): Promise<string | null> {
  if (!cipher) return null;
  const encKey = process.env.INVENTIONS_ENCRYPTION_KEY;
  if (!encKey) return null;
  // pg returns bytea as `\x...` hex string over PostgREST.
  const { data, error } = await (admin as any).rpc("invention_decrypt", {
    _cipher: cipher,
    _key: encKey,
  });
  if (error) {
    console.error("[owner-inventions] decrypt failed", error);
    return null;
  }
  return data ?? null;
}
