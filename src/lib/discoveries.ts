// Operator Discoveries — uploads ingested inside the running world without
// any external pipeline. Files are stored in localStorage and pushed to the
// learning ledger as `kind: "kernel"` so they appear in the audit timeline.

import { logLedger } from "./learning-ledger";

const KEY = "quantara.discoveries.v1";
const EVT = "quantara:discoveries";
const MAX_BYTES = 1_500_000; // ~1.5 MB hard cap per file (localStorage safety)

export interface Discovery {
  id: string;
  name: string;
  size: number;
  mime: string;
  uploadedAt: number;
  content: string;       // raw text content (md/txt/json/csv)
  tag?: string;
}

function read(): Discovery[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(list: Discovery[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVT, { detail: list.length }));
  } catch {}
}

export function readDiscoveries(): Discovery[] { return read(); }

export async function ingestFile(file: File, tag?: string): Promise<Discovery | null> {
  if (file.size > MAX_BYTES) {
    logLedger("kernel", `discovery rejected · ${file.name} too large`, { size: file.size });
    return null;
  }
  const txt = await file.text();
  const d: Discovery = {
    id: `dx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: file.name,
    size: file.size,
    mime: file.type || "text/plain",
    uploadedAt: Date.now(),
    content: txt,
    tag,
  };
  const list = read(); list.push(d); write(list);
  logLedger("kernel", `discovery uploaded · ${file.name}`, { size: file.size, tag });
  return d;
}

export function removeDiscovery(id: string) {
  write(read().filter(d => d.id !== id));
}

export function subscribeDiscoveries(cb: (count: number) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => cb((e as CustomEvent<number>).detail ?? read().length);
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
