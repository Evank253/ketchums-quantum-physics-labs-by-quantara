import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { logLedger } from "@/lib/learning-ledger";
import { creditDat } from "@/lib/dat-tokens";

export const Route = createFileRoute("/interstellar")({
  component: Interstellar,
  head: () => ({
    meta: [
      { title: "Interstellar Journey — Bend Spacetime, Find Artifacts" },
      { name: "description", content: "Fly through ancestral worlds, fight dark-matter entities, bend spacetime, recover artifacts that advance the civilization." },
      { property: "og:title", content: "Interstellar Journey — Quantara" },
      { property: "og:description", content: "Bend physics. Recover artifacts. Watch the cities grow." },
    ],
  }),
});

type Star = { x: number; y: number; z: number };
type Enemy = { x: number; y: number; z: number; hp: number; kind: "bad-data" | "dark-matter"; hue: number };
type Loot = { x: number; y: number; z: number; kind: "artifact" | "contract" | "boost"; label: string; value: number };
type Bullet = { x: number; y: number; z: number; vz: number; alive: boolean };

const ARTIFACT_NAMES = ["Ancestral Coin", "Phase Relic", "Lattice Shard", "Vault Sigil", "Aurora Crystal", "Time Anchor"];
const CONTRACT_NAMES = ["Bio-Repair Tender", "Energy Lattice Lease", "Coastal Foundation Bid"];
const BOOST_NAMES = ["Warp Surge", "Shield Bloom", "Time Dilation"];

function rand(min: number, max: number) { return min + Math.random() * (max - min); }

