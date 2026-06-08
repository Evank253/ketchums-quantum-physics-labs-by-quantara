// Compact quantum circuit simulator: 1-3 qubits, gates H/X/Y/Z/S/T/CNOT/Measure
// Visualizes Bloch vectors (single-qubit reduced) + probability histogram.
import { useMemo, useState, type ReactNode } from "react";
import { logLedger } from "@/lib/learning-ledger";
import { creditDat } from "@/lib/dat-tokens";

type Gate = "H" | "X" | "Y" | "Z" | "S" | "T" | "CNOT";
type Op = { gate: Gate; target: number; control?: number };

const SQRT1_2 = Math.SQRT1_2;
type C = [number, number]; // [re, im]
const cadd = (a: C, b: C): C => [a[0]+b[0], a[1]+b[1]];
const cmul = (a: C, b: C): C => [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]];
const csub = (a: C, b: C): C => [a[0]-b[0], a[1]-b[1]];
const cscl = (a: C, s: number): C => [a[0]*s, a[1]*s];

function applySingle(state: C[], n: number, target: number, M: [C,C,C,C]) {
  const out: C[] = state.map(() => [0,0] as C);
  for (let i = 0; i < state.length; i++) {
    const bit = (i >> target) & 1;
    const i0 = i & ~(1 << target);
    const i1 = i0 | (1 << target);
    if (bit === 0) {
      // amplitude at i contributes to i0 via M00 and to i1 via M10
      out[i0] = cadd(out[i0], cmul(M[0], state[i]));
      out[i1] = cadd(out[i1], cmul(M[2], state[i]));
    } else {
      out[i0] = cadd(out[i0], cmul(M[1], state[i]));
      out[i1] = cadd(out[i1], cmul(M[3], state[i]));
    }
  }
  return out;
}

function applyCNOT(state: C[], n: number, control: number, target: number) {
  const out = state.map((c) => [c[0], c[1]] as C);
  for (let i = 0; i < state.length; i++) {
    const cb = (i >> control) & 1;
    if (cb === 1) {
      const j = i ^ (1 << target);
      if (j > i) { const tmp = out[i]; out[i] = out[j]; out[j] = tmp; }
    }
  }
  return out;
}

const GATES: Record<Exclude<Gate, "CNOT">, [C,C,C,C]> = {
  H: [[SQRT1_2,0],[SQRT1_2,0],[SQRT1_2,0],[-SQRT1_2,0]],
  X: [[0,0],[1,0],[1,0],[0,0]],
  Y: [[0,0],[0,-1],[0,1],[0,0]],
  Z: [[1,0],[0,0],[0,0],[-1,0]],
  S: [[1,0],[0,0],[0,0],[0,1]],
  T: [[1,0],[0,0],[0,0],[Math.cos(Math.PI/4), Math.sin(Math.PI/4)]],
};

function simulate(n: number, ops: Op[]): C[] {
  let s: C[] = Array.from({length: 1<<n}, (_,i) => i === 0 ? [1,0] as C : [0,0] as C);
  for (const op of ops) {
    if (op.gate === "CNOT" && op.control !== undefined) s = applyCNOT(s, n, op.control, op.target);
    else s = applySingle(s, n, op.target, GATES[op.gate as Exclude<Gate,"CNOT">]);
  }
  return s;
}

function probabilities(state: C[]): number[] {
  return state.map(([re, im]) => re*re + im*im);
}

// Reduced single-qubit Bloch (approximate via marginal — accurate when no entanglement)
function blochOf(state: C[], n: number, q: number): {x: number; y: number; z: number} {
  // density matrix of qubit q (partial trace over others)
  let rho00 = 0, rho11 = 0;
  let rho01re = 0, rho01im = 0;
  for (let i = 0; i < state.length; i++) {
    for (let j = 0; j < state.length; j++) {
      const bi = (i >> q) & 1, bj = (j >> q) & 1;
      // other bits must match for partial trace
      if ((i & ~(1<<q)) !== (j & ~(1<<q))) continue;
      const a = state[i], b = state[j];
      // rho_{bi,bj} += a * conj(b)
      const re = a[0]*b[0] + a[1]*b[1];
      const im = a[1]*b[0] - a[0]*b[1];
      if (bi === 0 && bj === 0) rho00 += re;
      else if (bi === 1 && bj === 1) rho11 += re;
      else if (bi === 0 && bj === 1) { rho01re += re; rho01im += im; }
    }
  }
  const x = 2 * rho01re;
  const y = -2 * rho01im;
  const z = rho00 - rho11;
  return { x, y, z };
}

