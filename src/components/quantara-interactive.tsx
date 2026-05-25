import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// SIMULATION CANVAS — Bots eating bad data, evolving, expanding the Nexus base
// ---------------------------------------------------------------------------
type ParticleType = "CORRUPT" | "DUPE" | "NOISE" | "CLEAN" | "INSIGHT" | "SIGNAL" | "PURIFIED_BEAM";
type Role = "Harvester" | "Sifter" | "Stabilizer" | "Swarm";
interface Particle { id: number; x: number; y: number; vx: number; vy: number; type: ParticleType; }
interface Bot {
  id: number; x: number; y: number;
  role: Role;
  badEaten: number; goodCollected: number; energy: number;
  mood: "Optimal" | "Aggressive" | "Stable"; xp: number; rate: number;
  tier: number;
}

const BAD_TYPES: ParticleType[] = ["CORRUPT", "DUPE", "NOISE"];
const TYPES: ParticleType[] = ["CORRUPT", "DUPE", "NOISE", "CLEAN", "INSIGHT", "SIGNAL"];

const TIER_NAMES: Record<Role, [string, string, string]> = {
  Harvester: ["Harvester MK-I", "Navigator MK-II", "Recon Drone MK-III"],
  Sifter:    ["Sifter MK-I", "Cipher MK-II", "Quantum Sifter MK-III"],
  Stabilizer:["Stabilizer MK-I", "Anchor MK-II", "Reality Stabilizer MK-III"],
  Swarm:     ["Swarm Drone α", "Swarm Drone β", "Hive Pilot γ"],
};
const ROLE_COLOR: Record<Role, string> = {
  Harvester: "#f43f5e", Sifter: "#3b82f6", Stabilizer: "#10b981", Swarm: "#eab308",
};

// No cap — logarithmic so evolution always continues but at slowing pace
function tierForXp(xp: number): number {
  if (xp < 100) return 1;
  return 1 + Math.floor(Math.log2(xp / 100 + 1));
}
function bottierName(role: Role, tier: number) {
  const base = TIER_NAMES[role][Math.min(2, tier - 1)];
  return tier > 3 ? `${base} · Σ${tier}` : base;
}


