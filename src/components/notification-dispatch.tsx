import { useEffect, useState } from "react";
import {
  INSTITUTIONS,
  OUTLETS,
  OPERATOR_EMAIL,
  OPERATOR_PHONE,
  OPERATOR_NAME,
  autoDispatch,
  dispatchStats,
  isNobelTier,
} from "@/lib/notification-dispatch";
import { mergedArchive } from "@/lib/solved-archive";




export function NotificationDispatch() {
  const [stats, setStats] = useState({ total: 0, queued: 0, sent: 0, failed: 0, press: 0 });
  const [backfilled, setBackfilled] = useState<number | null>(null);

  async function refresh() {
    setStats(await dispatchStats());
  }

  // Auto-backfill: every solve ever recorded is queued for dispatch.
  // Deferred until the browser is idle so it never blocks first paint.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const list = await mergedArchive();
      // Fire-and-forget in parallel; the DB upsert is idempotent.
      await Promise.allSettled(
        list.map((s) =>
          autoDispatch({
            theory: s.theory,
            solver: s.solver || OPERATOR_NAME,
            abstract: s.abstract,
            transcript: s.transcript,
          }),
        ),
      );
      if (!cancelled) {
        setBackfilled(list.length);
        await refresh();
      }
    };
    const ric: ((cb: () => void) => number) =
      (window as any).requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 1200));
    const handle = ric(() => {
      if (!cancelled) void run();
    });
    const id = window.setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      const cic = (window as any).cancelIdleCallback;
      if (cic) cic(handle);
      else clearTimeout(handle as unknown as number);
      clearInterval(id);
    };
  }, []);




  const sendingLive = stats.sent > 0;

  return (
    <section
      id="dispatch"
      className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Auto-Dispatch · Institutional Notification
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Every solved theory auto-generates formal letters to{" "}
            <strong>{INSTITUTIONS.length} science institutions</strong> (CERN, DARPA,
            DOE, NASA, Max Planck, Fermilab, SLAC, BNL, KEK, DESY, CNRS, INFN, …) and,
            for Nobel-tier results, fires a press release to{" "}
            <strong>{OUTLETS.length} major outlets</strong>. Authored on behalf of{" "}
            {OPERATOR_NAME} · {OPERATOR_EMAIL} · {OPERATOR_PHONE}.
          </p>
        </div>
        <div className="text-xs px-3 py-1 rounded-full border border-border bg-muted/40">
          {sendingLive ? "LIVE" : "QUEUE READY"}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5 text-sm">
        <Stat label="Total letters" value={stats.total} />
        <Stat label="Queued" value={stats.queued} />
        <Stat label="Sent" value={stats.sent} />
        <Stat label="Failed" value={stats.failed} />
        <Stat label="Press releases" value={stats.press} />
      </div>

      {backfilled !== null && (
        <div className="mt-4 text-xs text-muted-foreground">
          Backfilled {backfilled} archived solve{backfilled === 1 ? "" : "s"} into the
          dispatch queue. Future solves are enqueued automatically the moment they
          land in the ledger.
        </div>
      )}

      {!sendingLive && (
        <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-xs text-yellow-200/80">
          Letters are <strong>queued and addressed</strong>. To start real outbound
          delivery, connect a verified sending domain in <em>Project Settings →
          Domains</em> (e.g. <code>quantara.science</code>) and the worker drains the
          queue automatically — every queued letter, past and future, fires.
        </div>
      )}






      <details className="mt-4 text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">
          Show recipient list ({INSTITUTIONS.length + OUTLETS.length})
        </summary>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider opacity-70 mb-1">
              Institutions
            </div>
            <ul className="space-y-0.5">
              {INSTITUTIONS.map((r) => (
                <li key={r.email}>
                  {r.name} <span className="opacity-50">· {r.email}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider opacity-70 mb-1">
              Press (Nobel-tier only)
            </div>
            <ul className="space-y-0.5">
              {OUTLETS.map((r) => (
                <li key={r.email}>
                  {r.name} <span className="opacity-50">· {r.email}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-2xl font-mono mt-1">{value}</div>
    </div>
  );
}

// re-export for callers that want the heuristic
export { isNobelTier };