function Interstellar() {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    stars: [] as Star[],
    enemies: [] as Enemy[],
    loot: [] as Loot[],
    bullets: [] as Bullet[],
    aim: { x: 0, y: 0 },
    warp: 1,
    bendT: 0,        // spacetime bend amount
    cityGrowth: 0,   // 0..1
  });
  const [hud, setHud] = useState({
    speed: 1, kills: 0, artifacts: 0, contracts: 0, boosts: 0,
    dat: 0, distance: 0, bend: 0, growth: 0,
  });
  const [inventory, setInventory] = useState<string[]>([]);

  useEffect(() => {
    const cvs = cvsRef.current!;
    const ctx = cvs.getContext("2d")!;
    const resize = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * devicePixelRatio;
      cvs.height = r.height * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    // seed
    const S = stateRef.current;
    for (let i = 0; i < 400; i++) S.stars.push({ x: rand(-1,1), y: rand(-1,1), z: rand(0.01, 1) });
    for (let i = 0; i < 8; i++) spawnEnemy(S);
    for (let i = 0; i < 6; i++) spawnLoot(S);

    const onMove = (e: PointerEvent) => {
      const r = cvs.getBoundingClientRect();
      S.aim.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      S.aim.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onDown = () => fire(S);
    cvs.addEventListener("pointermove", onMove);
    cvs.addEventListener("pointerdown", onDown);

    let raf = 0;
    let last = performance.now();
    let distance = 0, kills = 0, artifacts = 0, contracts = 0, boosts = 0, dat = 0;

    const loop = (t: number) => {
      const dt = Math.min(33, t - last) / 16.67;
      last = t;
      const W = cvs.width, H = cvs.height;
      const cx = W/2, cy = H/2;

      // bend decay
      S.bendT = Math.max(0, S.bendT - 0.005 * dt);

      // background
      ctx.fillStyle = "rgba(2, 2, 10, 1)";
      ctx.fillRect(0, 0, W, H);

      // starfield warp
      const speed = 0.012 * S.warp;
      for (const s of S.stars) {
        s.z -= speed * dt;
        if (s.z <= 0.01) { s.x = rand(-1,1); s.y = rand(-1,1); s.z = 1; }
        const k = 1 / s.z;
        // spacetime bend distortion (radial swirl)
        const ang = Math.atan2(s.y, s.x) + S.bendT * 1.5 * (1 - s.z);
        const rad = Math.hypot(s.x, s.y);
        const sx = cx + Math.cos(ang) * rad * k * cx;
        const sy = cy + Math.sin(ang) * rad * k * cy;
        const alpha = Math.min(1, (1 - s.z) * 1.2);
        ctx.fillStyle = `rgba(180,220,255,${alpha})`;
        ctx.fillRect(sx, sy, k * 1.5, k * 1.5);
      }

      distance += speed * dt;

      // city growth on horizon (drawn always)
      drawCity(ctx, W, H, S.cityGrowth);

      // enemies
      for (const e of S.enemies) {
        e.z -= speed * 0.7 * dt;
        if (e.z <= 0.05) { respawnEnemy(e); }
        const k = 1 / e.z;
        const ex = cx + e.x * k * cx;
        const ey = cy + e.y * k * cy;
        const r = 14 * k;
        ctx.fillStyle = `hsla(${e.hue}, 90%, 55%, 0.85)`;
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = `hsla(${e.hue}, 90%, 75%, 0.6)`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ex, ey, r*1.5, 0, Math.PI*2); ctx.stroke();
        // hp bar
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(ex - r, ey - r - 6, r*2, 3);
        ctx.fillStyle = "rgba(255,80,80,0.9)"; ctx.fillRect(ex - r, ey - r - 6, r*2 * (e.hp/100), 3);
      }
      // loot
      for (const l of S.loot) {
        l.z -= speed * 0.7 * dt;
        if (l.z <= 0.05) respawnLoot(l);
        const k = 1 / l.z;
        const lx = cx + l.x * k * cx;
        const ly = cy + l.y * k * cy;
        const r = 10 * k;
        const hue = l.kind === "artifact" ? 50 : l.kind === "contract" ? 200 : 320;
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, 0.9)`;
        ctx.beginPath();
        ctx.moveTo(lx, ly - r);
        ctx.lineTo(lx + r, ly);
        ctx.lineTo(lx, ly + r);
        ctx.lineTo(lx - r, ly);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = `hsla(${hue}, 100%, 80%, 0.6)`;
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // bullets
      for (const b of S.bullets) {
        if (!b.alive) continue;
        b.z -= 0.05 * dt;
        const k = 1 / Math.max(b.z, 0.05);
        const bx = cx + b.x * k * cx;
        const by = cy + b.y * k * cy;
        ctx.fillStyle = "rgba(150, 255, 220, 0.95)";
        ctx.beginPath(); ctx.arc(bx, by, 3 * k, 0, Math.PI*2); ctx.fill();
        if (b.z < 0.06) { b.alive = false; continue; }
        // hit detect
        for (const e of S.enemies) {
          if (Math.abs(b.z - e.z) < 0.04 && Math.hypot(b.x - e.x, b.y - e.y) < 0.06) {
            e.hp -= 25;
            b.alive = false;
            if (e.hp <= 0) {
              kills++;
              const reward = 6;
              dat += reward;
              creditDat(reward);
              S.cityGrowth = Math.min(1, S.cityGrowth + 0.02);
              if (e.kind === "dark-matter") S.bendT = Math.min(1, S.bendT + 0.18);
              logLedger("tokens", `+${reward} $DAT · neutralized ${e.kind}`);
              respawnEnemy(e);
            }
            break;
          }
        }
      }
      S.bullets = S.bullets.filter((b) => b.alive);

      // pickup detection — items close to center
      for (const l of S.loot) {
        if (l.z < 0.18 && Math.hypot(l.x, l.y) < 0.18) {
          if (l.kind === "artifact") { artifacts++; setInventory((i) => [...i, l.label]); }
          if (l.kind === "contract") { contracts++; dat += l.value; creditDat(l.value); }
          if (l.kind === "boost")    { boosts++; S.bendT = Math.min(1, S.bendT + 0.35); S.warp = Math.min(3, S.warp + 0.4); setTimeout(() => { S.warp = Math.max(1, S.warp - 0.4); }, 8000); }
          S.cityGrowth = Math.min(1, S.cityGrowth + 0.015);
          logLedger("tokens", `picked ${l.kind} · ${l.label}`, { value: l.value });
          respawnLoot(l);
        }
      }

      // reticle
      const rx = cx + S.aim.x * cx * 0.4;
      const ry = cy + S.aim.y * cy * 0.4;
      ctx.strokeStyle = "rgba(0, 255, 204, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(rx, ry, 14, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx - 22, ry); ctx.lineTo(rx + 22, ry); ctx.moveTo(rx, ry - 22); ctx.lineTo(rx, ry + 22); ctx.stroke();

      // vignette
      const grd = ctx.createRadialGradient(cx, cy, Math.min(W,H)*0.3, cx, cy, Math.max(W,H)*0.7);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.fillStyle = grd; ctx.fillRect(0,0,W,H);

      setHud((h) => ({
        speed: +S.warp.toFixed(2),
        kills, artifacts, contracts, boosts, dat,
        distance: +distance.toFixed(1),
        bend: +S.bendT.toFixed(2),
        growth: +(S.cityGrowth*100).toFixed(0),
      }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      cvs.removeEventListener("pointermove", onMove);
      cvs.removeEventListener("pointerdown", onDown);
    };
  }, []);

  const fire = (S: any) => {
    S.bullets.push({ x: S.aim.x * 0.4, y: S.aim.y * 0.4, z: 0.95, vz: -0.05, alive: true });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-mono text-xs uppercase tracking-widest text-white/70 hover:text-white">← Quantara</Link>
        <div className="font-mono text-[11px] uppercase tracking-widest text-violet-300">Interstellar · Bend spacetime · Recover artifacts</div>
        <Link to="/cern" className="font-mono text-[11px] uppercase tracking-widest text-cyan-300 hover:text-white">CERN ←</Link>
      </header>
      <section className="grid gap-4 p-4 md:grid-cols-[1fr_320px]">
        <div className="relative rounded-md border border-white/10 bg-black overflow-hidden" style={{ aspectRatio: "16/10" }}>
          <canvas ref={cvsRef} className="absolute inset-0 h-full w-full cursor-crosshair touch-none" />
          <div className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-widest text-cyan-300/90 space-y-0.5">
            <div>WARP × {hud.speed.toFixed(2)}</div>
            <div>DISTANCE {hud.distance} ly</div>
            <div>BEND ∂t {hud.bend.toFixed(2)}</div>
          </div>
          <div className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] text-white/80 text-right space-y-0.5">
            <div>KILLS {hud.kills}</div>
            <div className="text-amber-300">$DAT +{hud.dat}</div>
            <div className="text-emerald-300">CITY {hud.growth}%</div>
          </div>
          <div className="pointer-events-none absolute left-3 bottom-3 font-mono text-[10px] text-white/70">
            Move mouse / drag to aim · Click / tap to fire
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Recovered</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Artifacts" v={hud.artifacts} c="text-amber-300" />
              <Stat label="Contracts" v={hud.contracts} c="text-cyan-300" />
              <Stat label="Boosts" v={hud.boosts} c="text-pink-300" />
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.02] p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Civilization Growth</div>
            <div className="h-2 rounded bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${hud.growth}%` }} />
            </div>
            <div className="mt-1 font-mono text-[10px] text-white/60">Each kill, artifact, and contract feeds the horizon city.</div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.02] p-3 max-h-64 overflow-auto">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Inventory</div>
            {inventory.length === 0 ? (
              <div className="font-mono text-[10px] text-white/50">No artifacts recovered yet.</div>
            ) : (
              <ul className="space-y-1 font-mono text-[10px] text-amber-200">
                {inventory.map((n, i) => (<li key={i}>· {n}</li>))}
              </ul>
            )}
          </div>
          <div className="rounded-md border border-white/10 bg-black/40 p-3 font-mono text-[10px] text-white/60 leading-relaxed">
            <span className="text-violet-300">PROTOCOL — </span>
            Red blooms are <span className="text-rose-300">bad-data</span>. Magenta blooms are
            <span className="text-fuchsia-300"> dark-matter</span> — neutralizing them bends ∂t.
            Diamonds are artifacts (advance the civilization), contracts ($DAT), and boosts (warp + bend).
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, v, c }: { label: string; v: number; c: string }) {
  return (
    <div className="rounded border border-white/10 bg-black/40 px-2 py-2">
      <div className={`font-mono text-base ${c}`}>{v}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-white/50">{label}</div>
    </div>
  );
}

