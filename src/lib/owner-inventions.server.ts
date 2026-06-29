// Owner-only AI invention discovery layer. Never rendered on public pages.
// Generates a real-world buildable blueprint via Lovable AI, stores it
// privately, and emails the report to the owner.
import type { SupabaseClient } from "@supabase/supabase-js";

const OWNER_EMAIL = "Evan.ketchum2026@outlook.com";

const CATEGORIES = [
  "Energy",
  "Health",
  "Science",
  "National Security",
] as const;

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
  "title": string,
  "summary": string,
  "problem": string,
  "materials": { "name": string, "spec": string, "quantity": string, "source": string }[],
  "steps": { "n": number, "title": string, "detail": string }[],
  "breakdown": {
    "estimated_cost_usd": number,
    "time_to_build_hours": number,
    "skill_level": string,
    "energy_output_or_metric": string,
    "novelty_score": number
  },
  "safety": string,
  "legal": string
}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "Lovable-API-Key": key,
    },
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
  const parsed = JSON.parse(content);
  return { category, ...parsed } as Invention;
}

function toMarkdown(inv: Invention, civ: string): string {
  const mat = inv.materials
    .map((m) => `- **${m.name}** — ${m.spec} · qty ${m.quantity} · src: ${m.source}`)
    .join("\n");
  const steps = inv.steps
    .map((s) => `${s.n}. **${s.title}** — ${s.detail}`)
    .join("\n");
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

export async function discoverInvention(admin: SupabaseClient<any>) {
  const category = pick(CATEGORIES);
  const civ = pick(CIVILIZATIONS);
  const inv = await generateInvention(category);
  const md = toMarkdown(inv, civ);

  // Persist privately (admin-only RLS, anon has no GRANT).
  const { data: row, error } = await admin
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
      report_md: md,
    })
    .select("id")
    .single();
  if (error) throw error;

  // Email owner via internal queue (no public page exposure).
  try {
    await admin.rpc("enqueue_email", {
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
    await admin
      .from("owner_inventions")
      .update({ emailed_at: new Date().toISOString() })
      .eq("id", row?.id);
  } catch (e) {
    console.error("[owner-inventions] email enqueue failed", e);
  }

  return { id: row?.id, category: inv.category, civilization: civ, title: inv.title };
}
