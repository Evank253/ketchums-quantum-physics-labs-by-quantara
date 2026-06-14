// Achievements store — observes ledger + DAT + custom events to unlock badges.
import { readLedger, subscribeLedger, logLedger } from "./learning-ledger";
import { readDat, subscribeDat, creditDat } from "./dat-tokens";
import { ACHIEVEMENTS as CATALOG, type Achievement as CatalogAchievement } from "./achievements-data";
import { recordAchievementServer } from "./ledger-writes.functions";

export type Achievement = CatalogAchievement & {
  test: (ctx: { dat: number; ledger: ReturnType<typeof readLedger> }) => boolean;
};

const TESTS: Record<string, Achievement["test"]> = {
  first_credit:  ({ dat }) => dat >= 1,
  dat_100:       ({ dat }) => dat >= 100,
  dat_1k:        ({ dat }) => dat >= 1_000,
  dat_10k:       ({ dat }) => dat >= 10_000,
  dat_100k:      ({ dat }) => dat >= 100_000,
  cern_runner:   ({ ledger }) => ledger.some(e => e.label.startsWith("CERN run")),
  cern_master:   ({ ledger }) => ledger.filter(e => e.label.startsWith("CERN run")).length >= 10,
  cern_legend:   ({ ledger }) => ledger.filter(e => e.label.startsWith("CERN run")).length >= 50,
  quantum_lab:   ({ ledger }) => ledger.some(e => e.label.startsWith("Q-Circuit · Measure")),
  entangler:     ({ ledger }) => ledger.some(e => e.label.includes("CNOT")),
  gate_smith:    ({ ledger }) => ledger.filter(e => e.kind === "kernel" && e.label.startsWith("Q-Circuit")).length >= 25,
  ledger_50:     ({ ledger }) => ledger.length >= 50,
  ledger_500:    ({ ledger }) => ledger.length >= 500,
  city_dawn:     ({ ledger }) => ledger.some(e => e.kind === "unlock" && e.label.includes("city:25")),
  city_meridian: ({ ledger }) => ledger.some(e => e.kind === "unlock" && e.label.includes("city:50")),
  city_apex:     ({ ledger }) => ledger.some(e => e.kind === "unlock" && e.label.includes("city:100")),
};

export const ACHIEVEMENTS: Achievement[] = CATALOG.map((a) => ({
  ...a,
  test: TESTS[a.id] ?? (() => false),
}));


const KEY = "quantara.achievements.v1";
const EVT = "quantara:achievements";
const OPERATOR_KEY = "quantara.operator";

function readUnlocked(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function writeUnlocked(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(EVT, { detail: map }));
}

function getOperator(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(OPERATOR_KEY) || null; } catch { return null; }
}

// Fire-and-forget public record. Safe to call repeatedly; we only call it
// once per local unlock and the table is append-only / publicly readable.
async function publishAchievement(a: Achievement) {
  try {
    await supabase.from("public_achievements").insert({
      achievement_id: a.id,
      title: a.title,
      description: a.desc,
      tier: a.tier,
      reward: a.reward,
      operator: getOperator(),
    });
  } catch {
    // Silent — local unlock still stands; will not retry to avoid spam.
  }
}

let evaluating = false;
let scheduled = false;

export function evaluateAchievements(): Record<string, number> {
  // Re-entrancy guard — logLedger/creditDat below dispatch events that the
  // subscriber wires back into here. Without this guard we recurse until the
  // call stack explodes (RangeError: Maximum call stack size exceeded).
  if (evaluating) return readUnlocked();
  evaluating = true;
  try {
    const unlocked = readUnlocked();
    const ctx = { dat: readDat(), ledger: readLedger() };
    let changed = false;
    for (const a of ACHIEVEMENTS) {
      if (unlocked[a.id]) continue;
      try {
        if (a.test(ctx)) {
          unlocked[a.id] = Date.now();
          changed = true;
          // Persist immediately so re-entrant readers see the unlock.
          writeUnlocked(unlocked);
          logLedger("unlock", `Achievement · ${a.title}`, { id: a.id, reward: a.reward });
          if (a.reward) creditDat(a.reward);
          // Publish to the public, CERN-visible ledger.
          void publishAchievement(a);
        }
      } catch {}
    }
    if (changed) writeUnlocked(unlocked);
    return unlocked;
  } finally {
    evaluating = false;
  }
}

function scheduleEvaluate() {
  if (scheduled) return;
  scheduled = true;
  // Coalesce bursts of ledger/DAT events into a single eval per frame.
  const run = () => { scheduled = false; evaluateAchievements(); };
  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    window.requestAnimationFrame(run);
  } else {
    setTimeout(run, 16);
  }
}

export function getUnlocked(): Record<string, number> { return readUnlocked(); }

export function subscribeAchievements(cb: (map: Record<string, number>) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const h = (e: Event) => cb((e as CustomEvent<Record<string, number>>).detail ?? readUnlocked());
  window.addEventListener(EVT, h);
  const offL = subscribeLedger(() => { scheduleEvaluate(); });
  const offD = subscribeDat(() => { scheduleEvaluate(); });
  scheduleEvaluate();
  return () => {
    window.removeEventListener(EVT, h);
    offL(); offD();
  };
}
