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
  const [datTokens, setDatTokens] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const v = window.localStorage.getItem("quantara.datTokens");
    return v ? parseInt(v, 10) || 0 : 0;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("quantara.datTokens", String(datTokens));
    }
  }, [datTokens]);
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
        ctx.beginPath();
        if (BAD_TYPES.includes(p.type)) {
          ctx.moveTo(p.x, p.y - 4);
          ctx.lineTo(p.x + 3, p.y - 1);
          ctx.lineTo(p.x + 5, p.y + 2);
          ctx.lineTo(p.x, p.y + 5);
          ctx.lineTo(p.x - 3, p.y + 1);
          ctx.closePath();
          ctx.fillStyle = "#ef4444";
        } else {
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#a78bfa";
        }
        ctx.fill();
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

        ctx.beginPath();
        ctx.arc(nX, nY, 7, 0, Math.PI * 2);
        ctx.fillStyle = bot.role === "Harvester" ? "#f43f5e" : bot.role === "Sifter" ? "#3b82f6" : "#10b981";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "7px monospace";
        ctx.fillText(bot.role[0], nX - 2, nY + 2.5);

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
    const sync = setInterval(() => setBots([...botsRef]), 400);
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
      </div>
    </section>
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
    if (!ctx.trim()) return;
    setLoad(true);
    setTimeout(() => {
      setFeed(
        `[TRANSMISSION_OK]\nMatrix result for objective: "${ctx}"\n\n` +
        `> Telemetry confirms successful calibration.\n` +
        `> Zero rounding faults detected.\n` +
        `> Platform reward: +150 grid cycles minted to operator.`
      );
      setLoad(false);
    }, 1100);
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