function BlochSphere({ x, y, z, label }: { x: number; y: number; z: number; label: string }) {
  // simple isometric projection
  const cx = 60, cy = 60, r = 44;
  const px = cx + x * r * 0.9;
  const py = cy - z * r * 0.9 + y * r * 0.15;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <defs>
          <radialGradient id="bs" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.9" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="url(#bs)" stroke="rgba(125,211,252,0.4)" />
        <ellipse cx={cx} cy={cy} rx={r} ry={r*0.32} fill="none" stroke="rgba(125,211,252,0.18)" />
        <line x1={cx} y1={cy-r} x2={cx} y2={cy+r} stroke="rgba(255,255,255,0.15)" />
        <line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke="rgba(255,255,255,0.15)" />
        <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f0abfc" strokeWidth={2} />
        <circle cx={px} cy={py} r={3.5} fill="#f0abfc" />
        <text x={cx} y={cy-r-3} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)">|0⟩</text>
        <text x={cx} y={cy+r+9} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)">|1⟩</text>
      </svg>
      <div className="font-mono text-[10px] text-white/60">{label}</div>
    </div>
  );
}

export function QuantumCircuit() {
  const [n, setN] = useState(2);
  const [ops, setOps] = useState<Op[]>([]);
  const [picked, setPicked] = useState<Gate>("H");
  const [control, setControl] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<number | null>(null);
  const [noise, setNoise] = useState(0);

  const state = useMemo(() => simulate(n, ops), [n, ops]);
  const probs = useMemo(() => {
    const p = probabilities(state);
    if (noise <= 0) return p;
    const u = 1 / p.length;
    return p.map((x) => (1 - noise) * x + noise * u);
  }, [state, noise]);

  // Memoize bloch vectors per qubit (was recomputed every render).
  const blochs = useMemo(
    () => Array.from({ length: n }, (_, q) => blochOf(state, n, q)),
    [state, n],
  );

  const [hoverWire, setHoverWire] = useState<number | null>(null);
  const [cascading, setCascading] = useState(false);
  const [collapseTick, setCollapseTick] = useState(0);

  const place = (q: number, gateOverride?: Gate) => {
    const g = gateOverride ?? picked;
    if (g === "CNOT") {
      if (control === null) { setControl(q); return; }
      if (control === q) { setControl(null); return; }
      setOps((o) => [...o, { gate: "CNOT", control, target: q }]);
      logLedger("kernel", `Q-Circuit · CNOT q${control}→q${q}`);
      setControl(null);
    } else {
      setOps((o) => [...o, { gate: g, target: q }]);
      logLedger("kernel", `Q-Circuit · ${g} q${q}`);
    }
    setCollapsed(null);
  };
  const clear = () => { setOps([]); setCollapsed(null); setControl(null); };
  const undo = () => setOps((o) => o.slice(0, -1));

  const measure = () => {
    const r = Math.random();
    let acc = 0;
    let picked2 = 0;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i];
      if (r <= acc) { picked2 = i; break; }
    }
    setCollapsed(picked2);
    setCollapseTick((t) => t + 1);
    creditDat(8);
    logLedger("benchmark", `Q-Circuit · Measure n=${n} ops=${ops.length}`, { probs });
  };

  const parseAndInitialize = () => {
    if (cascading) return;
    setCascading(true);
    setCollapsed(null);
    // staged cascade: parse → calibrate → collapse
    setTimeout(() => { measure(); setCascading(false); }, 1100);
  };

  const exportFrame = () => {
    const W = 1280, H = 720;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    // background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#06070c"); bg.addColorStop(1, "#03040a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // title
    ctx.fillStyle = "#a5f3fc";
    ctx.font = "bold 28px ui-monospace, monospace";
    ctx.fillText("QUANTARA · QUANTUM CIRCUIT FRAME", 48, 64);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px ui-monospace, monospace";
    ctx.fillText(`n=${n} · ops=${ops.length} · noise=${(noise*100).toFixed(0)}%`, 48, 92);
    // histogram
    const padL = 80, padR = 80, padT = 160, padB = 140;
    const gw = W - padL - padR;
    const gh = H - padT - padB;
    const bw = gw / probs.length;
    probs.forEach((p, i) => {
      const h = Math.max(2, p * gh);
      const x = padL + i * bw + bw * 0.12;
      const y = padT + (gh - h);
      const w = bw * 0.76;
      const isPeak = i === maxIdx && p > 0.04;
      const isC = collapsed === i;
      const grd = ctx.createLinearGradient(x, y, x, y + h);
      if (isC) { grd.addColorStop(0, "#fde68a"); grd.addColorStop(1, "#f59e0b"); }
      else if (isPeak) { grd.addColorStop(0, "#fdf4ff"); grd.addColorStop(0.5, "#e879f9"); grd.addColorStop(1, "#86198f"); }
      else { grd.addColorStop(0, "rgba(167,139,250,0.5)"); grd.addColorStop(1, "rgba(91,33,182,0.15)"); }
      ctx.fillStyle = grd;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#64748b";
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`|${i.toString(2).padStart(n, "0")}⟩`, x, H - padB + 18);
      ctx.fillText(`${(p*100).toFixed(1)}%`, x, H - padB + 34);
    });
    // readout
    ctx.fillStyle = "#f0abfc";
    ctx.font = "bold 18px ui-monospace, monospace";
    ctx.fillText(`SOLUTION STABILITY: ${(peakStability*100).toFixed(2)}%   Λ = ${lambdaMantissa} × 10^${lambdaExp}`, 48, H - 60);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px ui-monospace, monospace";
    ctx.fillText(collapsed !== null ? `collapsed → |${collapsed.toString(2).padStart(n,"0")}⟩` : "superposition · unmeasured", 48, H - 38);
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `quantara-frame-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
    logLedger("kernel", `Q-Circuit · render frame n=${n}`);
    creditDat(4);
  };

  const maxP = Math.max(...probs, 0.001);

  const maxIdx = probs.indexOf(Math.max(...probs));
  const peakStability = (probs[maxIdx] || 0) * (1 - noise);
  // The "exponent horizon" — formatted as a fake λ readout that locks when the
  // wavefunction collapses or stabilizes near a basis state.
  const lambdaExp = Math.round(-12 - peakStability * 110); // -12 → -122
  const lambdaMantissa = (1 + peakStability * 0.9).toFixed(4);

  return (
    <section id="quantum-lab" className="relative overflow-hidden border-t border-white/5 px-6 py-24">
      {/* Substrate Canvas — brushed carbon-fiber chassis */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 500px at 50% -10%, rgba(140,80,255,0.10), transparent 60%), radial-gradient(800px 400px at 90% 110%, rgba(0,220,255,0.08), transparent 60%), linear-gradient(180deg, #06070c 0%, #03040a 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 3px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.5) 0 1px, transparent 1px 3px)",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">UE5 · Quantum Console</div>
          <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            Quantum Circuit Lab
          </h3>
          <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
            Three-zone simulation rig — theory input, real-time manipulation horizon, and the volumetric solved exponent metric. Drag sapphire gate blocks onto the fiber-optic channels.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[300px_1fr_320px]">
          {/* ===================== ZONE A · THEORY INPUT ===================== */}
          <GlassPane label="Zone A · Theory Input" accent="cyan">
            <div className="space-y-4">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-cyan-300/80">Register Width</div>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3].map((k) => (
                    <button
                      key={k}
                      onClick={() => { setN(k); setOps([]); setCollapsed(null); }}
                      className={`flex-1 rounded-sm border px-2 py-1.5 text-xs font-mono transition-all ${
                        n === k
                          ? "border-cyan-300 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                          : "border-white/10 bg-black/40 text-white/60 hover:border-white/25"
                      }`}
                    >
                      q[{k}]
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-cyan-300/80">OpenQASM 2.0 · Live Theory</div>
                <div className="mt-2 rounded-sm border border-cyan-400/15 bg-black/70 p-3 font-mono text-[10px] leading-relaxed text-cyan-100/90 shadow-inner">
                  <pre className="whitespace-pre-wrap">
{`OPENQASM 2.0;
qreg q[${n}];
` + (ops.length
                      ? ops.map((o) =>
                          o.gate === "CNOT"
                            ? `cx q[${o.control}],q[${o.target}];`
                            : `${o.gate.toLowerCase()} q[${o.target}];`,
                        ).join("\n")
                      : "// awaiting gates…")}
                  </pre>
                </div>
              </div>

              <button
                onClick={measure}
                className="group relative w-full overflow-hidden rounded-sm border border-emerald-300/60 bg-gradient-to-b from-emerald-400/30 to-emerald-600/20 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:from-emerald-400/45 hover:to-emerald-600/30"
              >
                <span className="relative z-10">Parse &amp; Initialize</span>
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent opacity-70" />
              </button>

              <div className="rounded-sm border border-white/10 bg-black/40 p-2 font-mono text-[9px] uppercase tracking-widest text-white/50">
                Status: <span className="text-emerald-300">READY</span> · noise <span className="text-fuchsia-300">{(noise * 100).toFixed(0)}%</span>
              </div>
            </div>
          </GlassPane>

          {/* ===================== ZONE B · MANIPULATION ===================== */}
          <GlassPane label="Zone B · Manipulation Horizon" accent="white">
            <div className="mb-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-white/55">
              <span>fiber-optic channels · {ops.length} ops</span>
              <span className="text-cyan-200">
                picked: <span className="text-fuchsia-300">{picked}</span>
                {picked === "CNOT" && control !== null ? ` (ctrl q${control})` : ""}
              </span>
            </div>

            {/* Recessed chassis holding the qubit channels */}
            <div className="relative rounded-sm border border-white/10 bg-gradient-to-b from-black/80 to-black/40 p-3 shadow-[inset_0_0_30px_rgba(0,0,0,0.7)]">
              {/* vertical playhead chrome rail */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-2 left-1/2 w-[3px] -translate-x-1/2 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(186,230,253,0.0) 0%, rgba(186,230,253,0.85) 30%, rgba(125,211,252,1) 50%, rgba(186,230,253,0.85) 70%, rgba(186,230,253,0.0) 100%)",
                  boxShadow:
                    "0 0 12px rgba(125,211,252,0.7), 0 0 24px rgba(125,211,252,0.35)",
                }}
              />

              <div className="space-y-3">
                {Array.from({ length: n }).map((_, q) => {
                  const wireOps = ops
                    .map((o, i) => ({ o, i }))
                    .filter(({ o }) => o.target === q || o.control === q);
                  const isHover = hoverWire === q;
                  return (
                    <div key={q} className="flex items-center gap-3">
                      <div className="w-10 font-mono text-[11px] text-cyan-200/80">q{q}</div>
                      <button
                        onClick={() => place(q)}
                        onDragOver={(e) => { e.preventDefault(); setHoverWire(q); }}
                        onDragLeave={() => setHoverWire((h) => (h === q ? null : h))}
                        onDrop={(e) => {
                          e.preventDefault();
                          setHoverWire(null);
                          const g = e.dataTransfer.getData("text/quantara-gate") as Gate;
                          if (g) place(q, g);
                        }}
                        className={`group relative flex-1 h-12 rounded-sm border transition-all ${
                          isHover
                            ? "border-fuchsia-300 shadow-[0_0_22px_rgba(232,121,249,0.45)]"
                            : "border-white/10 hover:border-cyan-300/40"
                        }`}
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(8,10,18,0.85), rgba(2,3,8,0.95))",
                          boxShadow:
                            "inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
                        }}
                      >
                        {/* recessed fiber-optic channel */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-3 right-3 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
                          style={{
                            background:
                              "linear-gradient(90deg, rgba(34,211,238,0.85), rgba(165,243,252,1) 50%, rgba(232,121,249,0.9))",
                            boxShadow:
                              "0 0 8px rgba(125,211,252,0.7), 0 0 20px rgba(232,121,249,0.35)",
                          }}
                        />
                        {/* pulse traveling along the wire */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute left-3 right-3 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full"
                        >
                          <span
                            className="block h-full w-1/4 rounded-full"
                            style={{
                              background:
                                "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
                              animation: "qpulse 3.4s linear infinite",
                              animationDelay: `${q * 0.6}s`,
                            }}
                          />
                        </span>

                        <div className="absolute inset-0 flex items-center gap-1.5 px-3">
                          {wireOps.map(({ o, i }) => {
                            const isCtrl = o.gate === "CNOT" && o.control === q;
                            const isTgt = o.gate === "CNOT" && o.target === q;
                            return (
                              <span
                                key={i}
                                className={`relative inline-flex h-8 min-w-8 items-center justify-center rounded-[3px] px-2 font-mono text-[10px] font-black tracking-wider`}
                                style={
                                  isCtrl
                                    ? {
                                        background:
                                          "radial-gradient(circle at 30% 30%, #fdf4ff, #e879f9 50%, #86198f)",
                                        color: "#1a0420",
                                        boxShadow:
                                          "0 0 14px rgba(232,121,249,0.7), inset 0 1px 0 rgba(255,255,255,0.7)",
                                      }
                                    : isTgt
                                    ? {
                                        background:
                                          "linear-gradient(180deg, rgba(232,121,249,0.15), rgba(232,121,249,0.05))",
                                        border: "1.5px solid rgba(232,121,249,0.9)",
                                        color: "#fbcfe8",
                                        boxShadow:
                                          "0 0 10px rgba(232,121,249,0.45)",
                                      }
                                    : {
                                        background:
                                          "linear-gradient(180deg, rgba(165,243,252,0.95), rgba(34,211,238,0.85) 50%, rgba(8,145,178,0.95))",
                                        color: "#001018",
                                        boxShadow:
                                          "0 0 12px rgba(103,232,249,0.6), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.3)",
                                      }
                                }
                              >
                                {o.gate === "CNOT" ? (isCtrl ? "●" : "⊕") : o.gate}
                              </span>
                            );
                          })}
                          {collapsed !== null && (
                            <span className="ml-auto font-mono text-[10px] text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.6)]">
                              → {(collapsed >> q) & 1}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Environmental slider — physical slot */}
              <div className="mt-4 rounded-sm border border-white/10 bg-black/60 p-3">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest">
                  <span className="text-white/55">Decoherence · Gate Error</span>
                  <span className="text-fuchsia-300">{(noise * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range" min={0} max={0.6} step={0.01} value={noise}
                  onChange={(e) => setNoise(parseFloat(e.target.value))}
                  className="quantara-slider mt-2 w-full"
                />
              </div>

              {/* Bloch micro-displays */}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
                <div className="font-mono text-[9px] uppercase tracking-widest text-white/55">Bloch Telemetry</div>
                {blochs.map((b, q) => (
                  <BlochSphere key={q} {...b} label={`q${q}`} />
                ))}
              </div>
            </div>

            {/* Sapphire Gate Palette + actions */}
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-white/55">
                  <span>Sapphire Gate Blocks</span>
                  <span className="text-white/40">tap or drag onto channel</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(["H", "X", "Y", "Z", "S", "T", "CNOT"] as Gate[]).map((g) => {
                    const active = picked === g;
                    return (
                      <button
                        key={g}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/quantara-gate", g);
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        onClick={() => { setPicked(g); setControl(null); }}
                        className={`cursor-grab active:cursor-grabbing select-none rounded-[4px] px-3 py-2 font-mono text-[11px] font-black tracking-wider transition-all`}
                        style={
                          active
                            ? {
                                background:
                                  "radial-gradient(circle at 30% 25%, #fdf4ff, #e879f9 55%, #86198f)",
                                color: "#190322",
                                boxShadow:
                                  "0 0 18px rgba(232,121,249,0.6), inset 0 1px 0 rgba(255,255,255,0.8)",
                              }
                            : {
                                background:
                                  "linear-gradient(180deg, rgba(165,243,252,0.95), rgba(34,211,238,0.85) 50%, rgba(8,145,178,0.95))",
                                color: "#001018",
                                boxShadow:
                                  "0 0 12px rgba(103,232,249,0.55), inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.35)",
                              }
                        }
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
                {picked === "CNOT" && (
                  <div className="mt-2 rounded-sm border border-fuchsia-400/30 bg-fuchsia-400/5 p-2 font-mono text-[10px] text-fuchsia-200">
                    CNOT mode · tap a channel to set <b>control</b>, then a second channel to set <b>target</b>.
                  </div>
                )}
              </div>
              <div className="flex flex-row gap-2 sm:flex-col">
                <button onClick={undo} className="rounded-sm border border-white/15 bg-black/50 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/80 hover:bg-white/5">
                  Undo
                </button>
                <button onClick={clear} className="rounded-sm border border-white/15 bg-black/50 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/80 hover:bg-white/5">
                  Clear
                </button>
              </div>
            </div>
          </GlassPane>

          {/* ===================== ZONE C · SOLVED EXPONENT ===================== */}
          <GlassPane label="Zone C · Solved Exponent Metric" accent="fuchsia">
            <ExponentMetric
              probs={probs}
              n={n}
              collapsed={collapsed}
              maxIdx={maxIdx}
              peakStability={peakStability}
              lambdaMantissa={lambdaMantissa}
              lambdaExp={lambdaExp}
            />
          </GlassPane>
        </div>
      </div>

      <style>{`
        @keyframes qpulse {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes particleRise {
          0%   { transform: translateY(8px); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        .quantara-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: linear-gradient(90deg, #22d3ee, #e879f9);
          border-radius: 999px;
          outline: none;
        }
        .quantara-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px; height: 16px;
          border-radius: 4px;
          background: linear-gradient(180deg, #f5f5f5, #9ca3af);
          border: 1px solid rgba(255,255,255,0.4);
          box-shadow: 0 0 10px rgba(125,211,252,0.6), inset 0 1px 0 rgba(255,255,255,0.8);
          cursor: pointer;
        }
        .quantara-slider::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 4px;
          background: linear-gradient(180deg, #f5f5f5, #9ca3af);
          border: 1px solid rgba(255,255,255,0.4);
          box-shadow: 0 0 10px rgba(125,211,252,0.6);
          cursor: pointer;
        }
      `}</style>
    </section>
  );
}

/* ----- UE5 glass pane wrapper ----- */
function GlassPane({
  label,
  accent,
  children,
}: {
  label: string;
  accent: "cyan" | "fuchsia" | "white";
  children: ReactNode;
}) {
  const edge =
    accent === "cyan"
      ? "rgba(103,232,249,0.55)"
      : accent === "fuchsia"
      ? "rgba(232,121,249,0.55)"
      : "rgba(255,255,255,0.35)";
  return (
    <div
      className="relative rounded-md p-4"
      style={{
        background:
          "linear-gradient(180deg, rgba(20,24,38,0.55), rgba(8,10,18,0.85))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03) inset, 0 30px 60px -30px rgba(0,0,0,0.8), 0 0 30px -10px ${edge}`,
        backdropFilter: "blur(6px)",
      }}
    >
      {/* refractive edge highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${edge}, transparent)`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${edge}, transparent)`,
        }}
      />
      <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.3em] text-white/55">
        {label}
      </div>
      {children}
    </div>
  );
}

/* ----- Particle-spike exponent visualization ----- */
function ExponentMetric({
  probs,
  n,
  collapsed,
  maxIdx,
  peakStability,
  lambdaMantissa,
  lambdaExp,
}: {
  probs: number[];
  n: number;
  collapsed: number | null;
  maxIdx: number;
  peakStability: number;
  lambdaMantissa: string;
  lambdaExp: number;
}) {
  // Particle density on the dominant bin (the magenta spike).
  const peakHeight = Math.max(8, Math.min(100, peakStability * 100));
  const peakParticles = Math.round(14 + peakStability * 26);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-56 overflow-hidden rounded-sm border border-fuchsia-500/15 bg-black/70 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)]">
        {/* violet vacuum-grid floor */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "linear-gradient(180deg, transparent 55%, rgba(91,33,182,0.35) 100%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(167,139,250,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.35) 1px, transparent 1px)",
            backgroundSize: "20px 14px",
            maskImage:
              "linear-gradient(180deg, transparent 0%, black 80%)",
            WebkitMaskImage:
              "linear-gradient(180deg, transparent 0%, black 80%)",
            transform: "perspective(280px) rotateX(58deg)",
            transformOrigin: "bottom center",
          }}
        />

        {/* Histogram bins — dim except the dominant spike */}
        <div className="absolute inset-x-3 bottom-3 top-6 flex items-end gap-1">
          {probs.map((p, i) => {
            const isPeak = i === maxIdx && p > 0.04;
            const isCollapsed = collapsed === i;
            const h = Math.max(3, p * 100);
            return (
              <div key={i} className="relative flex flex-1 flex-col items-center justify-end gap-1">
                {/* the actual bar */}
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${isPeak ? peakHeight : h}%`,
                    background: isCollapsed
                      ? "linear-gradient(180deg, #fde68a, #f59e0b)"
                      : isPeak
                      ? "linear-gradient(180deg, #fdf4ff 0%, #f0abfc 30%, #e879f9 60%, #a21caf 100%)"
                      : "linear-gradient(180deg, rgba(167,139,250,0.35), rgba(91,33,182,0.15))",
                    boxShadow: isPeak
                      ? "0 0 18px rgba(232,121,249,0.85), 0 0 40px rgba(232,121,249,0.5)"
                      : isCollapsed
                      ? "0 0 14px rgba(252,211,77,0.7)"
                      : "none",
                  }}
                />
                {/* particle plume on the dominant spike */}
                {isPeak && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full overflow-hidden">
                    {Array.from({ length: peakParticles }).map((_, k) => (
                      <span
                        key={k}
                        className="absolute block rounded-full bg-fuchsia-200"
                        style={{
                          left: `${10 + Math.random() * 80}%`,
                          bottom: 0,
                          width: 2,
                          height: 2,
                          opacity: 0.7,
                          boxShadow: "0 0 6px #f0abfc",
                          animation: `particleRise ${1.6 + Math.random() * 1.8}s linear infinite`,
                          animationDelay: `${Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className="font-mono text-[8px] text-white/40">
                  {i.toString(2).padStart(n, "0")}
                </div>
              </div>
            );
          })}
        </div>

        {/* hovering crystalline readout */}
        <div className="absolute left-3 top-3 rounded-sm border border-fuchsia-300/40 bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-fuchsia-200 shadow-[0_0_18px_rgba(232,121,249,0.35)]">
          λ-Lock · {(peakStability * 100).toFixed(1)}%
        </div>
      </div>

      {/* Numerical constant lock */}
      <div className="rounded-sm border border-fuchsia-400/25 bg-black/60 p-3 font-mono text-[10px] leading-relaxed text-fuchsia-100 shadow-[0_0_24px_-8px_rgba(232,121,249,0.6)_inset]">
        <div className="text-fuchsia-300/80 text-[9px] uppercase tracking-widest">Numerical Constant Lock</div>
        <div className="mt-1">
          SOLUTION STABILITY: <span className="text-white">{(peakStability * 100).toFixed(2)}%</span>
        </div>
        <div className="text-white">
          Λ = {lambdaMantissa} × 10<sup>{lambdaExp}</sup>
        </div>
        <div className="text-fuchsia-300/80 text-[9px]">
          peak |{maxIdx.toString(2).padStart(n, "0")}⟩ · {(probs[maxIdx] * 100).toFixed(2)}%
        </div>
        {collapsed !== null && (
          <div className="mt-1 text-amber-300">
            collapsed → |{collapsed.toString(2).padStart(n, "0")}⟩
          </div>
        )}
      </div>
    </div>
  );
}
