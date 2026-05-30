// Tiny global $DAT token store backed by localStorage + window events.
// Any component can credit tokens; subscribers stay in sync across the app.

const KEY = "quantara.datTokens";
const EVT = "quantara:dat";

export function readDat(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(window.localStorage.getItem(KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function writeDat(n: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, String(Math.max(0, Math.floor(n))));
    window.dispatchEvent(new CustomEvent(EVT, { detail: Math.floor(n) }));
  } catch {}
}

export function creditDat(amount: number) {
  if (!amount) return;
  const next = readDat() + amount;
  writeDat(next);
  // Autosave to learning ledger (lazy import avoids cycle)
  if (typeof window !== "undefined") {
    import("./learning-ledger").then(({ logLedger }) => {
      logLedger("tokens", `+${amount} $DAT`, { balance: next });
    }).catch(() => {});
  }
}

export function subscribeDat(cb: (v: number) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<number>;
    cb(typeof ce.detail === "number" ? ce.detail : readDat());
  };
  const storageHandler = (e: StorageEvent) => {
    if (e.key === KEY) cb(readDat());
  };
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", storageHandler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", storageHandler);
  };
}
