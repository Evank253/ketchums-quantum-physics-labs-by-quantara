import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getSecurityReport, emailSecurityReport } from "@/lib/security-report.functions";

export const Route = createFileRoute("/admin/security/report")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Security Report · KQPL Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReportPage,
});

type Report = Awaited<ReturnType<typeof getSecurityReport>>;

function ReportPage() {
  const nav = useNavigate();
  const [data, setData] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const fetchReport = useServerFn(getSecurityReport);
  const sendEmail = useServerFn(emailSecurityReport);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: s }) => {
      if (!s.session) { nav({ to: "/auth" }); return; }
      fetchReport().then(setData).catch((e) => setErr(e?.message ?? String(e)));
    });
  }, [nav, fetchReport]);

  if (err) return <main className="p-10 text-red-300">{err}</main>;
  if (!data) return <main className="p-10 text-white/55">Loading report…</main>;

  const dat: any = data.dat;
  const balance = dat?.balance ? (Number(dat.balance) / 10 ** (dat.decimals ?? 18)).toFixed(4) : "—";

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 text-white">
      <header className="flex items-baseline justify-between">
        <div>
          <Link to="/admin/security" className="font-mono text-[10px] uppercase tracking-widest text-cyan-300/70 hover:text-cyan-200">← Security Ops</Link>
          <h1 className="mt-2 text-2xl font-bold">Security Report</h1>
          <p className="text-[11px] text-white/50">Generated {new Date(data.generatedAt).toLocaleString()}</p>
        </div>
        <button
          onClick={() => sendEmail({}).then((r) => setMsg(`Queued → ${r.queuedTo}`)).catch((e) => setErr(e.message))}
          className="rounded border border-cyan-400/40 bg-cyan-400/10 px-3 py-1.5 text-xs text-cyan-100 hover:bg-cyan-400/20">
          Email me this report
        </button>
      </header>
      {msg && <div className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">{msg}</div>}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Findings (total)" value={data.findings.total} />
        <Stat label="Critical" value={data.findings.bySeverity.critical} tone="crit" />
        <Stat label="High" value={data.findings.bySeverity.high} tone="warn" />
        <Stat label="Wiz-imported" value={data.findings.wiz} />
      </section>

      <Panel title="DAT chain health">
        {dat?.ok ? (
          <ul className="space-y-1 text-xs">
            <li>Contract: <span className="font-mono text-cyan-200">{dat.contract}</span> ({dat.symbol})</li>
            <li>Treasury balance: <span className="font-mono">{balance} {dat.symbol}</span></li>
            <li>Latest block: <span className="font-mono">{dat.blockNumber}</span></li>
            <li>Recent confirmed mints: {dat.recentMints?.length ?? 0}</li>
          </ul>
        ) : dat?.configured === false ? (
          <p className="text-xs text-amber-200">Minter not fully configured. Missing: {(dat.missing ?? []).join(", ")}</p>
        ) : (
          <p className="text-xs text-red-200">Chain error: {dat?.error ?? "unknown"}</p>
        )}
      </Panel>

      <Panel title="Data cleaner — last 10 batches">
        {data.cleaner.length === 0 ? <Empty>No batches yet.</Empty> : (
          <ul className="space-y-1 text-[11px] font-mono text-white/75">
            {data.cleaner.map((c: any) => (
              <li key={c.id}>
                {new Date(c.created_at).toLocaleString()} · deduped {c.payload?.dedupedChat ?? 0} · normalised {c.payload?.normalisedFeedback ?? 0} · pruned {c.payload?.prunedStuckJobs ?? 0} · warmed {c.payload?.warmedCache ?? 0}
                {c.payload?.mint?.ok && <span className="text-emerald-300"> · minted ✓</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Wiz sync log">
        {data.wizSync.length === 0 ? <Empty>No Wiz syncs yet. Add WIZ_API_KEY + WIZ_API_ENDPOINT to enable.</Empty> : (
          <ul className="space-y-1 text-[11px] font-mono text-white/75">
            {data.wizSync.map((w: any) => (
              <li key={w.id}>{new Date(w.created_at).toLocaleString()} · {w.subject} · {JSON.stringify(w.payload)}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recent findings (25)">
        <ul className="divide-y divide-white/10 text-xs">
          {data.findings.recent.map((f: any, i: number) => (
            <li key={i} className="py-1.5">
              <span className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase">{f.severity}</span>
              <span className="font-semibold">{f.title}</span>
              <span className="ml-2 text-[10px] text-white/40">{f.source} · {f.status}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "crit" | "warn" }) {
  const cls = tone === "crit" ? "border-red-500/40 bg-red-500/10 text-red-200"
    : tone === "warn" ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
    : "border-white/15 bg-white/5 text-white/80";
  return (
    <div className={`rounded border px-3 py-2 ${cls}`}>
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
