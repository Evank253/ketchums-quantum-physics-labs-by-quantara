import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/compute/roles.functions";
import { runAnnexBatch, listAnnexRuns, listAdminLogs } from "@/lib/annex.functions";

export const Route = createFileRoute("/admin/logs")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Logs · KQPL" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const callRoles = useServerFn(getMyRoles);
  const callRun = useServerFn(runAnnexBatch);
  const callAnnex = useServerFn(listAnnexRuns);
  const callLogs = useServerFn(listAdminLogs);

  const [annex, setAnnex] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(() => {
    Promise.all([callAnnex({ data: {} }), callLogs({ data: {} })])
      .then(([a, l]) => { setAnnex(a.runs ?? []); setLogs(l.logs ?? []); })
      .catch((e) => setErr(e?.message ?? String(e)));
  }, [callAnnex, callLogs]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate({ to: "/auth" }); return; }
      setAuthed(true);
      callRoles({}).then((r) => {
        setIsAdmin(r.isAdmin);
        if (r.isAdmin) reload();
      }).catch(() => {});
    });
  }, [navigate, callRoles, reload]);

  async function rerunAnnex() {
    setBusy(true); setErr(null);
    try { await callRun({ data: undefined as any }); reload(); }
    catch (e: any) { setErr(e?.message ?? String(e)); }
    finally { setBusy(false); }
  }

  if (authed === null) return <main className="p-10 font-mono text-xs text-white/60">Loading…</main>;
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl p-10">
        <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-300/70">← Home</Link>
        <h1 className="mt-3 text-xl text-cyan-100">Admin only</h1>
        <p className="mt-2 text-sm text-white/65">You don't have access to this page.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8 border-b border-white/10 pb-6">
        <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-300/70 hover:text-cyan-200">
          ← Home
        </Link>
        <h1 className="mt-2 text-2xl font-light text-cyan-100">Admin Logs</h1>
        <p className="mt-1 text-xs text-white/55">
          Annex live-re-runs · auto-mint events · CERN dispatch queue · subscription changes.
        </p>
      </header>

      <section className="mb-8 rounded-sm border border-white/10 bg-black/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Math annex live-rerun</h2>
            <p className="mt-1 text-xs text-white/55">Runs every registered theory through the engine and logs sigma + verdict.</p>
          </div>
          <button
            onClick={rerunAnnex}
            disabled={busy}
            className="rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
          >
            {busy ? "Running…" : "Re-run annex"}
          </button>
        </div>
        {err && <div className="mt-3 text-[11px] text-red-300">{err}</div>}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Annex runs ({annex.length})</h2>
        <div className="space-y-2">
          {annex.map((r) => (
            <div key={r.id} className="rounded-sm border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-white/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-cyan-200">{r.theory_name}</span>
                <span className={`rounded-sm px-2 py-0.5 text-[9px] uppercase tracking-widest ${
                  r.verdict === "PASS" ? "bg-emerald-500/20 text-emerald-200"
                  : r.verdict === "REVIEW" ? "bg-amber-500/20 text-amber-200"
                  : "bg-red-500/20 text-red-200"
                }`}>{r.verdict}</span>
              </div>
              <div className="mt-1 text-[10px] text-white/55">
                σ = {r.sigma?.toExponential?.(2) ?? "—"} · engine = {r.engine_value} · ref = {r.reference_value}
              </div>
              <div className="text-[9px] text-white/35">{new Date(r.created_at).toLocaleString()}</div>
            </div>
          ))}
          {annex.length === 0 && <div className="text-xs text-white/40">No annex runs yet. Click "Re-run annex".</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Admin feed ({logs.length})</h2>
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="rounded-sm border border-white/10 bg-black/50 p-3 font-mono text-[10px] text-white/75">
              <div className="flex items-center justify-between">
                <span className="text-cyan-200">{l.kind}</span>
                <span className="text-white/40">{new Date(l.created_at).toLocaleString()}</span>
              </div>
              {l.subject && <div className="mt-1 text-white/60">{l.subject}</div>}
              <pre className="mt-1 overflow-x-auto text-[9px] text-white/55">{JSON.stringify(l.payload, null, 2)}</pre>
            </div>
          ))}
          {logs.length === 0 && <div className="text-xs text-white/40">No log entries.</div>}
        </div>
      </section>
    </main>
  );
}
