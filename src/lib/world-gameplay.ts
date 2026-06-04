// Quantara World — gameplay layer.
// Bad-data entities roam the world; the player cleans them with weapons,
// loots artifacts/contracts/boosts, and trades at the $DAT marketplace.
// Pure simulation, persisted to localStorage.

import { create } from "zustand";
import { creditDat, readDat, writeDat } from "./dat-tokens";
import { logLedger } from "./learning-ledger";

const KEY = "quantara.gameplay.v1";

export type WeaponId = "pulse" | "lattice" | "phase" | "wave";
export type PickupKind = "artifact" | "contract" | "boost";

export interface BadData {
  id: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  hue: number;
  speed: number;
  bounty: number; // $DAT awarded on clean
}

export interface Pickup {
  id: string;
  kind: PickupKind;
  x: number;
  z: number;
  label: string;
  value: number;
  rarity: 1 | 2 | 3; // 1 common, 3 legendary
}

export interface Weapon {
  id: WeaponId;
  name: string;
  damage: number;
  cooldownMs: number;
  range: number;
  color: string;
  tint: number; // hue
  unlocked: boolean;
  cost: number; // $DAT
}

export interface InventoryEntry {
  id: string;
  kind: PickupKind;
  label: string;
  value: number;
  rarity: 1 | 2 | 3;
  pickedAt: number;
}

export interface ShotFx {
  id: number;
  x1: number; z1: number;
  x2: number; z2: number;
  bornAt: number;
  hue: number;
}

interface ActiveBoost {
  id: string;
  label: string;
  multiplier: number;
  expiresAt: number;
}

interface GameState {
  badData: BadData[];
  pickups: Pickup[];
  inventory: InventoryEntry[];
  shots: ShotFx[];
  weapons: Weapon[];
  activeWeapon: WeaponId;
  lastFire: Record<WeaponId, number>;
  boost: ActiveBoost | null;
  kills: number;
  cleaned: number; // total bad-data cleaned
  collected: number; // total pickups collected
  init: () => void;
  tick: (dtMs: number, worldRadius: number) => void;
  fire: (origin: { x: number; z: number }, dir: { x: number; z: number }) => boolean;
  collect: (pos: { x: number; z: number }) => InventoryEntry[];
  setWeapon: (id: WeaponId) => void;
  unlockWeapon: (id: WeaponId) => boolean;
  sellArtifact: (entryId: string) => number;
  activateBoost: (entryId: string) => boolean;
  reset: () => void;
}

const WEAPONS_INIT: Weapon[] = [
  { id: "pulse",   name: "Pulse Lance",   damage: 28, cooldownMs: 220, range: 14, color: "#22d3ee", tint: 190, unlocked: true,  cost: 0 },
  { id: "lattice", name: "Lattice Beam",  damage: 60, cooldownMs: 520, range: 22, color: "#a78bfa", tint: 270, unlocked: false, cost: 90 },
  { id: "phase",   name: "Phase Cleaver", damage: 140, cooldownMs: 900, range: 30, color: "#f472b6", tint: 320, unlocked: false, cost: 240 },
  { id: "wave",    name: "Wave Cannon",   damage: 55,  cooldownMs: 1400, range: 18, color: "#34d399", tint: 150, unlocked: false, cost: 320 },
];

interface Persisted {
  inventory: InventoryEntry[];
  weapons: Weapon[];
  activeWeapon: WeaponId;
  kills: number;
  cleaned: number;
  collected: number;
  boost: ActiveBoost | null;
}

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}
function savePersisted(p: Persisted) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

let _shotSeq = 1;
let _entSeq = 1;

function rng(seed: number) {
  let s = seed | 0;
  return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 10000) / 10000; };
}

const PICKUP_LABELS: Record<PickupKind, string[]> = {
  artifact: ["Lattice Shard", "Aurora Crystal", "Phase Relic", "Ancestral Coin", "Vault Sigil"],
  contract: ["Bio-Repair Tender", "Energy Lattice Lease", "Coastal Foundation Bid", "Empathy Triage Mandate"],
  boost:    ["x2 Damage · 60s", "Half Cooldown · 45s", "Magnet Range · 90s"],
};

