// Learning Ledger — autosaves every token credit, bot advance, benchmark run,
// and unlock to a single append-only log in localStorage. This is what the
// civilization "remembers" of its own life.

const KEY = "quantara.ledger.v1";
const EVT = "quantara:ledger";
const MAX_ENTRIES = 5000;

export type LedgerKind =
  | "tokens"
  | "unlock"
  | "benchmark"
  | "bot_advance"
  | "heal"
  | "kernel";

export interface LedgerEntry {
  ts: number;
  kind: LedgerKind;
  label: string;
  data?: Record<string, unknown>;
}

function read(): LedgerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(entries: LedgerEntry[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = entries.slice(-MAX_ENTRIES);
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
    window.dispatchEvent(new CustomEvent(EVT, { detail: trimmed.length }));
  } catch {}
}

export function logLedger(kind: LedgerKind, label: string, data?: Record<string, unknown>) {
  const e: LedgerEntry = { ts: Date.now(), kind, label, data };
  const all = read();
  all.push(e);
  write(all);
  return e;
}

export function readLedger(): LedgerEntry[] {
  return read();
}

export function clearLedger() {
  write([]);
}

export function subscribeLedger(cb: (count: number) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => cb((e as CustomEvent<number>).detail ?? read().length);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}

export function exportLedgerJSON(): string {
  return JSON.stringify(
    { exportedAt: Date.now(), entries: read() },
    null,
    2,
  );
}
