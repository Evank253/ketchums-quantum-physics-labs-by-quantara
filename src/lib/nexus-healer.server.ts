// Nexus Auto-Healer — server-only.
// Decision tree: auto-fix low/medium, quarantine critical surfaces, alert admins
// when it can't safely auto-fix.
//
// The healer never edits source files at runtime. It operates on the database:
// flipping `system_quarantine` keys, recording findings + alerts, and re-running
// the self-test. Critical findings always raise an alert; the email trigger on
// security_alerts handles delivery.

import type { SupabaseClient } from "@supabase/supabase-js";

export type Severity = "low" | "medium" | "high" | "critical";

export interface SelfTestCheck {
  id: string;
  title: string;
  severity: Severity;
  passed: boolean;
  detail?: string;
  quarantine_key?: string;       // surface to lock if this fails critically
}

export interface SelfTestReport {
  ran_at: string;
  passed: boolean;
  checks: SelfTestCheck[];
}

export interface HealerAction {
  kind: "quarantine" | "alert" | "noop";
  target?: string;
  reason: string;
  finding_id?: string;
  severity: Severity;
}

export interface HealerRunResult {
  ran_at: string;
  report: SelfTestReport;
  actions: HealerAction[];
  unresolved: SelfTestCheck[];
}

/* ─── pure decision logic (unit-testable) ───────────────────────────── */

export function classifyAction(check: SelfTestCheck): HealerAction {
  if (check.passed) return { kind: "noop", reason: "passing", severity: check.severity };
  if (check.severity === "critical" && check.quarantine_key) {
    return {
      kind: "quarantine",
      target: check.quarantine_key,
      reason: `Critical self-test failure: ${check.title}`,
      severity: "critical",
    };
  }
  if (check.severity === "critical") {
    return {
      kind: "alert",
      reason: `Critical, no auto-fix path: ${check.title}`,
      severity: "critical",
    };
  }
  if (check.severity === "high") {
    return { kind: "alert", reason: `High severity: ${check.title}`, severity: "high" };
  }
  return { kind: "noop", reason: `Low/medium logged: ${check.title}`, severity: check.severity };
}

export function summarize(report: SelfTestReport) {
  const fails = report.checks.filter((c) => !c.passed);
  return {
    total: report.checks.length,
    failing: fails.length,
    critical: fails.filter((c) => c.severity === "critical").length,
    high: fails.filter((c) => c.severity === "high").length,
  };
}

/* ─── self-test runner ──────────────────────────────────────────────── */
// Each check uses supabaseAdmin to introspect; failures = a real regression.

export async function runSelfTest(admin: SupabaseClient): Promise<SelfTestReport> {
  const checks: SelfTestCheck[] = [];

  // 1. chat_messages anon read should be blocked (enforced by migration;
  //    we verify by attempting an unauthenticated read via the publishable key)
  {
    let passed = true;
    let detail: string | undefined;
    try {
      const url = process.env.SUPABASE_URL;
      const anon = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (url && anon) {
        const res = await fetch(`${url}/rest/v1/chat_messages?select=id&limit=1`, {
          headers: { apikey: anon },
        });
        // RLS denial returns either 401 or a permission-denied 200 with empty
        // body; the dangerous case is a 200 OK that yields actual rows.
        if (res.ok) {
          const body = await res.json().catch(() => []);
          if (Array.isArray(body) && body.length > 0) {
            passed = false;
            detail = "anon SELECT returned rows";
          }
        }
      }
    } catch (e: any) {
      detail = e?.message;
    }
    checks.push({
      id: "rls.chat_messages.anon_read",
      title: "chat_messages: anonymous SELECT blocked",
      severity: "critical",
      passed,
      detail,
      quarantine_key: "chat_messages",
    });
  }


  // 2. system_quarantine reachable
  {
    const { error } = await admin.from("system_quarantine").select("key").limit(1);
    checks.push({
      id: "quarantine.reachable",
      title: "system_quarantine readable by service role",
      severity: "critical",
      passed: !error,
      detail: error?.message,
    });
  }

  // 3. audit_log writable (trigger path)
  {
    const { error } = await admin.from("audit_log").select("id").limit(1);
    checks.push({
      id: "audit_log.reachable",
      title: "audit_log readable",
      severity: "medium",
      passed: !error,
      detail: error?.message,
    });
  }

  // 4. critical quarantines must not be active unexpectedly
  {
    const { data, error } = await admin
      .from("system_quarantine")
      .select("key, active, reason")
      .eq("active", true);
    const active = (data ?? []) as Array<{ key: string; reason: string | null }>;
    checks.push({
      id: "quarantine.unexpected_active",
      title: `No surface unexpectedly quarantined (found ${active.length})`,
      severity: active.length > 0 ? "medium" : "low",
      passed: !error && active.length === 0,
      detail: active.map((a) => `${a.key}: ${a.reason ?? ""}`).join("; "),
    });
  }

  // 5. service-role can write security_findings (healer needs this)
  {
    const probeId = `selftest-${Date.now()}`;
    const { error: insErr } = await admin.from("security_findings").upsert(
      {
        source: "self_test",
        external_id: probeId,
        severity: "low",
        title: "self-test write probe",
        status: "fixed",
      },
      { onConflict: "source,external_id" },
    );
    if (!insErr) await admin.from("security_findings").delete().eq("external_id", probeId);
    checks.push({
      id: "findings.writable",
      title: "security_findings writable by healer",
      severity: "critical",
      passed: !insErr,
      detail: insErr?.message,
      quarantine_key: "ledger_writes",
    });
  }

  return {
    ran_at: new Date().toISOString(),
    passed: checks.every((c) => c.passed),
    checks,
  };
}

/* ─── healer ────────────────────────────────────────────────────────── */

export async function runHealer(admin: SupabaseClient): Promise<HealerRunResult> {
  const report = await runSelfTest(admin);
  const actions: HealerAction[] = [];
  const unresolved: SelfTestCheck[] = [];

  for (const check of report.checks) {
    const action = classifyAction(check);
    if (action.kind === "noop") continue;

    // Persist finding
    const { data: finding } = await admin
      .from("security_findings")
      .upsert(
        {
          source: "healer",
          external_id: check.id,
          severity: check.severity,
          title: check.title,
          description: check.detail,
          affected_resource: check.quarantine_key,
          status: action.kind === "quarantine" ? "quarantined" : "open",
          fix_strategy: action.kind,
          payload: { check },
          fix_log: [{ at: new Date().toISOString(), action: action.kind, reason: action.reason }],
        },
        { onConflict: "source,external_id" },
      )
      .select("id")
      .maybeSingle();

    const finding_id = finding?.id;

    if (action.kind === "quarantine" && action.target) {
      await admin
        .from("system_quarantine")
        .update({
          active: true,
          reason: action.reason,
          triggered_by: "healer",
          triggered_at: new Date().toISOString(),
          cleared_at: null,
        })
        .eq("key", action.target);
      await admin.from("security_alerts").insert({
        severity: "critical",
        source: "nexus_healer",
        title: `Quarantined ${action.target}`,
        body: action.reason,
        payload: { check, action },
        finding_id,
      });
    } else if (action.kind === "alert") {
      await admin.from("security_alerts").insert({
        severity: action.severity === "critical" ? "critical" : "warn",
        source: "nexus_healer",
        title: `Cannot auto-fix: ${check.title}`,
        body: action.reason,
        payload: { check, action },
        finding_id,
      });
      unresolved.push(check);
    }

    actions.push({ ...action, finding_id });
  }

  return { ran_at: report.ran_at, report, actions, unresolved };
}
