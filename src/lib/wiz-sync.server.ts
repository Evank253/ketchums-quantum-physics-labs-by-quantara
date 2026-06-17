// Wiz security findings sync — server-only.
// If WIZ_API_KEY is not present, the sync no-ops cleanly so the cron stays harmless.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type WizIssue = {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  title?: string;
  name?: string;
  description?: string;
  resource?: { name?: string; type?: string };
  status?: string;
};

const SEV_MAP: Record<string, string> = {
  LOW: "low", MEDIUM: "medium", HIGH: "high", CRITICAL: "critical",
  low: "low", medium: "medium", high: "high", critical: "critical",
};

export async function syncWizFindings(): Promise<{ ok: boolean; imported: number; reason?: string }> {
  const apiKey = process.env.WIZ_API_KEY;
  const endpoint = process.env.WIZ_API_ENDPOINT;
  if (!apiKey || !endpoint) {
    await supabaseAdmin.from("admin_logs").insert({
      kind: "security_wiz_sync",
      subject: "skipped",
      payload: { reason: "WIZ_API_KEY or WIZ_API_ENDPOINT not configured" },
    });
    return { ok: false, imported: 0, reason: "WIZ_API_KEY/WIZ_API_ENDPOINT not configured" };
  }

  let issues: WizIssue[] = [];
  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`wiz http ${res.status}`);
    const body = await res.json();
    issues = Array.isArray(body) ? body : (body?.issues ?? body?.data ?? []);
  } catch (e: any) {
    await supabaseAdmin.from("admin_logs").insert({
      kind: "security_wiz_sync",
      subject: "fetch_failed",
      payload: { error: e?.message ?? String(e) },
    });
    return { ok: false, imported: 0, reason: e?.message ?? String(e) };
  }

  let imported = 0;
  for (const i of issues) {
    const severity = SEV_MAP[i.severity] ?? "medium";
    const title = i.title || i.name || `Wiz issue ${i.id}`;
    const { error } = await supabaseAdmin
      .from("security_findings")
      .upsert({
        source: "wiz",
        external_id: i.id,
        severity,
        title,
        description: i.description ?? null,
        affected_resource: i.resource?.name ?? null,
        status: i.status === "RESOLVED" ? "fixed" : "open",
        payload: i as any,
      }, { onConflict: "source,external_id" });
    if (!error) imported++;
  }
  await supabaseAdmin.from("admin_logs").insert({
    kind: "security_wiz_sync",
    subject: "completed",
    payload: { imported, total: issues.length },
  });
  return { ok: true, imported };
}