function spawnEnemy(S: any) {
  const kind: Enemy["kind"] = Math.random() < 0.65 ? "bad-data" : "dark-matter";
  S.enemies.push({
    x: rand(-0.6, 0.6), y: rand(-0.4, 0.4), z: rand(0.5, 1.0),
    hp: 100, kind, hue: kind === "bad-data" ? 0 : 300,
  });
}
function respawnEnemy(e: Enemy) {
  e.x = rand(-0.7, 0.7); e.y = rand(-0.5, 0.5); e.z = 1;
  e.hp = 100;
  e.kind = Math.random() < 0.65 ? "bad-data" : "dark-matter";
  e.hue = e.kind === "bad-data" ? 0 : 300;
}
function spawnLoot(S: any) {
  const roll = Math.random();
  const kind: Loot["kind"] = roll < 0.55 ? "artifact" : roll < 0.85 ? "contract" : "boost";
  const pool = kind === "artifact" ? ARTIFACT_NAMES : kind === "contract" ? CONTRACT_NAMES : BOOST_NAMES;
  const label = pool[Math.floor(Math.random()*pool.length)];
  const value = kind === "contract" ? 30 + Math.floor(Math.random()*40) : kind === "artifact" ? 18 : 0;
  S.loot.push({ x: rand(-0.6, 0.6), y: rand(-0.4, 0.4), z: rand(0.5, 1.0), kind, label, value });
}
function respawnLoot(l: Loot) {
  const roll = Math.random();
  const kind: Loot["kind"] = roll < 0.55 ? "artifact" : roll < 0.85 ? "contract" : "boost";
  const pool = kind === "artifact" ? ARTIFACT_NAMES : kind === "contract" ? CONTRACT_NAMES : BOOST_NAMES;
  l.kind = kind;
  l.label = pool[Math.floor(Math.random()*pool.length)];
  l.value = kind === "contract" ? 30 + Math.floor(Math.random()*40) : kind === "artifact" ? 18 : 0;
  l.x = rand(-0.7, 0.7); l.y = rand(-0.5, 0.5); l.z = 1;
}

