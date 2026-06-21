import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/compute/roles.functions";
import { getCronStatus, triggerCronTask } from "@/lib/cron-monitor.functions";

export const Route = createFileRoute("/admin/cron")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Cron Monitor · Scheduled Jobs · KQPL" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CronMonitorPage,
});

type Status = Awaited<ReturnType<typeof getCronStatus>>;

const TASKS = [
  { id: "data-cleaner", label: "Data cleaner batch", desc: "Dedupe, normalize, warmup cache, mint reward." },
  { id: "wiz-sync", label: "Wiz findings sync", desc: "Pull latest issues from Wiz into security_findings." },
  { id: "healer", label: "Nexus auto-healer", desc: "Self-test + quarantine surface decisions." },
  { id: "self-test", label: "Security self-test", desc: "Read-only diagnostic report." },
] as const;

function CronMonitorPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  const callRoles = useServerFn(getMyRoles);
  const callStatus = useServerFn(getCronStatus);
  const callTrigger = useServerFn(triggerCronTask);

  const reload = useCallback(() => {
    callStatus({ data: undefined as any }).then(setStatus).catch((e) => setErr(e?.message ?? String(e)));
  }, [callStatus]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setAuthed(true);
      callRoles({}).then((r) => { setIsAdmin(r.isAdmin); if (r.isAdmin) reload(); });
    });
  }, [navigate, callRoles, reload]);

  async function trigger(task: typeof TASKS[number]["id"]) {
    setBusy(task); setErr(null);
    try {
      const r = await callTrigger({ data: { task } });
      setLastRun(r);
      reload();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
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

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 text-white">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cron Monitor</h1>
          <p className="text-xs text-white/60">Scheduled jobs · run history · on-demand triggers</p>
        </div>
        <button onClick={reload} className="rounded border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10">Refresh</button>
      </header>

      {err && <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{err}</div>}

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {TASKS.map((t) => (
          <div key={t.id} className="rounded border border-white/10 bg-black/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="mt-1 text-[11px] text-white/55">{t.desc}</div>
              </div>
              <button
                disabled={busy === t.id}
                onClick={() => trigger(t.id)}
                className="shrink-0 rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-400/20 disabled:opacity-50">
                {busy === t.id ? "Running…" : "Run now"}
              </button>
            </div>
          </div>
        ))}
      </section>

      {lastRun && (
        <section className="rounded border border-white/10 bg-black/40 p-4 text-xs">
          <h2 className="text-sm font-semibold">Last triggered: {lastRun.task}</h2>
          <pre className="mt-2 max-h-64 overflow-auto text-[10px] text-white/70">{JSON.stringify(lastRun.result, null, 2)}</pre>
        </section>
      )}

      <section className="rounded border border-white/10 bg-black/30 p-4">
        <h2 className="mb-2 text-sm font-semibold">Scheduled jobs ({status?.jobs.length ?? 0})</h2>
        {status?.jobsError && <p className="text-[11px] text-amber-300">pg_cron not reachable: {status.jobsError}</p>}
        {!status?.jobs.length ? (
          <p className="text-xs text-white/40">No pg_cron jobs scheduled. Use "Run now" above for on-demand triggers.</p>
        ) : (
          <table className="w-full text-[11px]">
            <thead className="text-left text-white/40">
              <tr><th>Job</th><th>Schedule</th><th>Active</th></tr>
            </thead>
            <tbody>
              {status.jobs.map((j: any) => (
                <tr key={j.jobid} className="border-t border-white/5">
                  <td className="py-1.5 font-mono">{j.jobname}</td>
                  <td className="font-mono text-cyan-300">{j.schedule}</td>
                  <td>{j.active ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded border border-white/10 bg-black/30 p-4">
        <h2 className="mb-2 text-sm font-semibold">Recent runs ({status?.runs.length ?? 0})</h2>
        {!status?.runs.length ? <p className="text-xs text-white/40">No run history.</p> : (
          <ul className="divide-y divide-white/10 text-[11px]">
            {status.runs.map((r: any) => (
              <li key={`${r.jobid}-${r.runid}`} className="flex items-center justify-between py-1.5 font-mono">
                <span className={r.status === "succeeded" ? "text-emerald-300" : r.status === "failed" ? "text-red-300" : "text-white/70"}>
                  {r.status}
                </span>
                <span className="text-white/50">job#{r.jobid}</span>
                <span className="text-white/40">{r.start_time ? new Date(r.start_time).toLocaleString() : "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
