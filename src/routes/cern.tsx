import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { logLedger } from "@/lib/learning-ledger";
import { creditDat } from "@/lib/dat-tokens";

export const Route = createFileRoute("/cern")({
  component: CernPocket,
  head: () => ({
    meta: [
      { title: "CERN-in-a-Pocket — Quantara Particle Separator" },
      { name: "description", content: "Run atomic particle collision simulations in a pocket-scale CERN module. Configure beam energy, particles, and separator field." },
      { property: "og:title", content: "CERN-in-a-Pocket — Quantara" },
      { property: "og:description", content: "Pocket-scale atomic particle separator simulator." },
    ],
  }),
});

type Particle = {
  id: number;
  kind: "proton" | "electron" | "neutron" | "muon" | "quark";
  x: number; y: number;
  vx: number; vy: number;
  charge: -1 | 0 | 1;
  mass: number;
  life: number;
  hue: number;
};

const PARTICLE_DEF = {
  proton:   { charge: 1 as const,  mass: 938.3, hue: 195 },
  electron: { charge: -1 as const, mass: 0.511, hue: 50 },
  neutron:  { charge: 0 as const,  mass: 939.6, hue: 280 },
  muon:     { charge: -1 as const, mass: 105.7, hue: 320 },
  quark:    { charge: 1 as const,  mass: 4.2,   hue: 150 },
};