function makePickup(rand: () => number, radius: number): Pickup {
  const kindRoll = rand();
  const kind: PickupKind = kindRoll < 0.5 ? "artifact" : kindRoll < 0.8 ? "contract" : "boost";
  const rarity: 1 | 2 | 3 = rand() < 0.7 ? 1 : rand() < 0.9 ? 2 : 3;
  const labels = PICKUP_LABELS[kind];
  const label = labels[Math.floor(rand() * labels.length)];
  const a = rand() * Math.PI * 2;
  const r = radius * (0.2 + rand() * 0.8);
  const value = (kind === "artifact" ? 18 : kind === "contract" ? 45 : 0) * rarity;
  return {
    id: `pk-${_entSeq++}`,
    kind, x: Math.cos(a) * r, z: Math.sin(a) * r,
    label, value, rarity,
  };
}

function makeBadData(rand: () => number, radius: number): BadData {
  const a = rand() * Math.PI * 2;
  const r = radius * (0.4 + rand() * 0.6);
  const tier = 1 + Math.floor(rand() * 3);
  return {
    id: `bd-${_entSeq++}`,
    x: Math.cos(a) * r, z: Math.sin(a) * r,
    hp: 30 * tier, maxHp: 30 * tier,
    hue: 0 + rand() * 40, // red/orange — clearly "bad"
    speed: 0.6 + rand() * 0.6,
    bounty: 4 * tier,
  };
}

