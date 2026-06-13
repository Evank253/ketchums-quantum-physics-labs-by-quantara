import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useEffect, useState } from "react";
import { runFullEvolution, DEFAULTS, type Constants } from "@/lib/rg-running";

export const Route = createFileRoute("/rg-running")({
  component: RgRunningPage,
  head: () => ({
    meta: [
      { title: "RG Running · Coupled 4-loop QED + QCD — Quantara" },
      {
        name: "description",
        content:
          "In-browser 4-loop coupled renormalization-group running of α and αₛ with MS-bar threshold matching across charm, tau, bottom, and top.",
      },
    ],
  }),
});

function RgRunningPage() {
  const [c, setC] = useState<Constants>(DEFAULTS);
  const result = useMemo(() => runFullEvolution(c), [c]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const H = (canvas.height = 360);
    ctx.fillStyle = "rgba(5,5,10,1)";
    ctx.fillRect(0, 0, W, H);

    const pts = result.samples;
    const xs = pts.map((p) => Math.log10(p.mu));
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const a1 = pts.map((p) => p.alphaInv);
    const as = pts.map((p) => p.alphas);
    const aMin = Math.min(...a1), aMax = Math.max(...a1);
    const sMin = Math.min(...as), sMax = Math.max(...as);

    const padL = 60, padR = 60, padT = 20, padB = 36;
    const px = (x: number) => padL + ((x - xMin) / (xMax - xMin)) * (W - padL - padR);
    const pyA = (y: number) => padT + (1 - (y - aMin) / (aMax - aMin)) * (H - padT - padB);
    const pyS = (y: number) => padT + (1 - (y - sMin) / (sMax - sMin)) * (H - padT - padB);

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let g = Math.ceil(xMin); g <= Math.floor(xMax); g++) {
      const x = px(g);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.font = "10px monospace";
      ctx.fillText(`10^${g}`, x - 12, H - padB + 14);
    }

    // threshold markers
    for (const [name, mu] of [
      ["m_c", c.m_c], ["m_τ", c.m_tau], ["m_b", c.m_b], ["M_Z", c.m_z], ["m_t", c.m_t],
    ] as const) {
      const x = px(Math.log10(mu));
      ctx.strokeStyle = "rgba(167,139,250,0.35)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, H - padB); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#a78bfa"; ctx.font = "10px monospace";
      ctx.fillText(name, x + 3, padT + 10);
    }

    // 1/alpha curve
    ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = px(Math.log10(p.mu)), y = pyA(p.alphaInv);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // alpha_s curve
    ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = px(Math.log10(p.mu)), y = pyS(p.alphas);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // axes labels
    ctx.fillStyle = "#38bdf8"; ctx.font = "11px monospace";
    ctx.fillText(`1/α  [${aMin.toFixed(2)} … ${aMax.toFixed(2)}]`, 8, 14);
    ctx.fillStyle = "#f59e0b";
    ctx.fillText(`αₛ  [${sMin.toFixed(3)} … ${sMax.toFixed(3)}]`, 8, 28);
    ctx.fillStyle = "#64748b";
    ctx.fillText("μ [GeV]", W / 2 - 20, H - 4);
  }, [result, c]);

  const stat = (label: string, value: string, sub?: string) => (
    <div className="border border-white/5 bg-card/40 p-4 font-mono">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black text-white">{value}</div>
      {sub && <div className="mt-1 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );

  return (
    <section className="min-h-screen bg-[oklch(0.06_0.01_280)] px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          RG_RUNNING // 4-LOOP QED ⊕ 4-LOOP QCD · MS-BAR
        </span>
        <h1 className="mt-3 text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
          Coupled running of α and αₛ from 1 GeV → 1 TeV.
        </h1>
        <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
          In-browser RK4 integration of the coupled β-system with explicit
          MS-bar threshold matching at m_c, m_τ, m_b, m_t. Data-driven HVP
          boundary at μ₀ = 1 GeV (α⁻¹ = 133.4532, αₛ = 0.4785).
        </p>

        <div className="mt-8 grid gap-px md:grid-cols-3">
          {stat("α⁻¹(M_Z)", result.alphaInv_Mz.toFixed(5), "PDG ≈ 127.934 ± 0.026")}
          {stat("αₛ(M_Z)", result.alphas_Mz.toFixed(5), "PDG ≈ 0.1179 ± 0.0009")}
          {stat("α⁻¹(1 TeV)", result.alphaInv_1TeV.toFixed(5), "post m_t matching, N_f = 6")}
        </div>

        <div className="glass-panel mt-px overflow-hidden rounded-sm border border-white/5">
          <canvas ref={canvasRef} className="block w-full" style={{ height: 360 }} />
        </div>

        <div className="mt-px grid gap-px md:grid-cols-5">
          {([
            ["m_c", "m_c", 0.5, 3],
            ["m_τ", "m_tau", 1.0, 3],
            ["m_b", "m_b", 2.0, 8],
            ["M_Z", "m_z", 50, 120],
            ["m_t", "m_t", 100, 250],
          ] as const).map(([label, key, min, max]) => (
            <div key={key} className="border border-white/5 bg-card/40 p-3 font-mono">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label} [GeV]</label>
              <input
                type="number" step="0.01" min={min} max={max}
                value={c[key as keyof Constants]}
                onChange={(e) => setC({ ...c, [key]: parseFloat(e.target.value) || c[key as keyof Constants] })}
                className="mt-1 w-full bg-black/30 px-2 py-1 text-sm text-white outline-none focus:border-accent/40 border border-white/10"
              />
            </div>
          ))}
        </div>

        <div className="mt-px border border-white/5 bg-card/40 p-6 font-mono text-[11px] text-muted-foreground">
          <div className="text-white">Method</div>
          <div className="mt-1">
            • Coupled state Y = [α, αₛ], independent variable t = ln(μ/GeV)<br />
            • Piecewise RK4 across [1, m_c, m_τ, m_b, M_Z, m_t, 10³] GeV<br />
            • Quark matching: 3-loop QCD decoupling + mixed gluonic α correction (K₂, K₃)<br />
            • Tau matching: leptonic O(α³) shift, −15/64·(α/π)³<br />
            • Boundary at μ₀ = 1 GeV uses data-driven HVP + leptonic VP
          </div>
        </div>
      </div>
    </section>
  );
}
