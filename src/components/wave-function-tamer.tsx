import { useEffect, useRef, useState } from "react";
import { saveSolve } from "@/lib/solved-archive";

// Solves the time-independent 1D Schrödinger eq. on a discretized grid using
// Jacobi-like inverse-iteration to find the ground-state ψ for a chosen V(x).
// "Tame" damps high-frequency components (low-pass on the wavefunction).
export function WaveFunctionTamer() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [V0, setV0] = useState(20); // potential strength
  const [width, setWidth] = useState(1.0); // well width
  const [tameLvl, setTameLvl] = useState(0);
  const [energy, setEnergy] = useState(0);
  const psiRef = useRef<Float64Array | null>(null);
  const N = 256;

  const compute = () => {
    const psi = new Float64Array(N);
    // initial guess: gaussian
    for (let i = 0; i < N; i++) {
      const x = (i / N) * 2 - 1;
      psi[i] = Math.exp(-((x / 0.3) ** 2));
    }
    // simple inverse iteration toward ground state under V(x)=V0*(|x|>width?1:0)
    const dx = 2 / N;
    for (let it = 0; it < 200; it++) {
      const next = new Float64Array(N);
      for (let i = 1; i < N - 1; i++) {
        const x = (i / N) * 2 - 1;
        const Vi = Math.abs(x) > width / 2 ? V0 : 0;
        const lap = (psi[i + 1] - 2 * psi[i] + psi[i - 1]) / (dx * dx);
        next[i] = psi[i] - 0.0002 * (-0.5 * lap + Vi * psi[i]);
      }
      // damp high-freq if tamed
      if (tameLvl > 0) {
        for (let pass = 0; pass < tameLvl; pass++) {
          for (let i = 1; i < N - 1; i++) {
            next[i] = (next[i - 1] + 2 * next[i] + next[i + 1]) / 4;
          }
        }
      }
      // normalize
      let norm = 0;
      for (let i = 0; i < N; i++) norm += next[i] * next[i] * dx;
      const k = 1 / Math.sqrt(Math.max(norm, 1e-12));
      for (let i = 0; i < N; i++) psi[i] = next[i] * k;
    }
    // estimate <H>
    let E = 0;
    for (let i = 1; i < N - 1; i++) {
      const x = (i / N) * 2 - 1;
      const Vi = Math.abs(x) > width / 2 ? V0 : 0;
      const lap = (psi[i + 1] - 2 * psi[i] + psi[i - 1]) / (dx * dx);
      E += psi[i] * (-0.5 * lap + Vi * psi[i]) * dx;
    }
    psiRef.current = psi;
    setEnergy(E);
  };

  useEffect(() => { compute(); /* eslint-disable-next-line */ }, [V0, width, tameLvl]);

  useEffect(() => {
    const cvs = ref.current!; const ctx = cvs.getContext("2d")!;
    let raf = 0;
    const draw = () => {
      const r = cvs.getBoundingClientRect();
      cvs.width = r.width * devicePixelRatio; cvs.height = r.height * devicePixelRatio;
      const W = cvs.width, H = cvs.height;
      ctx.fillStyle = "rgba(2,4,12,1)"; ctx.fillRect(0, 0, W, H);
      // potential
      ctx.fillStyle = "rgba(244,114,182,0.20)";
      for (let i = 0; i < N; i++) {
        const x = (i / N) * 2 - 1;
        const Vi = Math.abs(x) > width / 2 ? V0 : 0;
        const h = (Vi / 30) * H * 0.7;
        ctx.fillRect((i / N) * W, H - h, W / N + 1, h);
      }
      // |psi|^2
      const psi = psiRef.current;
      if (psi) {
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const p2 = psi[i] * psi[i];
          const y = H * 0.95 - p2 * H * 0.6;
          const x = (i / N) * W;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(56,189,248,0.95)";
        ctx.lineWidth = 2 * devicePixelRatio; ctx.stroke();
        ctx.lineTo(W, H * 0.95); ctx.lineTo(0, H * 0.95);
        ctx.fillStyle = "rgba(56,189,248,0.20)"; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tame = () => setTameLvl((t) => Math.min(t + 1, 8));
  const release = () => setTameLvl(0);
  const archive = () => {
    void saveSolve({
      theory: "Tamed ψ-ground state in finite-width potential well",
      solver: "Wave Function Tamer",
      abstract: `1D Schrödinger ground state solved on N=${N} grid. Potential V₀=${V0}, well width=${width.toFixed(2)}. Low-pass damping applied ${tameLvl}× to suppress high-frequency contamination. Ground-state energy ⟨H⟩ = ${energy.toFixed(6)}.`,
      math: `H = -½ ∂²/∂x² + V(x); V(x)=V₀·𝟙[|x|>w/2]\n⟨H⟩=${energy.toFixed(8)}; tame_passes=${tameLvl}`,
      source: "wave-function-tamer",
    });
  };

  return (
    <div className="rounded-md border border-white/10 bg-card/40 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Instrument · 01</div>
          <h4 className="mt-1 text-xl font-black tracking-[-0.02em] text-white">Wave Function Tamer</h4>
        </div>
        <div className="font-mono text-[10px] text-cyan-300">⟨H⟩ = {energy.toFixed(4)}</div>
      </div>
      <canvas ref={ref} className="block h-48 w-full rounded border border-white/5" />
      <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-mono">
        <label className="block">
          <span className="text-chrome">V₀ · {V0.toFixed(1)}</span>
          <input type="range" min={1} max={30} step={0.5} value={V0} onChange={(e) => setV0(parseFloat(e.target.value))} className="mt-1 w-full" />
        </label>
        <label className="block">
          <span className="text-chrome">Well width · {width.toFixed(2)}</span>
          <input type="range" min={0.2} max={1.8} step={0.05} value={width} onChange={(e) => setWidth(parseFloat(e.target.value))} className="mt-1 w-full" />
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={tame} className="flex-1 rounded border border-cyan-400/40 bg-cyan-400/10 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan-200 hover:bg-cyan-400/20">Tame ψ · {tameLvl}</button>
        <button onClick={release} className="rounded border border-white/15 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white/70 hover:bg-white/5">Release</button>
        <button onClick={archive} className="rounded border border-emerald-400/40 bg-emerald-400/10 px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-200 hover:bg-emerald-400/20">Archive solve</button>
      </div>
    </div>
  );
}
