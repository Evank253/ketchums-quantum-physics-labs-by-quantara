// Compact playable world mini-game embedded on the main page.
// Top-down arena: shoot bad-data, collect artifacts/contracts/boosts,
// watch horizon city grow as your score climbs.
import { useEffect, useRef, useState } from "react";
import { logLedger } from "@/lib/learning-ledger";
import { creditDat } from "@/lib/dat-tokens";

type V = { x: number; y: number };
type Enemy = { p: V; v: V; r: number; hp: number; hue: number };
type Loot = { p: V; kind: "artifact" | "contract" | "boost"; label: string; value: number };
type Bullet = { p: V; v: V; life: number };

const ARTS = ["Ancestral Coin","Phase Relic","Lattice Shard","Aurora Crystal","Time Anchor"];
const CTRS = ["Bio-Repair Tender","Energy Lattice Lease","Coastal Foundation"];
const BSTS = ["Warp Surge","Shield Bloom","Time Dilation"];
const rnd = (a:number,b:number) => a + Math.random()*(b-a);
const lastCityMark = { v: 0 };

export function WorldGameEmbed() {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const mouseDown = useRef(false);
  const aim = useRef<V>({ x: 0, y: 0 });
  const state = useRef({
    player: { p: { x: 0, y: 0 } as V, v: { x:0,y:0 } as V, hp: 100, fire: 0 },
    enemies: [] as Enemy[],
    loot: [] as Loot[],
    bullets: [] as Bullet[],
    spawnT: 0,
    growth: 0,
  });
  const [hud, setHud] = useState({ score: 0, hp: 100, growth: 0, arts: 0, ctrs: 0, bsts: 0 });
  const [inv, setInv] = useState<string[]>([]);

  useEffect(() => {
    const cvs = cvsRef.current!;
    const ctx = cvs.getContext("2d")!;
    const resize = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * devicePixelRatio;
      cvs.height = r.height * devicePixelRatio;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(cvs);

    const onKey = (e: KeyboardEvent, v: boolean) => { keys.current[e.key.toLowerCase()] = v; };
    const onDown = (e: KeyboardEvent) => onKey(e, true);
    const onUp = (e: KeyboardEvent) => onKey(e, false);
    const onMove = (e: MouseEvent) => {
      const r = cvs.getBoundingClientRect();
      aim.current.x = (e.clientX - r.left) * devicePixelRatio;
      aim.current.y = (e.clientY - r.top) * devicePixelRatio;
    };
    const onMD = () => mouseDown.current = true;
    const onMU = () => mouseDown.current = false;
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    cvs.addEventListener("mousemove", onMove);
    cvs.addEventListener("mousedown", onMD);
    cvs.addEventListener("mouseup", onMU);

    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(33, t - last) / 16.67; last = t;
      const W = cvs.width, H = cvs.height;
      const s = state.current;

      // init centered player
      if (s.player.p.x === 0 && s.player.p.y === 0) { s.player.p.x = W/2; s.player.p.y = H/2; }

      // backdrop
      ctx.fillStyle = "rgba(2,6,18,0.45)";
      ctx.fillRect(0,0,W,H);

      // horizon city silhouette (grows with growth 0..1)
      drawCity(ctx, W, H, s.growth);

      // input
      const sp = 3 * devicePixelRatio;
      if (keys.current["w"] || keys.current["arrowup"]) s.player.p.y -= sp * dt;
      if (keys.current["s"] || keys.current["arrowdown"]) s.player.p.y += sp * dt;
      if (keys.current["a"] || keys.current["arrowleft"]) s.player.p.x -= sp * dt;
      if (keys.current["d"] || keys.current["arrowright"]) s.player.p.x += sp * dt;
      s.player.p.x = Math.max(20, Math.min(W-20, s.player.p.x));
      s.player.p.y = Math.max(20, Math.min(H-20, s.player.p.y));

      // spawn
      s.spawnT -= dt;
      if (s.spawnT <= 0) {
        s.spawnT = 30 + Math.random()*30;
        const edge = Math.floor(Math.random()*4);
        const ep: V = edge===0?{x:0,y:rnd(0,H)}: edge===1?{x:W,y:rnd(0,H)}: edge===2?{x:rnd(0,W),y:0}:{x:rnd(0,W),y:H};
        s.enemies.push({ p: ep, v:{x:0,y:0}, r: 9*devicePixelRatio, hp: 2, hue: Math.random()<0.5?340:10 });
        if (Math.random() < 0.45) {
          const roll = Math.random();
          const kind: Loot["kind"] = roll < 0.5 ? "artifact" : roll < 0.8 ? "contract" : "boost";
          const label = kind === "artifact" ? ARTS[Math.floor(Math.random()*ARTS.length)]
                      : kind === "contract" ? CTRS[Math.floor(Math.random()*CTRS.length)]
                      : BSTS[Math.floor(Math.random()*BSTS.length)];
          s.loot.push({ p: { x: rnd(40, W-40), y: rnd(40, H-40) }, kind, label, value: kind==="contract"?40: kind==="artifact"?15:10 });
        }
      }

      // fire
      s.player.fire -= dt;
      if (mouseDown.current && s.player.fire <= 0) {
        s.player.fire = 6;
        const dx = aim.current.x - s.player.p.x;
        const dy = aim.current.y - s.player.p.y;
        const m = Math.hypot(dx, dy) || 1;
        s.bullets.push({ p: { ...s.player.p }, v: { x: dx/m*8, y: dy/m*8 }, life: 60 });
      }

      // enemies
      for (const e of s.enemies) {
        const dx = s.player.p.x - e.p.x, dy = s.player.p.y - e.p.y;
        const m = Math.hypot(dx, dy) || 1;
        e.p.x += (dx/m) * 0.8 * dt;
        e.p.y += (dy/m) * 0.8 * dt;
        const grd = ctx.createRadialGradient(e.p.x, e.p.y, 2, e.p.x, e.p.y, e.r*2);
        grd.addColorStop(0, `hsla(${e.hue},90%,60%,0.95)`);
        grd.addColorStop(1, `hsla(${e.hue},90%,40%,0)`);
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(e.p.x, e.p.y, e.r*2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = `hsla(${e.hue},90%,60%,1)`;
        ctx.beginPath(); ctx.arc(e.p.x, e.p.y, e.r*0.7, 0, Math.PI*2); ctx.fill();
        // contact damage
        if (Math.hypot(dx,dy) < e.r + 8*devicePixelRatio) {
          s.player.hp -= 0.5 * dt;
        }
      }

      // bullets
      for (const b of s.bullets) {
        b.p.x += b.v.x * dt; b.p.y += b.v.y * dt; b.life -= dt;
        ctx.fillStyle = "rgba(125,211,252,0.95)";
        ctx.beginPath(); ctx.arc(b.p.x, b.p.y, 2.5*devicePixelRatio, 0, Math.PI*2); ctx.fill();
      }
      // collisions
      let scored = 0;
      for (const b of s.bullets) {
        for (const e of s.enemies) {
          if (Math.hypot(b.p.x-e.p.x, b.p.y-e.p.y) < e.r) {
            e.hp -= 1; b.life = 0;
            if (e.hp <= 0) { scored += 10; s.growth = Math.min(1, s.growth + 0.005); }
          }
        }
      }
      s.bullets = s.bullets.filter(b => b.life > 0 && b.p.x>-10 && b.p.x<W+10 && b.p.y>-10 && b.p.y<H+10);
      const killed = s.enemies.filter(e => e.hp <= 0).length;
      s.enemies = s.enemies.filter(e => e.hp > 0);

      // loot
      let pickedAny = false;
      for (const l of s.loot) {
        const c = l.kind === "artifact" ? "#fcd34d" : l.kind === "contract" ? "#67e8f9" : "#a5f3fc";
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(l.p.x, l.p.y, 5*devicePixelRatio, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = `${c}88`;
        ctx.beginPath(); ctx.arc(l.p.x, l.p.y, 9*devicePixelRatio + Math.sin(t/200)*2, 0, Math.PI*2); ctx.stroke();
      }
      s.loot = s.loot.filter(l => {
        if (Math.hypot(l.p.x - s.player.p.x, l.p.y - s.player.p.y) < 14*devicePixelRatio) {
          creditDat(l.value);
          s.growth = Math.min(1, s.growth + 0.01);
          setInv(prev => [`${l.kind} · ${l.label}`, ...prev].slice(0, 8));
          logLedger("unlock", `Found ${l.kind}: ${l.label}`, { value: l.value });
          pickedAny = true;
          return false;
        }
        return true;
      });

      // player
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath(); ctx.arc(s.player.p.x, s.player.p.y, 7*devicePixelRatio, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "rgba(125,211,252,0.6)";
      ctx.beginPath(); ctx.arc(s.player.p.x, s.player.p.y, 12*devicePixelRatio, 0, Math.PI*2); ctx.stroke();

      // city growth milestone logging
      const pct = Math.floor(s.growth * 100);
      const markers = [25, 50, 75, 100];
      for (const m of markers) {
        if (pct >= m && lastCityMark.v < m) {
          lastCityMark.v = m;
          logLedger("unlock", `city:${m}`, { growth: s.growth });
        }
      }

      // hud commit (throttled)
      if (killed || pickedAny || Math.floor(t/250) % 4 === 0) {
        setHud(h => ({
          score: h.score + scored,
          hp: Math.max(0, Math.floor(s.player.hp)),
          growth: Math.round(s.growth * 100),
          arts: h.arts + (pickedAny ? 1 : 0),
          ctrs: h.ctrs,
          bsts: h.bsts,
        }));
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      cvs.removeEventListener("mousemove", onMove);
      cvs.removeEventListener("mousedown", onMD);
      cvs.removeEventListener("mouseup", onMU);
    };
  }, []);

  const reset = () => {
    const s = state.current;
    s.enemies = []; s.loot = []; s.bullets = []; s.player.hp = 100;
    setHud({ score: 0, hp: 100, growth: hud.growth, arts: 0, ctrs: 0, bsts: 0 });
  };

  return (
    <section id="world-arena" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Playable Arena</div>
          <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">Quantara World — Mini</h3>
          <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
            Click in the arena, then move with WASD and aim/fire with the mouse. Clean bad-data; recover artifacts, contracts, and boosts to grow the horizon city.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="relative rounded-md border border-white/10 bg-black overflow-hidden cursor-crosshair" style={{ aspectRatio: "16/9" }}>
            <canvas ref={cvsRef} className="absolute inset-0 h-full w-full" tabIndex={0} />
            <div className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-widest text-white/80">
              SCORE {hud.score} · HP {hud.hp} · CITY {hud.growth}%
            </div>
            <div className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] text-cyan-300">
              WASD · MOUSE · HOLD-FIRE
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">Horizon City</div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300" style={{ width: `${hud.growth}%` }} />
              </div>
              <div className="mt-1 font-mono text-[10px] text-white/50">{hud.growth}% grown</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">Recent Discoveries</div>
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto pr-1 font-mono text-[10px] text-white/80">
                {inv.length === 0 && <li className="text-white/40">— none —</li>}
                {inv.map((s, i) => <li key={i} className="truncate">· {s}</li>)}
              </ul>
            </div>
            <button onClick={reset} className="w-full rounded border border-white/15 px-3 py-2 text-xs font-mono uppercase tracking-widest text-white/80 hover:bg-white/5">
              Reset Arena
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function drawCity(ctx: CanvasRenderingContext2D, W: number, H: number, g: number) {
  // gradient sky band along the bottom
  const y0 = H * 0.7;
  const grd = ctx.createLinearGradient(0, y0, 0, H);
  grd.addColorStop(0, "rgba(56,189,248,0.06)");
  grd.addColorStop(1, "rgba(232,121,249,0.10)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, y0, W, H - y0);
  const count = Math.max(8, Math.floor(40 * g + 8));
  const baseY = H - 6;
  for (let i = 0; i < count; i++) {
    const x = (i / count) * W + (Math.sin(i*1.7) * 8);
    const w = W / count - 2;
    const hh = (12 + ((i*97) % 80)) * (0.5 + g * 1.4);
    const lit = (i * 13) % 7 < (3 + g*3);
    ctx.fillStyle = lit ? "rgba(125,211,252,0.45)" : "rgba(125,211,252,0.18)";
    ctx.fillRect(x, baseY - hh, w, hh);
    // windows
    ctx.fillStyle = `rgba(252,211,77,${0.25 + g*0.5})`;
    for (let wy = baseY - hh + 4; wy < baseY - 4; wy += 6) {
      for (let wx = x + 2; wx < x + w - 2; wx += 5) {
        if (((wx*wy)|0) % 11 < 3 + g*4) ctx.fillRect(wx, wy, 2, 2);
      }
    }
  }
}
