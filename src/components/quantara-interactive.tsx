import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// SIMULATION CANVAS — Bots eating bad data
// ---------------------------------------------------------------------------
type ParticleType = "CORRUPT" | "DUPE" | "NOISE" | "CLEAN" | "INSIGHT" | "SIGNAL" | "PURIFIED_BEAM";
interface Particle { id: number; x: number; y: number; vx: number; vy: number; type: ParticleType; }
interface Bot {
  id: number; x: number; y: number;
  role: "Harvester" | "Sifter" | "Stabilizer";
  badEaten: number; goodCollected: number; energy: number;
  mood: "Optimal" | "Aggressive" | "Stable"; xp: number; rate: number;
}

const BAD_TYPES: ParticleType[] = ["CORRUPT", "DUPE", "NOISE"];
const TYPES: ParticleType[] = ["CORRUPT", "DUPE", "NOISE", "CLEAN", "INSIGHT", "SIGNAL"];

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
    { id: 1, x: 150, y: 120, role: "Harvester", badEaten: 0, goodCollected: 0, energy: 100, mood: "Optimal", xp: 0, rate: 2.2 },
    { id: 2, x: 450, y: 280, role: "Sifter", badEaten: 0, goodCollected: 0, energy: 95, mood: "Optimal", xp: 0, rate: 3.5 },
    { id: 3, x: 300, y: 100, role: "Stabilizer", badEaten: 0, goodCollected: 0, energy: 100, mood: "Stable", xp: 0, rate: 1.8 },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 360;

    let particles: Particle[] = Array.from({ length: 28 }, (_, i) => ({
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

      ctx.strokeStyle = "rgba(167, 139, 250, 0.45)";
      ctx.lineWidth = 1;
      ctx.strokeRect(nexusX - 22, nexusY - 22, 44, 44);
      ctx.fillStyle = "rgba(167, 139, 250, 0.08)";
      ctx.fillRect(nexusX - 18, nexusY - 18, 36, 36);
      ctx.font = "8px monospace";
      ctx.fillStyle = "#c4b5fd";
      ctx.fillText("NEXUS", nexusX - 13, nexusY + 3);

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
          // glitching red data shard
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
          // clean signal orb
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
        let closest = 200;
        particles.forEach((p) => {
          if (p.type === "PURIFIED_BEAM") return;
          const d = Math.hypot(p.x - bot.x, p.y - bot.y);
          if (d < closest) { closest = d; target = p; }
        });
        let nX = bot.x, nY = bot.y;
        let badAdd = 0, goodAdd = 0;
        if (target) {
          const t = target as Particle;
          nX += ((t.x - bot.x) / closest) * bot.rate;
          nY += ((t.y - bot.y) / closest) * bot.rate;
          if (closest < 10) {
            particles = particles.filter((p) => p.id !== t.id);
            if (BAD_TYPES.includes(t.type)) {
              badAdd = 1;
              particles.push({ id: nextId++, x: bot.x, y: bot.y, vx: 0, vy: 0, type: "PURIFIED_BEAM" });
            } else {
              goodAdd = 1;
              setDatTokens((v) => v + 5);
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

        // Little robot rendering: treads, body, head, eye glow, antenna
        const color = bot.role === "Harvester" ? "#f43f5e" : bot.role === "Sifter" ? "#3b82f6" : "#10b981";
        const bob = Math.sin(performance.now() / 180 + bot.id) * 0.8;
        const cx = nX;
        const cy = nY + bob;
        // shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(cx, cy + 11, 10, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // treads
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(cx - 11, cy + 5, 22, 5);
        ctx.fillStyle = "#0b0f17";
        for (let t = 0; t < 4; t++) ctx.fillRect(cx - 10 + t * 6, cy + 6, 3, 3);
        // body
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(cx - 8, cy - 2, 16, 8);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(cx - 8, cy + 4, 16, 1);
        // chest light
        ctx.fillStyle = color;
        ctx.fillRect(cx - 2, cy + 1, 4, 2);
        // head
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(cx - 6, cy - 9, 12, 7);
        // eye visor (glowing)
        ctx.fillStyle = "#000";
        ctx.fillRect(cx - 5, cy - 7, 10, 3);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fillRect(cx - 4, cy - 6, 3, 1.5);
        ctx.fillRect(cx + 1, cy - 6, 3, 1.5);
        ctx.shadowBlur = 0;
        // antenna
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + 4, cy - 9);
        ctx.lineTo(cx + 7, cy - 14);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx + 7, cy - 14, 1.6, 0, Math.PI * 2);
        ctx.fill();
        // role label
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "7px monospace";
        ctx.fillText(bot.role.slice(0, 4).toUpperCase(), cx - 10, cy + 18);

        return { x: nX, y: nY, badEaten: bot.badEaten + badAdd, goodCollected: bot.goodCollected + goodAdd };
      });
      botsRef = botsRef.map((b, i) => ({
        ...b, ...updates[i],
        xp: b.xp + ((updates[i].badEaten! - b.badEaten) + (updates[i].goodCollected! - b.goodCollected)) * 15,
        energy: Math.max(15, b.energy - ((updates[i].badEaten! - b.badEaten) + (updates[i].goodCollected! - b.goodCollected)) * 0.4),
        mood: b.energy < 40 ? "Stable" : (updates[i].badEaten! - b.badEaten) > 0 ? "Aggressive" : "Optimal",
      })) as Bot[];

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
              BOT_WORLD // DEPLOYMENT FEED
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
              Metabolic Data Canvas.
            </h3>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
              Autonomous agents hunt corrupt particles, transmute them into purified beams,
              and channel them into the Nexus core — minting $DAT in exchange for noise.
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
        </div>

        <div className="mt-px grid gap-px md:grid-cols-3">
          {bots.map((b) => (
            <div key={b.id} className="border border-white/5 bg-card/40 p-5">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                  BOT_0x0{b.id} · [{b.role}]
                </div>
                <span className={`font-mono text-[9px] ${b.mood === "Aggressive" ? "text-red-400" : b.mood === "Stable" ? "text-amber-400" : "text-accent"}`}>
                  {b.mood}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px]">
                <div><div className="text-muted-foreground">XP</div><div className="text-white">{b.xp}</div></div>
                <div><div className="text-muted-foreground">EATEN</div><div className="text-red-400">{b.badEaten}</div></div>
                <div><div className="text-muted-foreground">MINTED</div><div className="text-accent">{b.goodCollected}</div></div>
              </div>
            </div>
          ))}
        </div>

        <SwarmRecruiter onSigned={(amt) => setDatTokens((v) => v + amt)} />
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
      const bot = ["Harvester", "Sifter", "Stabilizer"][Math.floor(Math.random() * 3)];
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