export const useGameplay = create<GameState>((set, get) => ({
  badData: [],
  pickups: [],
  inventory: [],
  shots: [],
  weapons: WEAPONS_INIT,
  activeWeapon: "pulse",
  lastFire: { pulse: 0, lattice: 0, phase: 0 },
  boost: null,
  kills: 0,
  cleaned: 0,
  collected: 0,

  init: () => {
    const p = loadPersisted();
    if (p) {
      set({
        inventory: p.inventory ?? [],
        weapons: WEAPONS_INIT.map((w) => ({ ...w, unlocked: p.weapons?.find((x) => x.id === w.id)?.unlocked ?? w.unlocked })),
        activeWeapon: p.activeWeapon ?? "pulse",
        kills: p.kills ?? 0,
        cleaned: p.cleaned ?? 0,
        collected: p.collected ?? 0,
        boost: p.boost && p.boost.expiresAt > Date.now() ? p.boost : null,
      });
    }
    // seed entities
    const rand = rng(Date.now());
    const baseRadius = 28;
    const bad = Array.from({ length: 10 }, () => makeBadData(rand, baseRadius));
    const pk = Array.from({ length: 14 }, () => makePickup(rand, baseRadius));
    set({ badData: bad, pickups: pk });
  },

  tick: (dtMs, worldRadius) => {
    const s = get();
    const now = Date.now();
    const dt = dtMs / 1000;
    // expire boost
    let boost = s.boost;
    if (boost && boost.expiresAt < now) boost = null;
    // drift bad-data toward origin slowly (acts as threat to civilization)
    const badData = s.badData.map((b) => {
      const d = Math.hypot(b.x, b.z) || 1;
      const nx = b.x - (b.x / d) * b.speed * dt;
      const nz = b.z - (b.z / d) * b.speed * dt;
      return { ...b, x: nx, z: nz };
    });
    // respawn entities to keep world alive
    const rand = rng(now);
    if (badData.length < 8) badData.push(makeBadData(rand, worldRadius));
    let pickups = s.pickups;
    if (pickups.length < 10) pickups = [...pickups, makePickup(rand, worldRadius)];
    // age shots
    const shots = s.shots.filter((sh) => now - sh.bornAt < 220);
    set({ badData, pickups, shots, boost });
  },

  fire: (origin, dir) => {
    const s = get();
    const w = s.weapons.find((x) => x.id === s.activeWeapon)!;
    if (!w.unlocked) return false;
    const now = Date.now();
    const cdMul = s.boost?.label.includes("Cooldown") ? 0.5 : 1;
    if (now - s.lastFire[w.id] < w.cooldownMs * cdMul) return false;
    // normalize dir
    const dl = Math.hypot(dir.x, dir.z) || 1;
    const dx = dir.x / dl, dz = dir.z / dl;
    const endX = origin.x + dx * w.range;
    const endZ = origin.z + dz * w.range;

    // hit detection — line vs circle (r=0.8)
    let hitId: string | null = null;
    let bestT = Infinity;
    for (const b of s.badData) {
      const t = (b.x - origin.x) * dx + (b.z - origin.z) * dz;
      if (t < 0 || t > w.range) continue;
      const px = origin.x + dx * t, pz = origin.z + dz * t;
      const d2 = (px - b.x) ** 2 + (pz - b.z) ** 2;
      if (d2 < 1.2 && t < bestT) { bestT = t; hitId = b.id; }
    }

    const dmgMul = s.boost?.label.includes("Damage") ? 2 : 1;
    let badData = s.badData;
    let kills = s.kills, cleaned = s.cleaned;
    let bounty = 0;
    let hitX = endX, hitZ = endZ;
    if (hitId) {
      const target = s.badData.find((b) => b.id === hitId)!;
      hitX = target.x; hitZ = target.z;
      badData = s.badData.flatMap((b) => {
        if (b.id !== hitId) return [b];
        const nhp = b.hp - w.damage * dmgMul;
        if (nhp <= 0) {
          kills += 1; cleaned += 1; bounty = b.bounty;
          return [];
        }
        return [{ ...b, hp: nhp }];
      });
    }
    if (bounty > 0) {
      creditDat(bounty);
      logLedger("tokens", `+${bounty} $DAT · cleaned bad-data`, { weapon: w.id });
    }

    const shot: ShotFx = {
      id: _shotSeq++, x1: origin.x, z1: origin.z,
      x2: hitX, z2: hitZ,
      bornAt: now, hue: w.tint,
    };
    const lastFire = { ...s.lastFire, [w.id]: now };
    set({ badData, kills, cleaned, lastFire, shots: [...s.shots, shot] });
    return true;
  },

  collect: (pos) => {
    const s = get();
    const magnet = s.boost?.label.includes("Magnet") ? 3.2 : 1.6;
    const taken: InventoryEntry[] = [];
    const remaining: Pickup[] = [];
    for (const p of s.pickups) {
      const d = Math.hypot(p.x - pos.x, p.z - pos.z);
      if (d < magnet) {
        const entry: InventoryEntry = {
          id: p.id, kind: p.kind, label: p.label, value: p.value, rarity: p.rarity, pickedAt: Date.now(),
        };
        taken.push(entry);
        logLedger("tokens", `picked ${p.kind} · ${p.label}`, { value: p.value, rarity: p.rarity });
      } else remaining.push(p);
    }
    if (taken.length === 0) return [];
    const inventory = [...s.inventory, ...taken];
    const collected = s.collected + taken.length;
    set({ pickups: remaining, inventory, collected });
    persist(get());
    return taken;
  },

  setWeapon: (id) => {
    const w = get().weapons.find((x) => x.id === id);
    if (!w || !w.unlocked) return;
    set({ activeWeapon: id });
    persist(get());
  },

  unlockWeapon: (id) => {
    const s = get();
    const w = s.weapons.find((x) => x.id === id);
    if (!w || w.unlocked) return false;
    if (readDat() < w.cost) return false;
    writeDat(readDat() - w.cost);
    const weapons = s.weapons.map((x) => x.id === id ? { ...x, unlocked: true } : x);
    logLedger("unlock", `weapon · ${w.name}`, { cost: w.cost });
    set({ weapons, activeWeapon: id });
    persist(get());
    return true;
  },

  sellArtifact: (entryId) => {
    const s = get();
    const entry = s.inventory.find((e) => e.id === entryId);
    if (!entry || entry.kind === "boost") return 0;
    creditDat(entry.value);
    const inventory = s.inventory.filter((e) => e.id !== entryId);
    set({ inventory });
    persist(get());
    return entry.value;
  },

  activateBoost: (entryId) => {
    const s = get();
    const entry = s.inventory.find((e) => e.id === entryId);
    if (!entry || entry.kind !== "boost") return false;
    const duration = entry.label.includes("60s") ? 60_000 : entry.label.includes("45s") ? 45_000 : 90_000;
    const boost: ActiveBoost = {
      id: entry.id, label: entry.label,
      multiplier: entry.label.includes("Damage") ? 2 : entry.label.includes("Cooldown") ? 0.5 : 2,
      expiresAt: Date.now() + duration,
    };
    const inventory = s.inventory.filter((e) => e.id !== entryId);
    logLedger("tokens", `boost active · ${entry.label}`);
    set({ inventory, boost });
    persist(get());
    return true;
  },

  reset: () => {
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
    set({
      badData: [], pickups: [], inventory: [], shots: [],
      weapons: WEAPONS_INIT, activeWeapon: "pulse",
      lastFire: { pulse: 0, lattice: 0, phase: 0 },
      boost: null, kills: 0, cleaned: 0, collected: 0,
    });
  },
}));

function persist(s: GameState) {
  savePersisted({
    inventory: s.inventory, weapons: s.weapons, activeWeapon: s.activeWeapon,
    kills: s.kills, cleaned: s.cleaned, collected: s.collected, boost: s.boost,
  });
}
