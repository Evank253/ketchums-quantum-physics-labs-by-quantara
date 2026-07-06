import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/compute/roles.functions";
import { listAuditLog, exportAuditLog } from "@/lib/audit-log.functions";

export const Route = createFileRoute("/admin/audit")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Audit Log · KQPL Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAuditPage,
});

type Entry = {
  id: number;
  table_name: string;
  op: "INSERT" | "UPDATE" | "DELETE";
  actor_id: string | null;
  row_id: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
};

function AdminAuditPage() {
  const navigate = useNavigate();
  const callRoles = useServerFn(getMyRoles);
  const callList = useServerFn(listAuditLog);

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [table, setTable] = useState<string>("");
  const [op, setOp] = useState<"" | Entry["op"]>("");
  const [limit, setLimit] = useState(100);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  useEffect(() => {
    if (authed === false) navigate({ to: "/auth" });
    if (!authed) return;
    callRoles()
      .then((r) => setIsAdmin((r.roles ?? []).includes("admin")))
      .catch(() => setIsAdmin(false));

  }, [authed, callRoles, navigate]);

  const reload = useCallback(() => {
    setBusy(true);
    setErr(null);
    callList({
      data: {
        limit,
        table: table || undefined,
        op: op || undefined,
      },
    })
      .then((r) => {
        setEntries(r.entries as Entry[]);
        setTables(r.tables);
      })
      .catch((e) => setErr(e?.message ?? String(e)))
      .finally(() => setBusy(false));
  }, [callList, limit, table, op]);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin, reload]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { INSERT: 0, UPDATE: 0, DELETE: 0 };
    for (const e of entries) c[e.op] = (c[e.op] ?? 0) + 1;
    return c;
  }, [entries]);

  if (authed === null) return <main className="p-6 text-sm">Loading…</main>;
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need the admin role to view the audit log.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm underline">Home</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Audit log</h1>
          <p className="text-xs text-muted-foreground">
            Every sensitive write across tracked tables. Service-role inserts show no actor.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link to="/admin/logs" className="rounded border border-border px-2 py-1">Admin logs</Link>
          <Link to="/admin/security" className="rounded border border-border px-2 py-1">Security</Link>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <label className="flex flex-col">
            <span className="mb-1 text-muted-foreground">Table</span>
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1"
            >
              <option value="">All</option>
              {tables.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-muted-foreground">Op</span>
            <select
              value={op}
              onChange={(e) => setOp(e.target.value as Entry["op"] | "")}
              className="rounded border border-border bg-background px-2 py-1"
            >
              <option value="">All</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-muted-foreground">Limit</span>
            <input
              type="number"
              min={1}
              max={500}
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(500, Number(e.target.value) || 100)))}
              className="w-20 rounded border border-border bg-background px-2 py-1"
            />
          </label>
          <button
            type="button"
            onClick={reload}
            disabled={busy}
            className="rounded bg-primary px-3 py-1 font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Loading…" : "Refresh"}
          </button>
          <div className="ml-auto flex gap-2 font-mono text-[10px]">
            <span className="rounded bg-green-500/15 px-2 py-1 text-green-300">INSERT {counts.INSERT}</span>
            <span className="rounded bg-amber-500/15 px-2 py-1 text-amber-300">UPDATE {counts.UPDATE}</span>
            <span className="rounded bg-red-500/15 px-2 py-1 text-red-300">DELETE {counts.DELETE}</span>
          </div>
        </div>
      </section>

      {err && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {err}
        </div>
      )}

      <section className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">Table</th>
              <th className="px-3 py-2">Op</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No entries.</td></tr>
            ) : entries.map((e) => (
              <Fragment key={e.id}>
                <tr className="border-t border-border/60">


                  <td className="px-3 py-2 font-mono text-[10px]">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono">{e.table_name}</td>
                  <td className="px-3 py-2">
                    <span className={
                      e.op === "DELETE" ? "text-red-300" :
                      e.op === "UPDATE" ? "text-amber-300" : "text-green-300"
                    }>{e.op}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px]">{e.actor_id ? e.actor_id.slice(0, 8) : "—"}</td>
                  <td className="px-3 py-2 font-mono text-[10px]">{e.row_id ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-[10px] underline"
                      onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                    >
                      {expanded === e.id ? "Hide" : "Diff"}
                    </button>
                  </td>
                </tr>
                {expanded === e.id && (
                  <tr key={`${e.id}-d`} className="border-t border-border/40 bg-muted/20">
                    <td colSpan={6} className="px-3 py-2">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="mb-1 text-[10px] uppercase text-muted-foreground">Old</div>
                          <pre className="max-h-64 overflow-auto rounded bg-background p-2 text-[10px]">
                            {JSON.stringify(e.old_data ?? null, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="mb-1 text-[10px] uppercase text-muted-foreground">New</div>
                          <pre className="max-h-64 overflow-auto rounded bg-background p-2 text-[10px]">
                            {JSON.stringify(e.new_data ?? null, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
