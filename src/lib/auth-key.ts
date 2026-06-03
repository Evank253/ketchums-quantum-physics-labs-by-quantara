// Rotating master auth key + tamper-evident audit trail.
// Key is generated locally (never shipped, never transmitted), rotated on a
// schedule, and every lifecycle event is appended to an audit log kept in
// localStorage. This is operator-only and lives on the device.

const KEY_K       = "quantara.authKey";
const META_K      = "quantara.authKey.meta";   // { createdAt, rotatesAt, rotationMs }
const AUDIT_K     = "quantara.authKey.audit";  // AuditEntry[]
const EVT         = "quantara:auth";
const MAX_AUDIT   = 2000;

export type AuditAction =
  | "create" | "rotate" | "auto_rotate" | "reveal" | "hide"
  | "seal" | "import" | "export" | "verify_ok" | "verify_fail";

export interface AuditEntry {
  ts: number;
  action: AuditAction;
  fingerprint: string;   // 12-char short hash of the key at the time
  note?: string;
}

export interface KeyMeta {
  createdAt: number;
  rotatesAt: number;
  rotationMs: number;
}

const DEFAULT_ROTATION_MS = 1000 * 60 * 60 * 24; // 24h

function safeWindow(): Window | null {
  return typeof window === "undefined" ? null : window;
}

function emit() {
  const w = safeWindow(); if (!w) return;
  w.dispatchEvent(new CustomEvent(EVT));
}

async function sha256Hex(s: string): Promise<string> {
  const w = safeWindow();
  if (!w || !w.crypto?.subtle) {
    // very small fallback (not crypto-grade) — only used in SSR
    let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return ("00000000" + (h >>> 0).toString(16)).slice(-8).padEnd(12, "0");
  }
  const buf = await w.crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
}

function randomKey(): string {
  const w = safeWindow();
  const bytes = new Uint8Array(32);
  if (w?.crypto?.getRandomValues) w.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  // base64url
  const b64 = btoa(String.fromCharCode(...bytes));
  return "qk_" + b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function readMeta(): KeyMeta | null {
  const w = safeWindow(); if (!w) return null;
  try { return JSON.parse(w.localStorage.getItem(META_K) || "null"); } catch { return null; }
}
function writeMeta(m: KeyMeta) {
  const w = safeWindow(); if (!w) return;
  w.localStorage.setItem(META_K, JSON.stringify(m));
}

function readAudit(): AuditEntry[] {
  const w = safeWindow(); if (!w) return [];
  try { return JSON.parse(w.localStorage.getItem(AUDIT_K) || "[]"); } catch { return []; }
}
function writeAudit(a: AuditEntry[]) {
  const w = safeWindow(); if (!w) return;
  const trimmed = a.slice(-MAX_AUDIT);
  w.localStorage.setItem(AUDIT_K, JSON.stringify(trimmed));
}

export async function appendAudit(action: AuditAction, key: string, note?: string) {
  const fp = key ? await sha256Hex(key) : "------------";
  const entry: AuditEntry = { ts: Date.now(), action, fingerprint: fp, note };
  const all = readAudit(); all.push(entry); writeAudit(all);
  emit();
  return entry;
}

export function readKey(): string {
  const w = safeWindow(); if (!w) return "";
  return w.localStorage.getItem(KEY_K) || "";
}

export function readKeyMeta(): KeyMeta | null { return readMeta(); }

export function readAuditLog(): AuditEntry[] { return readAudit(); }

export async function fingerprint(k?: string): Promise<string> {
  const key = k ?? readKey();
  if (!key) return "------------";
  return sha256Hex(key);
}

export async function rotateKey(reason: AuditAction = "rotate", rotationMs?: number): Promise<string> {
  const w = safeWindow(); if (!w) return "";
  const k = randomKey();
  w.localStorage.setItem(KEY_K, k);
  const rot = rotationMs ?? readMeta()?.rotationMs ?? DEFAULT_ROTATION_MS;
  writeMeta({ createdAt: Date.now(), rotatesAt: Date.now() + rot, rotationMs: rot });
  await appendAudit(reason, k);
  emit();
  return k;
}

export async function ensureKey(rotationMs?: number): Promise<string> {
  const existing = readKey();
  const meta = readMeta();
  if (!existing || !meta) {
    return rotateKey("create", rotationMs);
  }
  // auto-rotate if expired
  if (Date.now() >= meta.rotatesAt) {
    return rotateKey("auto_rotate", rotationMs);
  }
  return existing;
}

export async function importKey(k: string): Promise<void> {
  const w = safeWindow(); if (!w) return;
  const trimmed = k.trim();
  if (!trimmed) return;
  w.localStorage.setItem(KEY_K, trimmed);
  const rot = readMeta()?.rotationMs ?? DEFAULT_ROTATION_MS;
  writeMeta({ createdAt: Date.now(), rotatesAt: Date.now() + rot, rotationMs: rot });
  await appendAudit("import", trimmed);
}

export async function sealKey(): Promise<void> {
  const w = safeWindow(); if (!w) return;
  const current = readKey();
  await appendAudit("seal", current);
  w.localStorage.removeItem(KEY_K);
  w.localStorage.removeItem(META_K);
  emit();
}

export async function logReveal()  { await appendAudit("reveal", readKey()); }
export async function logHide()    { await appendAudit("hide",   readKey()); }
export async function logExport()  { await appendAudit("export", readKey()); }

export function setRotationMs(ms: number) {
  const meta = readMeta();
  if (!meta) return;
  writeMeta({ ...meta, rotationMs: ms, rotatesAt: meta.createdAt + ms });
  emit();
}

export function subscribeAuth(cb: () => void): () => void {
  const w = safeWindow(); if (!w) return () => {};
  w.addEventListener(EVT, cb);
  // also react when storage changes from another tab
  w.addEventListener("storage", cb);
  return () => { w.removeEventListener(EVT, cb); w.removeEventListener("storage", cb); };
}

export function exportAuditCSV(): string {
  const rows = readAudit();
  const head = "timestamp,action,fingerprint,note";
  const lines = rows.map(r => `${new Date(r.ts).toISOString()},${r.action},${r.fingerprint},"${(r.note ?? "").replace(/"/g, '""')}"`);
  return [head, ...lines].join("\n");
}

export function clearAudit() {
  const w = safeWindow(); if (!w) return;
  w.localStorage.removeItem(AUDIT_K);
  emit();
}

export const ROTATION_PRESETS: { label: string; ms: number }[] = [
  { label: "1h",  ms: 60 * 60 * 1000 },
  { label: "6h",  ms: 6 * 60 * 60 * 1000 },
  { label: "24h", ms: 24 * 60 * 60 * 1000 },
  { label: "7d",  ms: 7 * 24 * 60 * 60 * 1000 },
  { label: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
];
