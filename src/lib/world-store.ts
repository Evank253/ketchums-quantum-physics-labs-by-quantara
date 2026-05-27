// Quantara World — persistent simulation store.
// Bots accumulate "research" over real time (including offline catch-up
// capped at 7 days). When thresholds hit, the next breakthrough in the
// curated catalog unlocks deterministically with light per-seed jitter.
//
// Honesty note: this is a creative simulation. The bots are NOT real
// agents and the catalog is curated content, not real discovery.

import { create } from "zustand";
import { BREAKTHROUGHS, type Breakthrough } from "./breakthroughs";
import { creditDat } from "./dat-tokens";

const STORAGE_KEY = "quantara.world.v1";
const HARD_MAX_OFFLINE_MS = 30 * 24 * 60 * 60 * 1000; // absolute ceiling 30d
const DEFAULT_OFFLINE_CAP_HOURS = 168; // 7 days
const TICK_MS = 1000;
const POINTS_PER_TICK = 1.4; // baseline accrual per bot per real second
const COST_BASE = 60;
const COST_GROWTH = 1.18;
const OFFLINE_CAP_KEY = "quantara.world.offlineCapHours";

function readOfflineCapHours(): number {
  if (typeof window === "undefined") return DEFAULT_OFFLINE_CAP_HOURS;
  const raw = parseFloat(window.localStorage.getItem(OFFLINE_CAP_KEY) || "");
  if (!isFinite(raw) || raw <= 0) return DEFAULT_OFFLINE_CAP_HOURS;
  return Math.min(720, Math.max(0.25, raw));
}

export type BotState = {
  id: string;
  name: string;
  role: string;
  x: number;
  z: number;
  hue: number;
  contribution: number;
};

export type UnlockEvent = {
  id: string;
  unlockedAt: number;
  discoveredBy: string;
};

type WorldState = {
  lastTick: number;
  researchPoints: number;
  totalResearch: number;
  worldSize: number;
  bots: BotState[];
  unlocked: UnlockEvent[];
  ticking: boolean;
  init: () => void;
  tick: (deltaMs: number) => void;
  startLoop: () => () => void;
  moveBot: (id: string, x: number, z: number) => void;
  reset: () => void;
};

const BOTS_INIT: BotState[] = [
  { id: "axiom", name: "Axiom", role: "Theorist", x: 8, z: 0, hue: 280, contribution: 0 },
  { id: "borel", name: "Borel", role: "Resummation", x: -6, z: 4, hue: 200, contribution: 0 },
  { id: "cayley", name: "Cayley", role: "Algebra", x: 4, z: -8, hue: 320, contribution: 0 },
  { id: "dirac", name: "Dirac", role: "Field theory", x: -10, z: -6, hue: 180, contribution: 0 },
  { id: "euler", name: "Euler", role: "Analysis", x: 12, z: 10, hue: 40, contribution: 0 },
  { id: "feynman", name: "Feynman", role: "Diagrammatics", x: 0, z: 14, hue: 0, contribution: 0 },
  { id: "gauss", name: "Gauss", role: "Numerics", x: -14, z: 0, hue: 140, contribution: 0 },
  { id: "hilbert", name: "Hilbert", role: "Foundations", x: 6, z: 12, hue: 260, contribution: 0 },
];

type Persisted = {
  lastTick: number;
  researchPoints: number;
  totalResearch: number;
  worldSize: number;
  bots: BotState[];
  unlocked: UnlockEvent[];
};

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePersisted(s: Persisted) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

function nextUnlockCost(n: number) {
  return COST_BASE * Math.pow(COST_GROWTH, n);
}

function pickDiscoverer(bots: BotState[]) {
  // weighted by contribution + small noise
  const weights = bots.map((b) => 1 + b.contribution * 0.001 + Math.random() * 0.5);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < bots.length; i++) {
    r -= weights[i];
    if (r <= 0) return bots[i];
  }
  return bots[0];
}

export const useWorld = create<WorldState>((set, get) => ({
  lastTick: Date.now(),
  researchPoints: 0,
  totalResearch: 0,
  worldSize: 40,
  bots: BOTS_INIT,
  unlocked: [],
  ticking: false,

  init: () => {
    const p = loadPersisted();
    const now = Date.now();
    if (p) {
      const elapsed = Math.min(now - p.lastTick, MAX_OFFLINE_MS);
      // Replay elapsed time as a single bulk tick.
      set({
        lastTick: now,
        researchPoints: p.researchPoints,
        totalResearch: p.totalResearch,
        worldSize: p.worldSize,
        bots: p.bots.length ? p.bots : BOTS_INIT,
        unlocked: p.unlocked || [],
      });
      if (elapsed > 0) get().tick(elapsed);
    } else {
      set({ lastTick: now });
    }
  },

  tick: (deltaMs) => {
    const s = get();
    const seconds = deltaMs / 1000;
    const accrual = s.bots.length * POINTS_PER_TICK * seconds;

    let researchPoints = s.researchPoints + accrual;
    const totalResearch = s.totalResearch + accrual;
    let unlocked = s.unlocked;
    let bots = s.bots;
    let worldSize = s.worldSize;

    // Pop unlocks while we can afford the next one and catalog still has items.
    while (researchPoints >= nextUnlockCost(unlocked.length) && unlocked.length < BREAKTHROUGHS.length) {
      const cost = nextUnlockCost(unlocked.length);
      researchPoints -= cost;
      const item = BREAKTHROUGHS[unlocked.length];
      const who = pickDiscoverer(bots);
      bots = bots.map((b) => (b.id === who.id ? { ...b, contribution: b.contribution + cost } : b));
      worldSize = Math.min(400, worldSize + 4);
      unlocked = [...unlocked, { id: item.id, unlockedAt: Date.now(), discoveredBy: who.name }];
      try {
        creditDat(15);
      } catch {}
    }

    // Drift bots a little so movement looks alive.
    bots = bots.map((b) => {
      const a = Math.random() * Math.PI * 2;
      const step = Math.min(1.5, seconds * 0.6);
      const nx = b.x + Math.cos(a) * step * 0.4;
      const nz = b.z + Math.sin(a) * step * 0.4;
      const r = worldSize * 0.45;
      return {
        ...b,
        x: Math.max(-r, Math.min(r, nx)),
        z: Math.max(-r, Math.min(r, nz)),
      };
    });

    const next: Persisted = {
      lastTick: Date.now(),
      researchPoints,
      totalResearch,
      worldSize,
      bots,
      unlocked,
    };
    savePersisted(next);
    set({ ...next });
  },

  startLoop: () => {
    if (get().ticking) return () => {};
    set({ ticking: true });
    const id = setInterval(() => {
      const now = Date.now();
      const delta = now - get().lastTick;
      get().tick(delta);
    }, TICK_MS);
    return () => {
      clearInterval(id);
      set({ ticking: false });
    };
  },

  moveBot: (id, x, z) => {
    set({ bots: get().bots.map((b) => (b.id === id ? { ...b, x, z } : b)) });
  },

  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({
      lastTick: Date.now(),
      researchPoints: 0,
      totalResearch: 0,
      worldSize: 40,
      bots: BOTS_INIT,
      unlocked: [],
    });
  },
}));

export function nextCost(unlockedCount: number) {
  return nextUnlockCost(unlockedCount);
}

export function getBreakthrough(id: string): Breakthrough | undefined {
  return BREAKTHROUGHS.find((b) => b.id === id);
}
