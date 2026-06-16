import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  submitComputeJob,
  listMyJobs,
  getMyUsage,
  listMyRunCards,
} from "@/lib/compute/jobs.functions";
import { getMyRoles } from "@/lib/compute/roles.functions";
import { issueApiKey, listApiKeys, revokeApiKey, rotateApiKey } from "@/lib/compute/api-keys.functions";
import { getMySubscription } from "@/lib/subscriptions.functions";
import { QED_MODEL_ID } from "@/lib/compute/engines/qed";
import { formatSigma } from "@/lib/compute/sigma";

export const Route = createFileRoute("/institution")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Institutional Dashboard · Ketchum's Quantum Physics Labs" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Submit compute jobs, view run cards, manage API keys." },
    ],
  }),
  component: InstitutionPage,
});

type Tab = "submit" | "history" | "runs" | "usage" | "keys" | "subscription";

const QUOTA: Record<string, number | "unlimited"> = {
  free: 10,
  pro: "unlimited",
  institution: "unlimited",
  admin: "unlimited",
};

function InstitutionPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [isInstitution, setIsInstitution] = useState(false);
  const [tab, setTab] = useState<Tab>("submit");

  const callRoles = useServerFn(getMyRoles);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setAuthed(true);
      setEmail(data.session.user.email ?? null);
      callRoles({}).then((r) => {
        setRoles(r.roles);
        setIsInstitution(r.isInstitution || r.isAdmin);
      }).catch(() => {});
    });
  }, [navigate, callRoles]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (authed === null) {
    return <main className="mx-auto max-w-4xl p-10 font-mono text-xs text-white/60">Loading…</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-300/70 hover:text-cyan-200">
            ← Ketchum's Quantum Physics Labs
          </Link>
          <h1 className="mt-2 text-2xl font-light text-cyan-100">Institutional Dashboard</h1>
          <p className="mt-1 text-xs text-white/55">
            Compute jobs · σ-deviation pipeline · immutable run cards · API keys.
            <span className="ml-2 rounded-sm border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/60">
              {roles.length > 0 ? roles.join(" · ") : "free"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-white/55">{email}</span>
          <button onClick={signOut} className="rounded-sm border border-white/15 bg-black/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 hover:bg-white/10">
            Sign out
          </button>
        </div>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["submit", "Submit job"],
            ["history", "Job history"],
            ["runs", "Run cards"],
            ["usage", "Usage"],
            ["keys", "API keys"],
            ["subscription", "Subscription"],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${
              tab === id
                ? "border-cyan-300/60 bg-cyan-400/20 text-cyan-100"
                : "border-white/15 bg-black/40 text-white/60 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "submit" && <SubmitTab />}
      {tab === "history" && <HistoryTab />}
      {tab === "runs" && <RunCardsTab />}
      {tab === "usage" && <UsageTab roles={roles} />}
      {tab === "keys" && <KeysTab isInstitution={isInstitution} />}
      {tab === "subscription" && <SubscriptionTab roles={roles} />}
    </main>
  );
}

// ─── Submit Job ────────────────────────────────────────────────────────────
function SubmitTab() {
  const callSubmit = useServerFn(submitComputeJob);
  const [model] = useState(QED_MODEL_ID);
  const [loops, setLoops] = useState(5);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setErr(null); setBusy(true); setResult(null);
    try {
      const r = await callSubmit({ data: { model, inputs: { loops } } });
      setResult(r);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-sm border border-white/10 bg-black/40 p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Submit compute job</h2>
      <p className="mt-1 text-xs text-white/55">
        Runs deterministically on the server, compares to CODATA 2022 + published literature,
        records an immutable run card with input/output SHA-256 hashes.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <div className="font-mono text-[9px] uppercase tracking-widest text-white/60">Model</div>
          <div className="mt-1 rounded-sm border border-white/15 bg-black/60 px-3 py-2 font-mono text-xs text-cyan-100">
            {model}
          </div>
        </label>
        <label className="block">
          <div className="font-mono text-[9px] uppercase tracking-widest text-white/60">Loop order (1–6)</div>
          <input
            type="number"
            min={1}
            max={6}
            value={loops}
            onChange={(e) => setLoops(Number(e.target.value))}
            className="mt-1 w-full rounded-sm border border-white/15 bg-black/60 px-3 py-2 font-mono text-xs text-white outline-none focus:border-cyan-300/60"
          />
        </label>
      </div>

      <button
        onClick={go}
        disabled={busy}
        className="mt-5 rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
      >
        {busy ? "Computing…" : "Run job"}
      </button>

      {err && (
        <div className="mt-4 rounded-sm border border-red-400/40 bg-red-500/5 p-3 text-[11px] text-red-200">{err}</div>
      )}
      {result?.ok && (
        <div className="mt-4 rounded-sm border border-emerald-400/30 bg-emerald-500/5 p-4 text-[11px] text-emerald-100">
          <div className="font-mono uppercase tracking-[0.2em] text-emerald-200">Complete</div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Verdict" value={result.verdict} />
            <Stat label="Deviation" value={formatSigma(result.sigma)} />
            <Stat label="Job ID" value={result.jobId.slice(0, 8) + "…"} />
            <Stat label="Run card" value={result.runId} />
          </div>
          <div className="mt-3 text-emerald-300/70">
            Result is <strong>{formatSigma(result.sigma)}</strong> of the CODATA 2022 reference value
            (combined uncertainty in quadrature). Open the Run Cards tab for the immutable record.
          </div>
        </div>
      )}
      {result?.ok === false && (
        <div className="mt-4 rounded-sm border border-amber-400/40 bg-amber-500/5 p-3 text-[11px] text-amber-200">
          Job failed: {result.error}
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-white/10 bg-black/40 p-2">
      <div className="font-mono text-[8px] uppercase tracking-widest text-white/55">{label}</div>
      <div className="mt-0.5 font-mono text-xs text-white">{value}</div>
    </div>
  );
}

// ─── Job History ───────────────────────────────────────────────────────────
function HistoryTab() {
  const callList = useServerFn(listMyJobs);
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(() => {
    callList({ data: { limit: 100 } })
      .then((r) => setRows(r.jobs ?? []))
      .catch((e) => setErr(e?.message ?? String(e)));
  }, [callList]);

  useEffect(() => { reload(); }, [reload]);

  return (
    <section className="rounded-sm border border-white/10 bg-black/40 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Job history</h2>
        <button onClick={reload} className="rounded-sm border border-white/15 bg-black/40 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-white/60 hover:bg-white/10">
          Refresh
        </button>
      </div>
      {err && <div className="mb-3 text-[11px] text-red-300">{err}</div>}
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[11px] text-white/80">
          <thead className="text-left text-[9px] uppercase tracking-widest text-white/50">
            <tr>
              <th className="py-2">When</th>
              <th>Model</th>
              <th>Status</th>
              <th>Verdict</th>
              <th>σ</th>
              <th>Job ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-4 text-white/40">No jobs yet.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.model}</td>
                <td>{r.status}</td>
                <td className={r.verdict === "PASS" ? "text-emerald-300" : r.verdict === "FAIL" ? "text-red-300" : "text-amber-300"}>
                  {r.verdict ?? "—"}
                </td>
                <td>{r.sigma != null ? formatSigma(Number(r.sigma)) : "—"}</td>
                <td className="text-white/50">{r.id.slice(0, 8)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Run Cards ─────────────────────────────────────────────────────────────
function RunCardsTab() {
  const callList = useServerFn(listMyRunCards);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    callList({ data: { limit: 100 } }).then((r) => setRows(r.runCards ?? [])).catch(() => {});
  }, [callList]);

  return (
    <section className="rounded-sm border border-white/10 bg-black/40 p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Immutable run cards</h2>
      <p className="mt-1 text-xs text-white/55">
        Append-only: even backend admin code cannot edit or delete these rows (enforced by a DB trigger).
      </p>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <div className="text-xs text-white/40">No run cards yet — submit a job.</div>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-sm border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-white/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-cyan-200">{r.run_id}</span>
              <span className="text-white/40">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              <div><span className="text-white/50">input_hash:</span> {r.input_hash}</div>
              <div><span className="text-white/50">output_hash:</span> {r.output_hash}</div>
              <div><span className="text-white/50">backend:</span> {r.backend_version}</div>
              <div><span className="text-white/50">job:</span> {r.job_id.slice(0, 8)}…</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Usage ─────────────────────────────────────────────────────────────────
function UsageTab({ roles }: { roles: string[] }) {
  const callUsage = useServerFn(getMyUsage);
  const [data, setData] = useState<{ periodStart: string; runsCount: number } | null>(null);
  useEffect(() => { callUsage({}).then(setData).catch(() => {}); }, [callUsage]);

  const tier = roles.includes("admin") ? "admin"
    : roles.includes("institution") ? "institution"
    : roles.includes("pro") ? "pro"
    : "free";
  const quota = QUOTA[tier];

  return (
    <section className="rounded-sm border border-white/10 bg-black/40 p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Usage this period</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat label="Period start" value={data?.periodStart ?? "—"} />
        <Stat label="Runs" value={String(data?.runsCount ?? 0)} />
        <Stat label="Quota" value={typeof quota === "number" ? `${quota} / month` : "unlimited"} />
      </div>
    </section>
  );
}

// ─── API Keys ──────────────────────────────────────────────────────────────
function KeysTab({ isInstitution }: { isInstitution: boolean }) {
  const callList = useServerFn(listApiKeys);
  const callIssue = useServerFn(issueApiKey);
  const callRevoke = useServerFn(revokeApiKey);
  const callRotate = useServerFn(rotateApiKey);
  const [keys, setKeys] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [issued, setIssued] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(() => {
    callList({}).then((r) => setKeys(r.keys ?? [])).catch(() => {});
  }, [callList]);
  useEffect(() => { reload(); }, [reload]);

  async function issue() {
    setErr(null); setIssued(null);
    try {
      const r = await callIssue({ data: { label } });
      setIssued(r.apiKey);
      setLabel("");
      reload();
    } catch (e: any) { setErr(e?.message ?? String(e)); }
  }
  async function revoke(id: string) {
    await callRevoke({ data: { id } });
    reload();
  }
  async function rotate(id: string) {
    setErr(null); setIssued(null);
    try {
      const r = await callRotate({ data: { id } });
      setIssued(r.apiKey);
      reload();
    } catch (e: any) { setErr(e?.message ?? String(e)); }
  }

  if (!isInstitution) {
    return (
      <section className="rounded-sm border border-amber-300/30 bg-amber-500/5 p-5 text-[11px] text-amber-200">
        API keys are available on the <strong>institution</strong> plan. Upgrade from the Subscription tab.
      </section>
    );
  }

  return (
    <section className="rounded-sm border border-white/10 bg-black/40 p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">API keys</h2>
      <p className="mt-1 text-xs text-white/55">Issued once. Only the SHA-256 hash is stored — we cannot recover lost keys. Rotation revokes the old key and issues a new one with the same label.</p>

      <div className="mt-4 flex gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="label (e.g. 'lab cluster')"
          className="flex-1 rounded-sm border border-white/15 bg-black/60 px-3 py-2 font-mono text-xs text-white outline-none focus:border-cyan-300/60"
        />
        <button onClick={issue} disabled={!label} className="rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50">
          Issue key
        </button>
      </div>

      {err && <div className="mt-3 text-[11px] text-red-300">{err}</div>}
      {issued && (
        <div className="mt-3 rounded-sm border border-emerald-400/40 bg-emerald-500/5 p-3 font-mono text-[11px] text-emerald-100">
          <div className="uppercase tracking-[0.2em]">Save this key now — it will not be shown again</div>
          <code className="mt-2 block break-all text-emerald-50">{issued}</code>
        </div>
      )}

      <div className="mt-5 space-y-2">
        {keys.length === 0 && <div className="text-xs text-white/40">No keys yet.</div>}
        {keys.map((k) => (
          <div key={k.id} className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-white/10 bg-black/50 p-3 font-mono text-[11px] text-white/80">
            <div>
              <div className="text-cyan-200">{k.label}</div>
              <div className="text-[9px] text-white/40">
                created {new Date(k.created_at).toLocaleDateString()}
                {k.revoked_at ? ` · revoked ${new Date(k.revoked_at).toLocaleDateString()}` : ""}
              </div>
            </div>
            {!k.revoked_at && (
              <div className="flex gap-2">
                <button onClick={() => rotate(k.id)} className="rounded-sm border border-cyan-300/40 bg-cyan-500/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-cyan-200 hover:bg-cyan-500/20">
                  Rotate
                </button>
                <button onClick={() => revoke(k.id)} className="rounded-sm border border-red-400/40 bg-red-500/10 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-red-200 hover:bg-red-500/20">
                  Revoke
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Subscription ──────────────────────────────────────────────────────────
function SubscriptionTab({ roles }: { roles: string[] }) {
  const callSub = useServerFn(getMySubscription);
  const [sub, setSub] = useState<any>(null);
  useEffect(() => { callSub({}).then(setSub).catch(() => {}); }, [callSub]);

  const trialMs = sub?.trialEndsAt ? new Date(sub.trialEndsAt).getTime() - Date.now() : 0;
  const trialDays = Math.max(0, Math.ceil(trialMs / 86400000));

  return (
    <section className="rounded-sm border border-white/10 bg-black/40 p-5">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">Subscription</h2>
      <div className="mt-3 grid gap-2 text-xs text-white/65 sm:grid-cols-4">
        <Stat label="Plan" value={sub?.plan ?? "—"} />
        <Stat label="Status" value={sub?.allowed ? "active" : "blocked"} />
        <Stat label="Runs used" value={`${sub?.runsUsed ?? 0} / ${sub?.runsLimit === -1 ? "∞" : (sub?.runsLimit ?? 0)}`} />
        <Stat label="Trial left" value={sub?.plan === "trial" ? `${trialDays}d` : "—"} />
      </div>
      {sub && !sub.allowed && (
        <div className="mt-4 rounded-sm border border-amber-300/40 bg-amber-500/10 p-3 text-[11px] text-amber-100">
          {sub.reason || "Quota exceeded."}
        </div>
      )}
      <div className="mt-5">
        <Link to="/pricing" className="inline-block rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25">
          View pricing & upgrade →
        </Link>
        {roles.includes("admin") && (
          <Link to="/admin/logs" className="ml-2 inline-block rounded-sm border border-white/20 bg-black/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/80 hover:bg-white/10">
            Admin logs →
          </Link>
        )}
      </div>
    </section>
  );
}