function drawCity(ctx: CanvasRenderingContext2D, W: number, H: number, growth: number) {
  // skyline silhouette across the bottom horizon, intensity ∝ growth
  const horizonY = H * 0.78;
  // glow
  const grd = ctx.createLinearGradient(0, horizonY - 60, 0, H);
  grd.addColorStop(0, `rgba(60, 200, 255, ${0.04 + growth * 0.18})`);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, horizonY - 60, W, H - (horizonY - 60));

  ctx.fillStyle = `rgba(10, 30, 60, ${0.6 + growth * 0.4})`;
  const n = 40;
  const maxH = 90 * (0.4 + growth * 1.2);
  for (let i = 0; i < n; i++) {
    const bw = W / n;
    // deterministic-ish heights
    const h = (Math.sin(i * 12.9898) * 0.5 + 0.5) * maxH + 12;
    const x = i * bw;
    ctx.fillRect(x, horizonY - h, bw - 1, h + 4);
    // windows
    if (growth > 0.15) {
      ctx.fillStyle = `rgba(180, 240, 255, ${0.25 + growth * 0.6})`;
      for (let wy = horizonY - h + 6; wy < horizonY - 4; wy += 6) {
        for (let wx = x + 2; wx < x + bw - 3; wx += 4) {
          if (((i * 73 + wy * 31 + wx * 7) % 11) < 4) ctx.fillRect(wx, wy, 2, 2);
        }
      }
      ctx.fillStyle = `rgba(10, 30, 60, ${0.6 + growth * 0.4})`;
    }
  }
}
