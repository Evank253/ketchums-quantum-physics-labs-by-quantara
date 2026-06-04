// Threat Watchlist — SIMULATED, operator-only.
// Scans locally-ingested discoveries for suspicious-looking text patterns
// (laundering keywords, scam phrases, leaked-key shapes) and produces a
// reviewable report the operator can export. It does NOT contact any
// authority, does NOT geolocate anyone, does NOT bypass any proxy, and
// does NOT touch the public internet. All matches are local pattern hits
// the operator must review and act on through proper legal channels.

import { useEffect, useMemo, useState } from "react";
import { readDiscoveries, subscribeDiscoveries, type Discovery } from "@/lib/discoveries";

interface Pattern { id: string; label: string; rx: RegExp; severity: "low" | "med" | "high"; }

const PATTERNS: Pattern[] = [
  { id: "laundering", label: "laundering language", severity: "high",
    rx: /\b(layering|smurf(?:ing)?|shell company|wire ?wash|launder|mule account)\b/i },
  { id: "scam", label: "scam phrasing", severity: "med",
    rx: /\b(nigerian prince|wire transfer urgent|gift ?card|crypto giveaway|guaranteed return)\b/i },
  { id: "leak-key", label: "possible secret key", severity: "high",
    rx: /\b(sk_(?:live|test)_[a-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|ghp_[A-Za-z0-9]{36,})\b/ },
  { id: "darkweb", label: "dark-web reference", severity: "med",
    rx: /\b([a-z2-7]{16,56}\.onion)\b/i },
  { id: "credit-card", label: "credit-card-like number", severity: "med",
    rx: /\b(?:\d[ -]?){13,16}\b/ },
  { id: "exfil", label: "exfiltration verbs", severity: "low",
    rx: /\b(dump (?:db|database)|exfiltrate|rm -rf|drop table)\b/i },
];

interface Finding {
  discoveryId: string; name: string; pattern: string; severity: Pattern["severity"]; snippet: string;
}

function scan(list: Discovery[]): Finding[] {
  const out: Finding[] = [];
  for (const d of list) {
    const sample = d.content.slice(0, 200_000);
    for (const p of PATTERNS) {
      const m = sample.match(p.rx);
      if (!m || m.index === undefined) continue;
      const start = Math.max(0, m.index - 40);
      const end = Math.min(sample.length, m.index + m[0].length + 40);
      out.push({
        discoveryId: d.id, name: d.name, pattern: p.label, severity: p.severity,
        snippet: sample.slice(start, end).replace(/\s+/g, " ").trim(),
      });
    }
  }
  return out;
}

export function ThreatWatch({ onClose }: { onClose: () => void }) {
  const [list, setList] = useState<Discovery[]>(() => readDiscoveries());
  const [approved, setApproved] = useState<Record<string, boolean>>({});

  useEffect(() => subscribeDiscoveries(() => setList(readDiscoveries())), []);

  const findings = useMemo(() => scan(list), [list]);

  const approveCount = Object.values(approved).filter(Boolean).length;

  const exportReport = () => {
    const picked = findings.filter((_, i) => approved[`${i}`]);
    const report = {
      generatedAt: new Date().toISOString(),
      note: "SIMULATED local pattern report — operator must verify before any external action.",
      findings: picked,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `quantara-threat-report-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="pointer-events-auto absolute left-4 bottom-44 max-h-[60vh] w-96 overflow-y-auto rounded-sm border border-rose-400/40 bg-black/90 p-4 backdrop-blur-md font-mono">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.25em] text-rose-300">▌ Threat Watchlist · simulated</div>
        <button onClick={onClose} className="text-[10px] text-chrome hover:text-white">✕</button>
      </div>
      <div className="mt-2 rounded-sm border border-amber-400/30 bg-amber-400/5 p-2 text-[10px] text-amber-200">
        Local pattern scan over ingested discoveries. <strong>This does not deanonymize anyone, contact authorities, or
        bypass proxies.</strong> Review each finding, then export a JSON report you can forward through proper legal channels.
      </div>
      <div className="mt-3 space-y-2 text-[10px]">
        {findings.length === 0 && (
          <div className="text-muted-foreground">// no pattern matches — upload discoveries to scan</div>
        )}
        {findings.map((f, i) => {
          const sev = f.severity === "high" ? "text-rose-300 border-rose-400/40"
            : f.severity === "med" ? "text-amber-300 border-amber-400/40"
            : "text-cyan-300 border-cyan-400/40";
          return (
            <label key={i} className={`flex cursor-pointer items-start gap-2 rounded-sm border bg-black/40 p-2 ${sev}`}>
              <input type="checkbox" checked={!!approved[`${i}`]}
                onChange={(e) => setApproved({ ...approved, [`${i}`]: e.target.checked })}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <span className="font-bold uppercase tracking-[0.15em]">{f.pattern}</span>
                  <span className="text-[9px]">{f.severity}</span>
                </div>
                <div className="text-[9px] text-muted-foreground">{f.name}</div>
                <div className="mt-1 truncate text-[10px] text-white/80">…{f.snippet}…</div>
              </div>
            </label>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-[9px] text-chrome">{approveCount} of {findings.length} approved</div>
        <button onClick={exportReport} disabled={approveCount === 0}
          className="rounded-sm border border-emerald-400/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-30">
          Export approved report
        </button>
      </div>
    </div>
  );
}
