import { useRef, useState } from "react";
import { useColdRaf } from "@/hooks/use-cold-raf";

export function MeridianSkyline() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [towers, setTowers] = useState<{ x: number; h: number; w: number }[]>(() =>
    Array.from({ length: 14 }, (_, i) => ({ x: i / 14, h: 0.3 + Math.random() * 0.4, w: 0.04 + Math.random() * 0.03 })),
  );
  const tRef = useRef(0);

  useColdRaf(ref, (dt) => {
    const cvs = ref.current!; const ctx = cvs.getContext("2d")!;
    const r = cvs.getBoundingClientRect();
    cvs.width = r.width * devicePixelRatio; cvs.height = r.height * devicePixelRatio;
    const W = cvs.width, H = cvs.height;
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#0a0420"); grd.addColorStop(0.5, "#1a0a3a"); grd.addColorStop(1, "#3a1054");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    tRef.current += dt * 0.4;
    const t = tRef.current;
    ctx.strokeStyle = "rgba(244,114,182,0.5)"; ctx.lineWidth = devicePixelRatio;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    for (const tw of towers) {
      const tx = tw.x * W; const tw_ = tw.w * W; const th = tw.h * H;
      ctx.fillStyle = "rgba(8,8,20,0.95)";
      ctx.fillRect(tx, H - th, tw_, th);
      ctx.fillStyle = `hsla(${280 + (tw.x * 100) % 60},80%,60%,${0.4 + Math.sin(t + tw.x * 10) * 0.2})`;
      for (let yy = H - th + 4; yy < H - 4; yy += 6 * devicePixelRatio) {
        ctx.fillRect(tx + 2, yy, tw_ - 4, 2 * devicePixelRatio);
      }
    }
  }, { fps: 18, deps: [towers] });

  const grow = () => setTowers((cur) => [
    ...cur,
    { x: Math.random(), h: 0.35 + Math.random() * 0.55, w: 0.03 + Math.random() * 0.04 },
  ]);

  return (
    <div className="rounded-md border border-white/10 bg-card/40 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Growth · B</div>
          <h4 className="text-lg font-black tracking-[-0.02em] text-white">Meridian Skyline</h4>
        </div>
        <div className="font-mono text-[10px] text-fuchsia-300">{towers.length} towers</div>
      </div>
      <canvas ref={ref} className="block h-40 w-full rounded border border-white/5" />
      <div className="mt-2 flex gap-2">
        <button onClick={grow} className="flex-1 rounded border border-fuchsia-400/40 bg-fuchsia-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-fuchsia-200 hover:bg-fuchsia-400/20">Grow skyline +</button>
        <button onClick={() => setTowers(Array.from({ length: 14 }, (_, i) => ({ x: i / 14, h: 0.3 + Math.random() * 0.4, w: 0.04 + Math.random() * 0.03 })))}
          className="rounded border border-white/15 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:bg-white/5">reset</button>
      </div>
    </div>
  );
}
