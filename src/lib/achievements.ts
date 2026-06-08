// Achievements store — observes ledger + DAT + custom events to unlock badges.
import { readLedger, subscribeLedger, logLedger } from "./learning-ledger";
import { readDat, subscribeDat, creditDat } from "./dat-tokens";

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  tier: "bronze" | "silver" | "gold" | "mythic";
  reward: number; // $DAT
  test: (ctx: { dat: number; ledger: ReturnType<typeof readLedger> }) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_credit",  title: "First Credit",        desc: "Earn your first $DAT.",                  tier: "bronze", reward: 5,   test: ({ dat }) => dat >= 1 },
  { id: "dat_100",       title: "Centurion",           desc: "Accumulate 100 $DAT.",                   tier: "bronze", reward: 25,  test: ({ dat }) => dat >= 100 },
  { id: "dat_1k",        title: "Kilo-DAT",            desc: "Accumulate 1,000 $DAT.",                 tier: "silver", reward: 100, test: ({ dat }) => dat >= 1_000 },
  { id: "dat_10k",       title: "Sovereign Wallet",    desc: "Accumulate 10,000 $DAT.",                tier: "gold",   reward: 500, test: ({ dat }) => dat >= 10_000 },
  { id: "cern_runner",   title: "Hadron Initiate",     desc: "Complete a CERN run.",                   tier: "bronze", reward: 15,  test: ({ ledger }) => ledger.some(e => e.label.startsWith("CERN run")) },
  { id: "cern_master",   title: "Beamline Architect",  desc: "Complete 10 CERN runs.",                 tier: "silver", reward: 60,  test: ({ ledger }) => ledger.filter(e => e.label.startsWith("CERN run")).length >= 10 },
  { id: "quantum_lab",   title: "Wavefunction Tamer",  desc: "Measure a quantum circuit.",             tier: "bronze", reward: 20,  test: ({ ledger }) => ledger.some(e => e.label.startsWith("Q-Circuit")) },
  { id: "entangler",     title: "Entangler",           desc: "Place a CNOT gate.",                     tier: "silver", reward: 40,  test: ({ ledger }) => ledger.some(e => e.label.includes("CNOT")) },
  { id: "ledger_50",     title: "Memory Keeper",       desc: "Record 50 ledger entries.",              tier: "silver", reward: 50,  test: ({ ledger }) => ledger.length >= 50 },
  { id: "ledger_500",    title: "Archivist",           desc: "Record 500 ledger entries.",             tier: "gold",   reward: 250, test: ({ ledger }) => ledger.length >= 500 },
  { id: "city_dawn",     title: "Horizon Dawn",        desc: "Grow the horizon city to 25%.",          tier: "bronze", reward: 20,  test: ({ ledger }) => ledger.some(e => e.kind === "unlock" && e.label.includes("city:25")) },
  { id: "city_meridian", title: "Meridian Skyline",    desc: "Grow the horizon city to 50%.",          tier: "silver", reward: 75,  test: ({ ledger }) => ledger.some(e => e.kind === "unlock" && e.label.includes("city:50")) },
  { id: "city_apex",     title: "Aurora Apex",         desc: "Grow the horizon city to 100%.",         tier: "mythic", reward: 750, test: ({ ledger }) => ledger.some(e => e.kind === "unlock" && e.label.includes("city:100")) },
];

const KEY = "quantara.achievements.v1";
const EVT = "quantara:achievements";

function readUnlocked(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function writeUnlocked(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(EVT, { detail: map }));
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
  (typeof window !== "undefined" ? window.requestAnimationFrame : setTimeout)(
    () => { scheduled = false; evaluateAchievements(); },
    16 as never,
  );
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
