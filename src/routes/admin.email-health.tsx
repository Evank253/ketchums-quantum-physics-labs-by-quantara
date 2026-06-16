import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/email-health")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Email Health · KQPL" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: EmailHealthPage,
});

function EmailHealthPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) {
        setAuthed(false);
        navigate({ to: "/auth" });
        return;
      }
      setAuthed(true);
      const { data: adm } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!adm);
    });
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/lovable/email/health", { cache: "no-store" });
        const j = await r.json();
        if (!cancelled) setHealth(j);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? String(e));
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [isAdmin, tick]);

  if (authed === null) return <main className="p-6 text-sm">Checking session…</main>;
  if (!isAdmin) return <main className="p-6 text-sm text-red-500">Admins only.</main>;

  const counts = health?.last_24h?.by_status ?? {};
  const ok = !!health?.ok;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 text-sm">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Email health</h1>
          <p className="text-muted-foreground">Live 24h send stats, queue and DLQ status, registered templates.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTick((t) => t + 1)} className="rounded border border-border px-3 py-1.5">Refresh</button>
          <Link to="/admin/logs" className="rounded border border-border px-3 py-1.5">Admin logs</Link>
        </div>
      </header>

      {err && <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-red-300">{err}</div>}

      <section className="rounded-lg border border-border p-4">
        <div className="flex items-center gap-3">
          <span className={`inline-block size-3 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
          <span className="font-medium">{ok ? "Healthy" : "Attention needed"}</span>
          {health?.checked_at && (
            <span className="text-xs text-muted-foreground">checked {new Date(health.checked_at).toLocaleTimeString()}</span>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Unique 24h" value={health?.last_24h?.unique_emails ?? "—"} />
        <Stat label="Sent" value={counts.sent ?? 0} tone="ok" />
        <Stat label="DLQ" value={counts.dlq ?? 0} tone={(counts.dlq ?? 0) > 0 ? "bad" : "ok"} />
        <Stat label="Suppressed (total)" value={health?.suppressed_total ?? "—"} />
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold">Queues</h2>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>Auth DLQ has messages: <span className={health?.dlq?.auth_has_messages ? "text-red-400" : ""}>{String(health?.dlq?.auth_has_messages ?? "—")}</span></li>
          <li>Transactional DLQ has messages: <span className={health?.dlq?.transactional_has_messages ? "text-red-400" : ""}>{String(health?.dlq?.transactional_has_messages ?? "—")}</span></li>
          {health?.last_sent && (
            <li>Last successful send: {new Date(health.last_sent.created_at).toLocaleString()} ({health.last_sent.template_name})</li>
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h2 className="mb-2 text-sm font-semibold">Registered templates</h2>
        {(health?.templates ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground">No transactional templates registered yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {(health?.templates ?? []).map((t: string) => (
              <li key={t} className="rounded bg-muted px-2 py-1 font-mono text-xs">{t}</li>
            ))}
          </ul>
        )}
      </section>

      <details className="rounded-lg border border-border p-4">
        <summary className="cursor-pointer text-sm">Raw JSON</summary>
        <pre className="mt-2 max-h-72 overflow-auto text-xs">{JSON.stringify(health, null, 2)}</pre>
      </details>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: any; tone?: "ok" | "bad" }) {
  const color = tone === "bad" ? "text-red-400" : tone === "ok" ? "text-emerald-300" : "";
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