function CernPocket() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [energy, setEnergy] = useState(7);       // TeV
  const [field, setField] = useState(0.8);       // separator field strength
  const [beam, setBeam] = useState<keyof typeof PARTICLE_DEF>("proton");
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({ collisions: 0, separated: 0, runs: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const seqRef = useRef(1);

  // Simulation loop
  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * devicePixelRatio;
      cvs.height = r.height * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(33, t - last) / 16.67;
      last = t;
      const W = cvs.width, H = cvs.height;
      // fade trails
      ctx.fillStyle = "rgba(2, 4, 12, 0.18)";
      ctx.fillRect(0, 0, W, H);

      if (running) {
        // ring guides
        ctx.strokeStyle = "rgba(0,255,204,0.10)";
        ctx.lineWidth = 1 * devicePixelRatio;
        ctx.beginPath();
        ctx.arc(W/2, H/2, Math.min(W,H)*0.42, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W/2, H/2, Math.min(W,H)*0.18, 0, Math.PI*2);
        ctx.stroke();

        // separator field axis
        ctx.strokeStyle = `rgba(255, 80, 180, ${0.15 + field*0.35})`;
        ctx.beginPath();
        ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H);
        ctx.stroke();

        // tick particles
        const arr = particlesRef.current;
        const next: Particle[] = [];
        let collisions = 0, separated = 0;
        for (const p of arr) {
          // Lorentz-ish: B field along z deflects charged perpendicular
          const ax = 0;
          const ay = -p.charge * field * 0.05 * (p.vx);
          p.vx += ax * dt;
          p.vy += ay * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;
          // detect separation crossings
          if (p.charge !== 0 && Math.abs(p.x - W/2) < 2 && p.life > 5) separated++;
          // draw
          ctx.fillStyle = `hsla(${p.hue}, 95%, 60%, 0.95)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2 * devicePixelRatio, 0, Math.PI*2);
          ctx.fill();
          // glow
          ctx.fillStyle = `hsla(${p.hue}, 95%, 60%, 0.18)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6 * devicePixelRatio, 0, Math.PI*2);
          ctx.fill();
          if (p.x > -10 && p.x < W+10 && p.y > -10 && p.y < H+10 && p.life > 0) next.push(p);
        }
        // pair collisions sample
        for (let i = 0; i < next.length; i++) {
          for (let j = i+1; j < Math.min(next.length, i+6); j++) {
            const dx = next[i].x - next[j].x;
            const dy = next[i].y - next[j].y;
            if (dx*dx + dy*dy < (4*devicePixelRatio)**2) {
              collisions++;
              const cx = (next[i].x+next[j].x)/2, cy=(next[i].y+next[j].y)/2;
              ctx.fillStyle = "rgba(255,255,200,0.9)";
              ctx.beginPath();
              ctx.arc(cx, cy, 10*devicePixelRatio, 0, Math.PI*2);
              ctx.fill();
              next[i].life = 0; next[j].life = 0;
              // spawn shrapnel
              for (let k = 0; k < 4; k++) {
                const a = Math.random()*Math.PI*2;
                next.push(makeParticle(cx, cy, Math.cos(a)*2, Math.sin(a)*2, "quark"));
              }
            }
          }
        }
        particlesRef.current = next.filter(p => p.life > 0);
        if (collisions || separated) {
          setStats((s) => ({
            collisions: s.collisions + collisions,
            separated: s.separated + separated,
            runs: s.runs,
          }));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [running, field]);

  const makeParticle = (x: number, y: number, vx: number, vy: number, kind: keyof typeof PARTICLE_DEF): Particle => {
    const d = PARTICLE_DEF[kind];
    return {
      id: seqRef.current++,
      kind, x, y, vx, vy,
      charge: d.charge, mass: d.mass,
      life: 200 + Math.random()*120,
      hue: d.hue,
    };
  };

  const fire = () => {
    const cvs = canvasRef.current!;
    const W = cvs.width, H = cvs.height;
    const v = 1.5 + energy * 0.3;
    // two opposing beams
    for (let i = 0; i < 24; i++) {
      const y = H/2 + (Math.random()-0.5) * H * 0.08;
      particlesRef.current.push(makeParticle(20, y,  v, (Math.random()-0.5)*0.1, beam));
      particlesRef.current.push(makeParticle(W-20, y, -v, (Math.random()-0.5)*0.1, beam));
    }
    setStats((s) => ({ ...s, runs: s.runs + 1 }));
    const reward = Math.round(2 + energy);
    creditDat(reward);
    logLedger("benchmark", `CERN run · ${beam} @ ${energy.toFixed(1)} TeV`, { field, reward });
  };

  const clear = () => { particlesRef.current = []; };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-mono text-xs uppercase tracking-widest text-white/70 hover:text-white">← Quantara</Link>
        <div className="font-mono text-[11px] uppercase tracking-widest text-cyan-300">CERN-in-a-Pocket · Particle Separator</div>
        <Link to="/interstellar" className="font-mono text-[11px] uppercase tracking-widest text-violet-300 hover:text-white">Interstellar →</Link>
      </header>

      <section className="grid gap-4 p-4 md:grid-cols-[1fr_320px]">
        <div className="relative rounded-md border border-white/10 bg-black overflow-hidden" style={{ aspectRatio: "16/10" }}>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          <div className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-widest text-cyan-300/90">
            Beam · {beam.toUpperCase()} · {energy.toFixed(2)} TeV
          </div>
          <div className="absolute right-3 top-3 font-mono text-[10px] text-pink-300/90">
            Field B = {field.toFixed(2)} T
          </div>
          <div className="absolute right-3 bottom-3 font-mono text-[10px] text-white/70">
            collisions {stats.collisions} · separated {stats.separated} · runs {stats.runs}
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-white/[0.02] p-4 space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-white/60">Particle</label>
            <div className="mt-2 grid grid-cols-3 gap-1">
              {(Object.keys(PARTICLE_DEF) as Array<keyof typeof PARTICLE_DEF>).map((k) => (
                <button key={k}
                  onClick={() => setBeam(k)}
                  className={`rounded border px-2 py-1 text-[10px] uppercase tracking-widest ${beam===k ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" : "border-white/15 text-white/70 hover:text-white"}`}>
                  {k}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-white/60">Beam energy · {energy.toFixed(2)} TeV</label>
            <input type="range" min={0.5} max={14} step={0.1} value={energy}
              onChange={(e) => setEnergy(parseFloat(e.target.value))} className="mt-2 w-full" />
          </div>
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest text-white/60">Separator field · {field.toFixed(2)} T</label>
            <input type="range" min={0} max={2} step={0.05} value={field}
              onChange={(e) => setField(parseFloat(e.target.value))} className="mt-2 w-full" />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={fire} className="flex-1 rounded border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-mono uppercase tracking-widest text-cyan-200 hover:bg-cyan-400/20">
              Fire Beams
            </button>
            <button onClick={() => setRunning((r) => !r)} className="rounded border border-white/15 px-3 py-2 text-xs font-mono uppercase tracking-widest text-white/80 hover:bg-white/5">
              {running ? "Pause" : "Resume"}
            </button>
            <button onClick={clear} className="rounded border border-white/15 px-3 py-2 text-xs font-mono uppercase tracking-widest text-white/80 hover:bg-white/5">
              Clear
            </button>
          </div>
          <div className="rounded border border-white/10 bg-black/40 p-2 font-mono text-[10px] text-white/60 leading-relaxed">
            <div className="text-cyan-300 mb-1">PROTOCOL</div>
            Two beams of <span className="text-white">{beam}</span> are accelerated and crossed at the
            interaction point. The vertical magnetic field <span className="text-pink-300">B</span> deflects
            charged products by Lorentz force, separating tracks by charge·momentum. Collisions emit
            shrapnel quarks. Each run is recorded to your Learning Ledger and credits <span className="text-amber-300">$DAT</span>.
          </div>
        </div>
      </section>
    </main>
  );
}