export function SimulationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [datTokens, setDatTokens] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const v = window.localStorage.getItem("quantara.datTokens");
    if (v) setDatTokens(parseInt(v, 10) || 0);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("quantara.datTokens", String(datTokens));
  }, [datTokens, hydrated]);
  const [bots, setBots] = useState<Bot[]>([
    { id: 1, x: 150, y: 120, role: "Harvester",  badEaten: 0, goodCollected: 0, energy: 100, mood: "Optimal", xp: 0, rate: 2.2, tier: 1 },
    { id: 2, x: 450, y: 280, role: "Sifter",     badEaten: 0, goodCollected: 0, energy: 95,  mood: "Optimal", xp: 0, rate: 3.5, tier: 1 },
    { id: 3, x: 300, y: 100, role: "Stabilizer", badEaten: 0, goodCollected: 0, energy: 100, mood: "Stable",  xp: 0, rate: 1.8, tier: 1 },
    { id: 4, x: 600, y: 200, role: "Swarm",      badEaten: 0, goodCollected: 0, energy: 100, mood: "Optimal", xp: 0, rate: 4.2, tier: 1 },
    { id: 5, x: 100, y: 260, role: "Swarm",      badEaten: 0, goodCollected: 0, energy: 100, mood: "Optimal", xp: 0, rate: 4.2, tier: 1 },
  ]);
  const totalXp = bots.reduce((s, b) => s + b.xp, 0);
  const baseLevel = 1 + Math.floor(totalXp / 250);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 360;

    let particles: Particle[] = Array.from({ length: 36 }, (_, i) => ({
      id: i, x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
    }));
    let nextId = 1000;
    const nexusX = canvas.width / 2;
    const nexusY = canvas.height / 2;
    let animId = 0;
    let botsRef = bots;

    const loop = () => {
      ctx.fillStyle = "rgba(5, 5, 7, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // ===== Evolving Nexus Base =====
      const tXp = botsRef.reduce((s, b) => s + b.xp, 0);
      const lvl = Math.min(5, 1 + Math.floor(tXp / 250));
      const baseR = 22 + lvl * 8;
      const t = performance.now() / 1000;
      // outer rings (growing)
      for (let r = 0; r < lvl; r++) {
        const radius = baseR + 10 + r * 14 + Math.sin(t + r) * 2;
        ctx.strokeStyle = `rgba(167, 139, 250, ${0.12 + r * 0.04})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nexusX, nexusY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      // base footprint
      ctx.fillStyle = "rgba(167, 139, 250, 0.08)";
      ctx.beginPath();
      ctx.arc(nexusX, nexusY, baseR, 0, Math.PI * 2);
      ctx.fill();
      // base structure - stacked spires
      const spires = 2 + lvl;
      for (let s = 0; s < spires; s++) {
        const ang = (s / spires) * Math.PI * 2 + t * 0.1;
        const dx = Math.cos(ang) * (baseR * 0.55);
        const dy = Math.sin(ang) * (baseR * 0.55);
        const h = 8 + lvl * 4;
        ctx.fillStyle = "#1f1f2e";
        ctx.fillRect(nexusX + dx - 2.5, nexusY + dy - h, 5, h);
        ctx.fillStyle = "#a78bfa";
        ctx.shadowColor = "#a78bfa"; ctx.shadowBlur = 6;
        ctx.fillRect(nexusX + dx - 2.5, nexusY + dy - h, 5, 2);
        ctx.shadowBlur = 0;
      }
      // core
      const pulse = 0.7 + Math.sin(t * 2) * 0.3;
      ctx.fillStyle = `rgba(196, 181, 253, ${pulse})`;
      ctx.shadowColor = "#a78bfa"; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(nexusX, nexusY, 6 + lvl, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // label
      ctx.font = "8px monospace";
      ctx.fillStyle = "#c4b5fd";
      ctx.fillText(`NEXUS · BASE LVL ${lvl}`, nexusX - 38, nexusY + baseR + 14);

      // Particles
      const toRemove = new Set<number>();
      particles.forEach((p) => {
        if (p.type === "PURIFIED_BEAM") {
          const dx = nexusX - p.x, dy = nexusY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 8) {
            toRemove.add(p.id);
            setDatTokens((v) => v + 1);
            return;
          }
          p.x += (dx / dist) * 4;
          p.y += (dy / dist) * 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = "#10b981";
          ctx.fill();
          return;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        if (BAD_TYPES.includes(p.type)) {
          const flick = Math.random() > 0.85;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((performance.now() / 400 + p.id) % (Math.PI * 2));
          ctx.fillStyle = flick ? "#fca5a5" : "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 8;
          ctx.fillRect(-3, -3, 6, 6);
          ctx.fillStyle = "#000";
          ctx.fillRect(-2, -0.5, 4, 1);
          ctx.restore();
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#a78bfa";
          ctx.shadowColor = "#a78bfa";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
      particles = particles.filter((p) => !toRemove.has(p.id));

      // Bots
      const updates: Partial<Bot>[] = botsRef.map((bot) => {
        let target: Particle | null = null;
        let closest = 220;
        particles.forEach((p) => {
          if (p.type === "PURIFIED_BEAM") return;
          // Swarm bots are omnivores; others biased to their type
          if (bot.role === "Sifter" && !BAD_TYPES.includes(p.type) && Math.random() < 0.4) return;
          const d = Math.hypot(p.x - bot.x, p.y - bot.y);
          if (d < closest) { closest = d; target = p; }
        });
        let nX = bot.x, nY = bot.y;
        let badAdd = 0, goodAdd = 0;
        if (target) {
          const tg = target as Particle;
          nX += ((tg.x - bot.x) / closest) * bot.rate;
          nY += ((tg.y - bot.y) / closest) * bot.rate;
          if (closest < 10) {
            particles = particles.filter((p) => p.id !== tg.id);
            if (BAD_TYPES.includes(tg.type)) {
              badAdd = 1;
              particles.push({ id: nextId++, x: bot.x, y: bot.y, vx: 0, vy: 0, type: "PURIFIED_BEAM" });
            } else {
              goodAdd = 1;
              setDatTokens((v) => v + 5 + bot.tier * 2);
            }
            particles.push({
              id: nextId++, x: Math.random() * canvas.width, y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5,
              type: TYPES[Math.floor(Math.random() * TYPES.length)],
            });
          }
        } else {
          nX += (Math.random() - 0.5) * 1.2;
          nY += (Math.random() - 0.5) * 1.2;
        }
        nX = Math.max(10, Math.min(canvas.width - 10, nX));
        nY = Math.max(10, Math.min(canvas.height - 10, nY));

        const color = ROLE_COLOR[bot.role];
        const scale = 1 + (bot.tier - 1) * 0.25;
        const bob = Math.sin(performance.now() / 180 + bot.id) * 0.8;
        const cx = nX;
        const cy = nY + bob;
        // shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 11 * scale, 10 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        // treads
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(cx - 11 * scale, cy + 5 * scale, 22 * scale, 5 * scale);
        ctx.fillStyle = "#0b0f17";
        for (let tt = 0; tt < 4; tt++) ctx.fillRect(cx - 10 * scale + tt * 6 * scale, cy + 6 * scale, 3 * scale, 3 * scale);
        // body
        ctx.fillStyle = bot.tier >= 2 ? "#94a3b8" : "#cbd5e1";
        ctx.fillRect(cx - 8 * scale, cy - 2 * scale, 16 * scale, 8 * scale);
        // tier plating (gold/violet trim)
        if (bot.tier >= 2) {
          ctx.fillStyle = bot.tier === 3 ? "#a78bfa" : "#c4b5fd";
          ctx.fillRect(cx - 8 * scale, cy - 2 * scale, 16 * scale, 1.5);
        }
        // chest light
        ctx.fillStyle = color;
        ctx.fillRect(cx - 2 * scale, cy + 1 * scale, 4 * scale, 2 * scale);
        // head
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(cx - 6 * scale, cy - 9 * scale, 12 * scale, 7 * scale);
        // eye visor
        ctx.fillStyle = "#000";
        ctx.fillRect(cx - 5 * scale, cy - 7 * scale, 10 * scale, 3 * scale);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillRect(cx - 4 * scale, cy - 6 * scale, 3 * scale, 1.5 * scale);
        ctx.fillRect(cx + 1 * scale, cy - 6 * scale, 3 * scale, 1.5 * scale);
        ctx.shadowBlur = 0;
        // antenna (taller per tier)
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 4 * scale, cy - 9 * scale);
        ctx.lineTo(cx + 7 * scale, cy - (14 + bot.tier * 2) * scale);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx + 7 * scale, cy - (14 + bot.tier * 2) * scale, 1.6 * scale, 0, Math.PI * 2);
        ctx.fill();
        // tier pips
        for (let k = 0; k < bot.tier; k++) {
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(cx - 8 * scale + k * 3, cy - 11 * scale, 2, 1.5);
        }
        // role label
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "7px monospace";
        ctx.fillText(`${bot.role.slice(0, 4).toUpperCase()}·MK${bot.tier}`, cx - 14 * scale, cy + 18 * scale);

        return { x: nX, y: nY, badEaten: bot.badEaten + badAdd, goodCollected: bot.goodCollected + goodAdd };
      });
      botsRef = botsRef.map((b, i) => {
        const newXp = b.xp + ((updates[i].badEaten! - b.badEaten) + (updates[i].goodCollected! - b.goodCollected)) * 15;
        const newTier = tierForXp(newXp);
        const newRate = b.rate < (1.8 + newTier * 0.8) ? b.rate + 0.0008 : b.rate;
        return {
          ...b, ...updates[i],
          xp: newXp,
          tier: Math.min(TIER_CAP, newTier) as 1 | 2 | 3,
          rate: newRate,
          energy: Math.max(15, b.energy - ((updates[i].badEaten! - b.badEaten) + (updates[i].goodCollected! - b.goodCollected)) * 0.4),
          mood: b.energy < 40 ? "Stable" : (updates[i].badEaten! - b.badEaten) > 0 ? "Aggressive" : "Optimal",
        } as Bot;
      });

      animId = requestAnimationFrame(loop);
    };
    loop();
    const sync = setInterval(() => setBots([...botsRef]), 180);
    return () => { cancelAnimationFrame(animId); clearInterval(sync); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              BOT_WORLD // DEPLOYMENT FEED · BASE LVL {baseLevel}/5
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
              Metabolic Data Canvas.
            </h3>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
              Autonomous agents hunt corrupt particles, transmute them into purified beams,
              and channel them into the Nexus core — minting $DAT in exchange for noise.
              Each MK-tier evolves the bot's speed, plating, and payout multiplier.
            </p>
          </div>
          <div className="border border-accent/30 bg-accent/5 px-6 py-4 text-right font-mono">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">MINTER_BALANCE</div>
            <div className="text-2xl font-black tracking-[-0.02em] text-accent">{datTokens} <span className="text-xs text-muted-foreground">$DAT</span></div>
          </div>
        </div>

        <div className="glass-panel relative overflow-hidden rounded-sm">
          <canvas ref={canvasRef} className="block w-full" style={{ height: 360 }} />
          <div className="scan-effect pointer-events-none absolute inset-0" />
          <div className="absolute top-3 left-3 font-mono text-[10px] text-chrome">
            CENTRAL_BASE · LVL {baseLevel}/5 · TOTAL_XP {Math.floor(totalXp)}
          </div>
        </div>

        <div className="mt-px grid gap-px md:grid-cols-5">
          {bots.map((b) => (
            <div key={b.id} className="border border-white/5 bg-card/40 p-5">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                  BOT_0x0{b.id}
                </div>
                <span className={`font-mono text-[9px] ${b.mood === "Aggressive" ? "text-red-400" : b.mood === "Stable" ? "text-amber-400" : "text-accent"}`}>
                  {b.mood}
                </span>
              </div>
              <div className="mt-2 font-mono text-[10px] text-white">{TIER_NAMES[b.role][b.tier - 1]}</div>
              <div className="mt-1 h-1 w-full bg-white/5">
                <div className="h-full bg-accent" style={{ width: `${Math.min(100, (b.xp % 200) / 2)}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px]">
                <div><div className="text-muted-foreground">XP</div><div className="text-white">{Math.floor(b.xp)}</div></div>
                <div><div className="text-muted-foreground">EATEN</div><div className="text-red-400">{b.badEaten}</div></div>
                <div><div className="text-muted-foreground">MINTED</div><div className="text-accent">{b.goodCollected}</div></div>
              </div>
            </div>
          ))}
        </div>

        <SwarmRecruiter onSigned={(amt) => setDatTokens((v) => v + amt)} />
        <AlgorithmContracts totalXp={totalXp} onPayout={(amt) => setDatTokens((v) => v + amt)} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SWARM RECRUITER — bots autonomously sign companies into the network
