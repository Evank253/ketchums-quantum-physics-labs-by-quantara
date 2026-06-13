// Operator identity — auto-credits the current solver on every archive.
// Default: Evan Ketchum (project owner). Other users override via setOperator().

const KEY = "quantara.operator.v1";
const DEFAULT_OPERATOR = "Evan Ketchum";

export function getOperator(): string {
  if (typeof window === "undefined") return DEFAULT_OPERATOR;
  try {
    return window.localStorage.getItem(KEY) || DEFAULT_OPERATOR;
  } catch {
    return DEFAULT_OPERATOR;
  }
}

export function setOperator(name: string) {
  if (typeof window === "undefined") return;
  try {
    const v = (name || "").trim();
    if (v) window.localStorage.setItem(KEY, v);
    else window.localStorage.removeItem(KEY);
  } catch {}
}

export function stampNow(): string {
  return new Date().toISOString();
}
