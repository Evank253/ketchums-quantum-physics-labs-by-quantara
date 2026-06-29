import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listOwnerInventions,
  discoverNow,
  getRunSettings,
  updateRunSettings,
} from "@/lib/owner-inventions.functions";

export const Route = createFileRoute("/admin/inventions")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner R&D · AI Civilization Inventions" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminInventionsPage,
});

type Row = {
  id: string;
  category: string;
  title: string;
  summary: string;
  civilization: string;
  report_md: string;
  emailed_at: string | null;
  created_at: string;
};

function AdminInventionsPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const callList = useServerFn(listOwnerInventions);
  const callDiscover = useServerFn(discoverNow);
  const callGetSettings = useServerFn(getRunSettings);
  const callUpdateSettings = useServerFn(updateRunSettings);

  const [enabled, setEnabled] = useState(true);
  const [intervalSec, setIntervalSec] = useState(300);

  const reload = useCallback(() => {
    callList({} as any)
      .then((r: any) => setRows(r.rows ?? []))
      .catch((e) => setErr(e?.message ?? String(e)));
    callGetSettings({} as any)
      .then((s: any) => {
        setEnabled(s.enabled);
        setIntervalSec(s.interval_seconds);
      })
      .catch(() => {});
  }, [callList, callGetSettings]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setAuthed(true);
      reload();
    });
  }, [navigate, reload]);

  const trigger = async () => {
    setBusy(true);
    setErr(null);
    try {
      await callDiscover({} as any);
      reload();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async () => {
    const next = !enabled;
    setEnabled(next);
    try {
      await callUpdateSettings({ data: { enabled: next } } as any);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setEnabled(!next);
    }
  };

  const saveInterval = async () => {
    try {
      await callUpdateSettings({ data: { interval_seconds: intervalSec } } as any);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  };

  if (!authed) return null;

  return (
    <main className="min-h-screen bg-[oklch(0.06_0.01_280)] px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black md:text-4xl">AI Civilization R&D</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Owner-only feed. Blueprints stream to{" "}
              <span className="font-mono">Evan.ketchum2026@outlook.com</span> and
              are never rendered on public pages.
            </p>
          </div>
          <button
            onClick={trigger}
            disabled={busy}
            className="rounded border border-accent/40 bg-accent/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-accent hover:bg-accent/20 disabled:opacity-50"
          >
            {busy ? "Inventing…" : "Discover now"}
          </button>
        </div>
        {err && (
          <div className="mt-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {err}
          </div>
        )}

        <section className="mt-6 rounded border border-white/10 bg-card/40 p-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-chrome">Run controls</div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={enabled}
                onChange={toggleEnabled}
                className="h-4 w-4 accent-current"
              />
              <span>Auto-discovery {enabled ? "ON" : "OFF"}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span>Min interval (s):</span>
              <input
                type="number"
                min={60}
                max={86400}
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value) || 300)}
                className="w-24 rounded border border-white/10 bg-black/40 px-2 py-1 text-sm"
              />
              <button
                onClick={saveInterval}
                className="rounded border border-white/20 px-2 py-1 text-xs hover:bg-white/10"
              >
                Save
              </button>
            </label>
          </div>
        </section>
        <div className="mt-8 space-y-3">
          {rows.length === 0 && (
            <div className="rounded border border-white/10 bg-card/40 p-6 text-sm text-muted-foreground">
              No discoveries yet. The civilization runs every 30 minutes.
            </div>
          )}
          {rows.map((r) => (
            <div key={r.id} className="rounded border border-white/10 bg-card/40 p-4">
              <button
                onClick={() => setOpen(open === r.id ? null : r.id)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-chrome">
                    {r.category} · {r.civilization} ·{" "}
                    {new Date(r.created_at).toLocaleString()}
                    {r.emailed_at ? " · ✉ sent" : ""}
                  </div>
                  <div className="mt-1 text-base font-semibold">{r.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{r.summary}</div>
                </div>
                <span className="text-xs text-accent">{open === r.id ? "−" : "+"}</span>
              </button>
              {open === r.id && (
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded bg-black/40 p-3 font-mono text-[11px] text-white/90">
                  {r.report_md}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
