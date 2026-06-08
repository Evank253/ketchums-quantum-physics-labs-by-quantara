// Compact embeddable CERN particle separator for the main page.
import { useEffect, useRef, useState } from "react";
import { logLedger } from "@/lib/learning-ledger";
import { creditDat } from "@/lib/dat-tokens";

type P = {
  x: number; y: number; vx: number; vy: number;
  charge: -1|0|1; life: number; hue: number;
};
const KINDS = {
  proton:   { charge:  1 as const, hue: 195 },
  electron: { charge: -1 as const, hue: 50 },
  neutron:  { charge:  0 as const, hue: 280 },
  muon:     { charge: -1 as const, hue: 320 },
};

export function CernEmbed() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [energy, setEnergy] = useState(7);
  const [field, setField] = useState(0.8);
  const [beam, setBeam] = useState<keyof typeof KINDS>("proton");
  const [stats, setStats] = useState({ collisions: 0, runs: 0 });
  const particles = useRef<P[]>([]);
  const runFlag = useRef(true);

  useEffect(() => {
    const cvs = ref.current!;
    const ctx = cvs.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * devicePixelRatio;
      cvs.height = r.height * devicePixelRatio;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cvs);

    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(33, t - last) / 16.67; last = t;
      const W = cvs.width, H = cvs.height;
      ctx.fillStyle = "rgba(2,4,12,0.22)";
      ctx.fillRect(0,0,W,H);

      // ring + field
      ctx.strokeStyle = "rgba(0,255,204,0.10)";
      ctx.beginPath(); ctx.arc(W/2,H/2, Math.min(W,H)*0.42, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,80,180,${0.15 + field*0.35})`;
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();

      if (runFlag.current) {
        const arr = particles.current;
        const next: P[] = [];
        let coll = 0;
        for (const p of arr) {
          const ay = -p.charge * field * 0.05 * p.vx;
          p.vy += ay * dt;
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          ctx.fillStyle = `hsla(${p.hue},95%,60%,0.95)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 2.2*devicePixelRatio, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = `hsla(${p.hue},95%,60%,0.16)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, 6*devicePixelRatio, 0, Math.PI*2); ctx.fill();
          if (p.x>-10 && p.x<W+10 && p.y>-10 && p.y<H+10 && p.life>0) next.push(p);
        }
        for (let i=0;i<next.length;i++) for (let j=i+1;j<Math.min(next.length,i+5);j++){
          const dx=next[i].x-next[j].x, dy=next[i].y-next[j].y;
          if (dx*dx+dy*dy < (4*devicePixelRatio)**2) {
            coll++;
            const cx=(next[i].x+next[j].x)/2, cy=(next[i].y+next[j].y)/2;
            ctx.fillStyle = "rgba(255,255,200,0.9)";
            ctx.beginPath(); ctx.arc(cx,cy,10*devicePixelRatio,0,Math.PI*2); ctx.fill();
            next[i].life = 0; next[j].life = 0;
          }
        }
        particles.current = next.filter(p => p.life > 0);
        if (coll) setStats(s => ({ collisions: s.collisions + coll, runs: s.runs }));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [field]);

  const fire = () => {
    const cvs = ref.current!;
    const W = cvs.width, H = cvs.height;
    const v = 1.5 + energy * 0.3;
    const k = KINDS[beam];
    for (let i = 0; i < 18; i++) {
      const y = H/2 + (Math.random()-0.5) * H * 0.08;
      particles.current.push({ x: 20, y, vx: v, vy: (Math.random()-0.5)*0.1, charge: k.charge, life: 240, hue: k.hue });
      particles.current.push({ x: W-20, y, vx: -v, vy: (Math.random()-0.5)*0.1, charge: k.charge, life: 240, hue: k.hue });
    }
    setStats(s => ({ ...s, runs: s.runs + 1 }));
    const reward = Math.round(2 + energy);
    creditDat(reward);
    logLedger("benchmark", `CERN run · ${beam} @ ${energy.toFixed(1)} TeV`, { field, reward });
  };

  return (
    <section id="cern-embed" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">In-Page Module</div>
          <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">CERN-in-a-Pocket</h3>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="relative rounded-md border border-white/10 bg-black overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <canvas ref={ref} className="absolute inset-0 h-full w-full" />
            <div className="absolute left-3 top-3 font-mono text-[10px] uppercase tracking-widest text-cyan-300/90">
              Beam · {beam.toUpperCase()} · {energy.toFixed(2)} TeV · B={field.toFixed(2)} T
            </div>
            <div className="absolute right-3 top-3 flex gap-1">
              <button onClick={fire}
                className="rounded border border-cyan-400/60 bg-cyan-400/15 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan-100 hover:bg-cyan-400/25">
                Fire
              </button>
              <button onClick={() => { runFlag.current = !runFlag.current; }}
                className="rounded border border-white/20 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/80 hover:bg-white/10">
                Pause
              </button>
              <button onClick={() => { particles.current = []; setStats({ collisions: 0, runs: 0 }); }}
                className="rounded border border-white/20 bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white/80 hover:bg-white/10">
                Reset
              </button>
            </div>
            <div className="absolute right-3 bottom-3 font-mono text-[10px] text-white/70">
              collisions {stats.collisions} · runs {stats.runs}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/60">Particle</label>
              <div className="mt-2 grid grid-cols-2 gap-1">
                {(Object.keys(KINDS) as Array<keyof typeof KINDS>).map((k) => (
                  <button key={k} onClick={() => setBeam(k)}
                    className={`rounded border px-2 py-1 text-[10px] uppercase tracking-widest ${beam===k?"border-cyan-400 bg-cyan-400/10 text-cyan-200":"border-white/15 text-white/70"}`}>{k}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/60">Energy · {energy.toFixed(2)} TeV</label>
              <input type="range" min={0.5} max={14} step={0.1} value={energy} onChange={(e)=>setEnergy(parseFloat(e.target.value))} className="mt-2 w-full"/>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/60">Field B · {field.toFixed(2)} T</label>
              <input type="range" min={0} max={2} step={0.05} value={field} onChange={(e)=>setField(parseFloat(e.target.value))} className="mt-2 w-full"/>
            </div>
            <button onClick={fire} className="w-full rounded border border-cyan-400/50 bg-cyan-400/10 px-3 py-2 text-xs font-mono uppercase tracking-widest text-cyan-200 hover:bg-cyan-400/20">
              Fire Beams
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