// ---------------------------------------------------------------------------
const PROSPECT_POOL = [
  "Helios Labs", "Northgate Foundry", "Orbital Logistics Co.", "Vantablack Capital",
  "Cinder & Loom", "Pale Horse Robotics", "Stratos Freight", "Meridian Biotech",
  "Kasai Energy", "Hexapod Systems", "Obsidian Trust", "Polaris Optics",
  "Verdant Compute", "Iron Ledger", "Quanta Postal", "Nimbus Maritime",
  "Cobalt & Sons", "Tessera Foods", "Apex Filament", "Lumen Aerospace",
];
const SECTORS = ["Logistics", "Energy", "Compute", "Bio", "Optics", "Finance", "Foundry", "Freight"];

interface Prospect { id: number; name: string; sector: string; status: "PROSPECTING" | "NEGOTIATING" | "SIGNED"; bot: string; reward: number; }

function SwarmRecruiter({ onSigned }: { onSigned: (amt: number) => void }) {
  const [feed, setFeed] = useState<Prospect[]>([]);
  const [signedCount, setSignedCount] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);
  const idRef = useRef(1);

  useEffect(() => {
    const v = window.localStorage.getItem("quantara.signed");
    if (v) setSignedCount(parseInt(v, 10) || 0);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) window.localStorage.setItem("quantara.signed", String(signedCount));
  }, [signedCount, hydrated]);

  useEffect(() => {
    const tick = setInterval(() => {
      const name = PROSPECT_POOL[Math.floor(Math.random() * PROSPECT_POOL.length)];
      const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
      const bot = ["Harvester", "Sifter", "Stabilizer", "Swarm"][Math.floor(Math.random() * 4)];
      const newP: Prospect = { id: idRef.current++, name, sector, status: "PROSPECTING", bot, reward: Math.floor(Math.random() * 120) + 30 };
      setFeed((f) => [newP, ...f].slice(0, 8));

      setTimeout(() => {
        setFeed((f) => f.map((p) => p.id === newP.id ? { ...p, status: "NEGOTIATING" } : p));
      }, 900);
      setTimeout(() => {
        setFeed((f) => f.map((p) => p.id === newP.id ? { ...p, status: "SIGNED" } : p));
        setSignedCount((c) => c + 1);
        onSigned(newP.reward);
      }, 1900);
    }, 1600);
    return () => clearInterval(tick);
  }, [onSigned]);

  return (
    <div className="mt-px border border-white/5 bg-card/40 p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">SWARM_RECRUITER // OUTBOUND</div>
          <div className="mt-1 text-lg font-bold text-white">Autonomous Acquisition Feed</div>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">
          SIGNED <span className="text-accent text-base font-bold">{signedCount}</span> · ROI minted to $DAT
        </div>
      </div>
      <div className="space-y-1">
        {feed.length === 0 && (
          <div className="py-6 text-center font-mono text-[10px] text-muted-foreground">// initializing outbound scouts...</div>
        )}
        {feed.map((p) => (
          <div key={p.id} className="grid grid-cols-12 items-center gap-2 border-l-2 px-3 py-2 font-mono text-[10px]"
               style={{ borderColor: p.status === "SIGNED" ? "#10b981" : p.status === "NEGOTIATING" ? "#f59e0b" : "#a78bfa" }}>
            <div className="col-span-4 text-white truncate">{p.name}</div>
            <div className="col-span-2 text-muted-foreground">{p.sector}</div>
            <div className="col-span-2 text-chrome">via {p.bot[0]}</div>
            <div className={`col-span-2 ${p.status === "SIGNED" ? "text-emerald-400" : p.status === "NEGOTIATING" ? "text-amber-400" : "text-accent"}`}>
              {p.status}
            </div>
            <div className="col-span-2 text-right text-accent">+{p.reward} $DAT</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ALGORITHM CONTRACTS — higher-payout tasks the swarm grinds autonomously
// ---------------------------------------------------------------------------
const CONTRACTS = [
  { name: "Sift Genome Index δ-7",         tier: "S", base: 480, diff: "EXPERT"   },
  { name: "Stabilize Bridge Causeway 14",  tier: "A", base: 260, diff: "HARD"     },
  { name: "Decrypt Lost-Archive 0xLLM",    tier: "S", base: 540, diff: "EXPERT"   },
  { name: "Purge Duplicate Census 1850",   tier: "B", base: 140, diff: "STANDARD" },
  { name: "Recalibrate Nexus Spire 03",    tier: "A", base: 300, diff: "HARD"     },
  { name: "Compile Materials Lattice κ",   tier: "S", base: 620, diff: "EXPERT"   },
  { name: "Index Pre-Collapse Ledger",     tier: "B", base: 120, diff: "STANDARD" },
  { name: "Forge Algorithmic Protein Map", tier: "S", base: 700, diff: "EXPERT"   },
];

interface RunningContract { id: number; idx: number; progress: number; assigned: string; }

function AlgorithmContracts({ totalXp, onPayout }: { totalXp: number; onPayout: (amt: number) => void }) {
  const [running, setRunning] = useState<RunningContract[]>([]);
  const [done, setDone] = useState(0);
  const [earned, setEarned] = useState(0);
  const idRef = useRef(1);
  const mult = 1 + Math.floor(totalXp / 500) * 0.25; // bonus from base-level

  useEffect(() => {
    const spawn = setInterval(() => {
      setRunning((r) => {
        if (r.length >= 4) return r;
        const idx = Math.floor(Math.random() * CONTRACTS.length);
        const assigned = ["Harvester", "Sifter", "Stabilizer", "Swarm"][Math.floor(Math.random() * 4)];
        return [...r, { id: idRef.current++, idx, progress: 0, assigned }];
      });
    }, 2200);
    const tick = setInterval(() => {
      setRunning((r) => {
        const next: RunningContract[] = [];
        for (const c of r) {
          const np = c.progress + Math.random() * 6 + 2;
          if (np >= 100) {
            const payout = Math.floor(CONTRACTS[c.idx].base * mult);
            onPayout(payout);
            setDone((d) => d + 1);
            setEarned((e) => e + payout);
          } else {
            next.push({ ...c, progress: np });
          }
        }
        return next;
      });
    }, 320);
    return () => { clearInterval(spawn); clearInterval(tick); };
  }, [onPayout, mult]);

  return (
    <div className="mt-px border border-accent/20 bg-accent/[0.03] p-6">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">ALGORITHM_CONTRACTS // HIGH_PAYOUT</div>
          <div className="mt-1 text-lg font-bold text-white">Autonomous Job Board</div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">
            base-level multiplier <span className="text-accent">×{mult.toFixed(2)}</span> · evolves with Nexus
          </div>
        </div>
        <div className="text-right font-mono text-[10px] text-muted-foreground">
          COMPLETED <span className="text-accent text-base font-bold">{done}</span><br />
          PAID <span className="text-accent">{earned}</span> $DAT
        </div>
      </div>
      <div className="space-y-2">
        {running.length === 0 && (
          <div className="py-6 text-center font-mono text-[10px] text-muted-foreground">// dispatching swarm to next contract...</div>
        )}
        {running.map((c) => {
          const job = CONTRACTS[c.idx];
          return (
            <div key={c.id} className="border border-white/5 bg-background/60 px-3 py-2 font-mono text-[10px]">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <span className="mr-2 inline-block min-w-[18px] border border-accent/40 px-1 text-center text-accent">{job.tier}</span>
                  {job.name}
                </div>
                <div className="text-accent">+{Math.floor(job.base * mult)} $DAT</div>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <div className="text-chrome">{job.diff} · via {c.assigned}</div>
                <div className="h-1 flex-1 bg-white/5">
                  <div className="h-full bg-accent transition-all" style={{ width: `${c.progress}%` }} />
                </div>
                <div className="text-muted-foreground">{Math.floor(c.progress)}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// JS ACADEMY
// ---------------------------------------------------------------------------
const ACADEMY = [
  {
    title: "Tier 0 · Syntactic Primaries",
    skills: [
      { name: "Variables", lesson: "Declare a variable using 'let'.", prompt: "Create a let named executionFactor equal to 137.", regex: /let\s+executionFactor\s*=\s*137/ },
      { name: "Loops", lesson: "Iterate with a for loop.", prompt: "Write: for (let i = 0; i < 5; i++)", regex: /for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*5/ },
      { name: "Functions", lesson: "Encapsulate logic in a function.", prompt: "Define function compileNode() that returns 0.", regex: /function\s+compileNode\s*\(\s*\)\s*\{\s*return\s+0/ },
    ],
  },
  {
    title: "Tier 1 · Array Sifting",
    skills: [
      { name: "Arrays", lesson: "Store linear collections.", prompt: "Declare: const blocks = [0, 1, 137]", regex: /const\s+blocks\s*=\s*\[\s*0\s*,\s*1\s*,\s*137\s*\]/ },
      { name: "Filter", lesson: "Filter corrupt records.", prompt: "Write: logs.filter(item => item.isCorrupt)", regex: /logs\.filter\(\s*item\s*=>\s*item\.isCorrupt\s*\)/ },
      { name: "Map", lesson: "Transform a matrix.", prompt: "Write: matrix.map(v => v * 2)", regex: /matrix\.map\(\s*v\s*=>\s*v\s*\*\s*2\s*\)/ },
    ],
  },
  {
    title: "Tier 2 · Async Systems",
    skills: [
      { name: "Async", lesson: "Defer execution with async.", prompt: "Define: async function fetchCore() {}", regex: /async\s+function\s+fetchCore\s*\(\s*\)/ },
      { name: "Classes", lesson: "Blueprint object factories.", prompt: "Build: class Cortex {}", regex: /class\s+Cortex\s*\{\s*\}/ },
      { name: "Fetch", lesson: "Route external footprints.", prompt: "Call: fetch('/api/node')", regex: /fetch\(\s*['"]\/api\/node['"]\s*\)/ },
    ],
  },
];

export function JsAcademy() {
  const [tier, setTier] = useState(0);
  const [skill, setSkill] = useState(0);
  const [code, setCode] = useState("");
  const [out, setOut] = useState<{ state: "idle" | "success" | "fail"; text: string }>({ state: "idle", text: "" });
  const active = ACADEMY[tier].skills[skill];

  const test = () => {
    if (active.regex.test(code)) {
      setOut({ state: "success", text: "SUCCESS // MATRIX VALIDATED. SYSTEM LEVEL UP." });
    } else {
      setOut({ state: "fail", text: "ERROR · Code structure mismatch. Check exact naming and assignment syntax." });
    }
  };

  return (
    <section className="border-t border-white/5 bg-[oklch(0.1_0.01_280)] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-xl">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            COGNITIVE DEVELOPMENT LAB
          </span>
          <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            JS Academy Terminal.
          </h3>
        </div>

        <div className="grid gap-px md:grid-cols-12">
          <aside className="md:col-span-3 border border-white/5 bg-card/40 p-5 space-y-5">
            {ACADEMY.map((t, tIdx) => (
              <div key={t.title}>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome">{t.title}</div>
                <div className="space-y-1">
                  {t.skills.map((s, sIdx) => {
                    const isActive = tier === tIdx && skill === sIdx;
                    return (
                      <button
                        key={s.name}
                        onClick={() => { setTier(tIdx); setSkill(sIdx); setCode(""); setOut({ state: "idle", text: "" }); }}
                        className={`block w-full text-left font-mono text-[10px] py-1 ${isActive ? "text-accent font-bold" : "text-muted-foreground hover:text-white"}`}
                      >
                        ■ {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </aside>

          <div className="md:col-span-9 border border-white/5 bg-card/40 p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">Lesson Core</div>
            <div className="mt-1 text-lg font-bold text-white">{active.lesson}</div>
            <div className="mt-4 rounded-sm border border-white/5 bg-background p-3 font-mono text-xs text-muted-foreground">
              <span className="text-accent">PROMPT &gt;</span> {active.prompt}
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// enter execution script..."
              spellCheck={false}
              className="mt-3 w-full h-28 rounded-sm border border-white/5 bg-background p-3 font-mono text-xs text-emerald-400 outline-none focus:border-accent/30 resize-none"
            />
            <div className="mt-3 flex items-center gap-3">
              <button onClick={test} className="bg-foreground px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-background hover:bg-chrome">
                Compile Script
              </button>
              {out.text && (
                <span className={`font-mono text-[10px] ${out.state === "success" ? "text-emerald-400" : "text-red-400"}`}>
                  {out.text}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// AXIOM AI LAB
// ---------------------------------------------------------------------------
const BLUEPRINTS = [
  { id: "strat", name: "Strategy Advisor", pre: "Optimize core allocation vectors for zero-noise throughput:" },
  { id: "week", name: "Week Planner", pre: "Map computational sprints across local nodes:" },
  { id: "viral", name: "Viral Content", pre: "Translate raw architecture into high-impact narrative tracks:" },
  { id: "email", name: "Email Writer", pre: "Draft a formal data transmission protocol:" },
  { id: "meet", name: "Meeting System", pre: "Orchestrate decentralized scheduling across layers:" },
  { id: "build", name: "Systems Builder", pre: "Align unallocated footprints with high-integrity models:" },
  { id: "res", name: "Research Team", pre: "Investigate electron-photon vertex interaction orders:" },
  { id: "arch", name: "Framework Architect", pre: "Model micro-scale tunneling thresholds across:" },
];

export function AxiomLab() {
  const [active, setActive] = useState("strat");
  const [ctx, setCtx] = useState("");
  const [feed, setFeed] = useState("");
  const [load, setLoad] = useState(false);
  const module = BLUEPRINTS.find((m) => m.id === active)!;

  const run = () => {
    if (!ctx.trim() || load) return;
    setLoad(true);
    setFeed("");
    const full =
      `[TRANSMISSION_OK · ${module.name.toUpperCase()}]\n` +
      `> objective: "${ctx.trim()}"\n` +
      `> seed: 0x${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}\n\n` +
      `${module.pre}\n` +
      ` 1. parsing operator intent across ${Math.floor(Math.random() * 40) + 12} matrix lanes\n` +
      ` 2. cross-checking against ancestral archive (8.4 PB indexed)\n` +
      ` 3. resolving zero-noise vector → INTEGRITY 100.0%\n\n` +
      `> telemetry confirms successful calibration.\n` +
      `> grid reward: +${Math.floor(Math.random() * 200) + 80} cycles minted to operator.\n` +
      `[END_OF_TRANSMISSION]`;
    let i = 0;
    const stream = setInterval(() => {
      i += Math.max(1, Math.floor(full.length / 90));
      setFeed(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(stream);
        setLoad(false);
      }
    }, 24);
  };

  return (
    <section className="border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-xl">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            PROMPT COMMAND SUITE
          </span>
          <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            AXIOM AI Lab Modules.
          </h3>
        </div>

        <div className="grid gap-px md:grid-cols-12">
          <div className="md:col-span-4 grid grid-cols-2 gap-px self-start">
            {BLUEPRINTS.map((m) => (
              <button
                key={m.id}
                onClick={() => { setActive(m.id); setFeed(""); }}
                className={`border p-3 text-left font-mono text-[10px] transition-colors ${
                  active === m.id
                    ? "border-accent/50 bg-accent/10 text-white"
                    : "border-white/5 bg-card/40 text-muted-foreground hover:text-white"
                }`}
              >
                ⚙ {m.name}
              </button>
            ))}
          </div>

          <div className="md:col-span-8 border border-white/5 bg-card/40 p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
              Pre-wired Constraint Logic
            </div>
            <div className="mt-2 rounded-sm border border-white/5 bg-background p-3 font-mono text-xs text-accent">
              {module.pre}
            </div>
            <textarea
              value={ctx}
              onChange={(e) => setCtx(e.target.value)}
              placeholder="Enter parameters or execution scenarios..."
              className="mt-3 w-full h-24 rounded-sm border border-white/5 bg-background p-3 font-mono text-xs text-white outline-none focus:border-accent/30 resize-none"
            />
            <button
              onClick={run}
              disabled={load}
              className="mt-3 bg-foreground px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-background hover:bg-chrome disabled:opacity-50"
            >
              {load ? "Syncing Vectors..." : "Transmit Execution"}
            </button>

            <div className="mt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                Matrix Output
              </div>
              <pre className="mt-2 min-h-[120px] whitespace-pre-wrap rounded-sm border border-white/5 bg-background p-3 font-mono text-[11px] leading-relaxed text-emerald-400">
                {feed || "// awaiting operator input streams..."}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
