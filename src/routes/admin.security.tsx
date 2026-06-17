import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/compute/roles.functions";
import {
  listSecurityDashboard,
  markAlertRead,
  setQuarantine,
  runHealerNow,
  runSelfTestNow,
} from "@/lib/security.functions";

export const Route = createFileRoute("/admin/security")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Security Operations · Nexus Auto-Healer · KQPL" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSecurityPage,
});

type Dash = Awaited<ReturnType<typeof listSecurityDashboard>>;

function AdminSecurityPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dash, setDash] = useState<Dash | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  const callRoles = useServerFn(getMyRoles);
  const callDash = useServerFn(listSecurityDashboard);
  const callRead = useServerFn(markAlertRead);
  const callQ = useServerFn(setQuarantine);
  const callHeal = useServerFn(runHealerNow);
  const callTest = useServerFn(runSelfTestNow);

  const reload = useCallback(() => {
    callDash({ data: undefined as any })
      .then((d) => setDash(d))
      .catch((e) => setErr(e?.message ?? String(e)));
  }, [callDash]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setAuthed(true);
      callRoles({}).then((r) => {
        setIsAdmin(r.isAdmin);
        if (r.isAdmin) reload();
      });
    });
  }, [navigate, callRoles, reload]);

  async function run(fn: () => Promise<any>, after?: (r: any) => void) {
    setBusy(true); setErr(null);
    try { const r = await fn(); after?.(r); reload(); }
    catch (e: any) { setErr(e?.message ?? String(e)); }
    finally { setBusy(false); }
  }

  if (authed === null) return <main className="p-10 font-mono text-xs text-white/60">Loading…</main>;
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl p-10 text-white">
        <h1 className="text-xl font-bold">Forbidden</h1>
        <p className="mt-2 text-sm text-white/60">Admin role required.</p>
        <Link to="/" className="mt-4 inline-block text-cyan-300 underline">Back</Link>
      </main>
    );
  }

  const unread = (dash?.alerts ?? []).filter((a: any) => !a.read_at).length;
  const criticalFindings = (dash?.findings ?? []).filter((f: any) => f.severity === "critical" && f.status !== "fixed");

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Operations</h1>
          <p className="text-xs text-white/60">Nexus Auto-Healer · audit log · realtime quarantine</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link to="/admin/security/report" className="rounded border border-white/20 bg-white/5 px-3 py-1.5 hover:bg-white/10">
            Full report →
          </Link>
          <button onClick={() => run(() => callTest({ data: undefined as any }), setReport)} disabled={busy}
            className="rounded border border-white/20 bg-white/5 px-3 py-1.5 hover:bg-white/10">
            Run self-test
          </button>
          <button onClick={() => run(() => callHeal({ data: undefined as any }), setReport)} disabled={busy}
            className="rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-cyan-200 hover:bg-cyan-400/20">
            ▶ Run Nexus Healer
          </button>
        </div>

      </header>

      {err && <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{err}</div>}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Stat label="Unread alerts" value={unread} tone={unread > 0 ? "warn" : "ok"} />
        <Stat label="Critical findings" value={criticalFindings.length} tone={criticalFindings.length > 0 ? "crit" : "ok"} />
        <Stat label="Quarantined surfaces" value={(dash?.quarantine ?? []).filter((q: any) => q.active).length} tone="warn" />
        <Stat label="Audit events (100 latest)" value={(dash?.audit ?? []).length} tone="info" />
      </section>

      {report && (
        <section className="rounded border border-white/10 bg-black/40 p-4 text-xs">
          <h2 className="text-sm font-semibold">Latest run</h2>
          <pre className="mt-2 max-h-64 overflow-auto text-[10px] text-white/70">{JSON.stringify(report, null, 2)}</pre>
        </section>
      )}

      <Panel title="Alerts inbox">
        {(dash?.alerts ?? []).length === 0 ? <Empty>No alerts.</Empty> : (
          <ul className="divide-y divide-white/10 text-xs">
            {dash!.alerts.map((a: any) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <SevBadge sev={a.severity} />
                    <span className={a.read_at ? "text-white/50" : "font-semibold"}>{a.title}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/40">{a.source} · {new Date(a.created_at).toLocaleString()}</div>
                  {a.body && <p className="mt-1 text-white/70">{a.body}</p>}
                </div>
                {!a.read_at && (
                  <button onClick={() => run(() => callRead({ data: { id: a.id } }))}
                    className="shrink-0 rounded border border-white/20 px-2 py-1 text-[10px] hover:bg-white/10">
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Quarantine kill-switches">
        <ul className="divide-y divide-white/10 text-xs">
          {(dash?.quarantine ?? []).map((q: any) => (
            <li key={q.key} className="flex items-center justify-between py-2">
              <div>
                <div className="font-mono">{q.key}</div>
                <div className="text-[10px] text-white/40">
                  {q.active ? `🔒 active · ${q.triggered_by ?? ""} · ${q.reason ?? ""}` : "✓ open"}
                </div>
              </div>
              <button
                onClick={() => run(() => callQ({ data: { key: q.key, active: !q.active, reason: q.active ? "admin cleared" : "admin lock" } }))}
                className={`rounded px-3 py-1 text-[10px] ${q.active ? "border border-emerald-400/40 text-emerald-200 hover:bg-emerald-400/10" : "border border-red-400/40 text-red-200 hover:bg-red-400/10"}`}>
                {q.active ? "Release" : "Quarantine"}
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Findings">
        {(dash?.findings ?? []).length === 0 ? <Empty>No findings yet. Run the healer.</Empty> : (
          <ul className="divide-y divide-white/10 text-xs">
            {dash!.findings.map((f: any) => (
              <li key={f.id} className="py-2">
                <div className="flex items-center gap-2">
                  <SevBadge sev={f.severity} />
                  <span className="font-semibold">{f.title}</span>
                  <span className="ml-auto text-[10px] text-white/40">{f.status}</span>
                </div>
                <div className="text-[10px] text-white/40">{f.source} · {f.affected_resource ?? "—"} · {new Date(f.detected_at).toLocaleString()}</div>
                {f.description && <p className="mt-1 text-white/70">{f.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recent audit events">
        {(dash?.audit ?? []).length === 0 ? <Empty>No audit entries.</Empty> : (
          <ul className="divide-y divide-white/10 font-mono text-[10px]">
            {dash!.audit.map((a: any) => (
              <li key={a.id} className="py-1.5">
                <span className="text-white/40">{new Date(a.created_at).toLocaleString()}</span>{" · "}
                <span className="text-cyan-300">{a.table_name}</span>{" · "}
                <span className="text-amber-200">{a.op}</span>{" · "}
                <span className="text-white/60">actor={a.actor_id ?? "system"}</span>{" · "}
                <span className="text-white/60">row={a.row_id ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "ok" | "warn" | "crit" | "info" }) {
  const toneCls = tone === "crit" ? "border-red-500/40 bg-red-500/10 text-red-200"
    : tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
    : tone === "ok" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
    : "border-white/15 bg-white/5 text-white/70";
  return (
    <div className={`rounded border px-3 py-2 ${toneCls}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-white/10 bg-black/30 p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-white/40">{children}</p>;
}
function SevBadge({ sev }: { sev: string }) {
  const cls = sev === "critical" ? "bg-red-500/30 text-red-200"
    : sev === "high" ? "bg-amber-500/30 text-amber-200"
    : sev === "warn" ? "bg-amber-500/20 text-amber-200"
    : sev === "medium" ? "bg-yellow-500/20 text-yellow-200"
    : sev === "info" ? "bg-blue-500/20 text-blue-200"
    : "bg-white/10 text-white/70";
  return <span className={`rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${cls}`}>{sev}</span>;
}
