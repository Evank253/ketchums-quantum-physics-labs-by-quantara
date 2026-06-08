// Compact quantum circuit simulator: 1-3 qubits, gates H/X/Y/Z/S/T/CNOT/Measure
// Visualizes Bloch vectors (single-qubit reduced) + probability histogram.
import { useEffect, useMemo, useState } from "react";
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
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i];
      if (r <= acc) { setCollapsed(i); break; }
    }
    creditDat(8);
    logLedger("benchmark", `Q-Circuit · Measure n=${n} ops=${ops.length}`, { probs });
  };

  const maxP = Math.max(...probs, 0.001);

  return (
    <section id="quantum-lab" className="border-t border-white/5 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Sandbox</div>
          <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">Quantum Circuit Lab</h3>
          <p className="mt-3 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
            Drop gates onto qubit wires. Watch superposition spread the probability histogram and entanglement bind the Bloch vectors. Measurement collapses the wavefunction.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Circuit canvas */}
          <div className="rounded-md border border-white/10 bg-black/50 p-4">
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/60">
              <span>circuit · {n} qubits · {ops.length} ops</span>
              <span className="text-cyan-300">picked: {picked}{picked==="CNOT" && control!==null ? ` (ctrl q${control})` : ""}</span>
            </div>
            <div className="space-y-2">
              {Array.from({length: n}).map((_, q) => {
                const wireOps = ops.map((o, i) => ({ o, i })).filter(({o}) => o.target === q || o.control === q);
                return (
                  <div key={q} className="flex items-center gap-2">
                    <div className="w-10 font-mono text-[11px] text-white/70">q{q}</div>
                    <button
                      onClick={() => place(q)}
                      className="relative flex-1 h-10 rounded border border-white/10 bg-white/[0.02] hover:bg-cyan-400/5 transition-colors"
                    >
                      <div className="absolute inset-y-1/2 left-2 right-2 h-px bg-gradient-to-r from-cyan-400/30 via-white/30 to-fuchsia-400/30" />
                      <div className="absolute inset-0 flex items-center gap-1 px-2">
                        {wireOps.map(({o, i}) => (
                          <span key={i}
                            className={`inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 font-mono text-[10px] font-bold ${
                              o.gate === "CNOT"
                                ? (o.control === q ? "bg-fuchsia-500 text-white" : "border-2 border-fuchsia-400 text-fuchsia-200")
                                : "bg-cyan-400 text-black"
                            }`}>
                            {o.gate === "CNOT" ? (o.control === q ? "●" : "⊕") : o.gate}
                          </span>
                        ))}
                        {collapsed !== null && (
                          <span className="ml-auto font-mono text-[10px] text-amber-300">
                            → {((collapsed >> q) & 1)}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bloch spheres */}
            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/5 pt-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">Bloch</div>
              {Array.from({length: n}).map((_, q) => {
                const b = blochOf(state, n, q);
                return <BlochSphere key={q} {...b} label={`q${q}`} />;
              })}
            </div>

            {/* Histogram */}
            <div className="mt-5 border-t border-white/5 pt-4">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/60">
                <span>probability</span>
                {collapsed !== null && (
                  <span className="text-amber-300">
                    collapsed → |{collapsed.toString(2).padStart(n,"0")}⟩
                  </span>
                )}
              </div>
              <div className="flex items-end gap-1 h-32">
                {probs.map((p, i) => {
                  const h = (p / maxP) * 100;
                  const isC = collapsed === i;
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                      <div className="font-mono text-[9px] text-white/60">{(p*100).toFixed(1)}%</div>
                      <div
                        style={{ height: `${Math.max(2, h)}%` }}
                        className={`w-full rounded-t transition-all ${isC ? "bg-amber-300 shadow-[0_0_18px_#fcd34d]" : "bg-gradient-to-t from-cyan-500 to-fuchsia-400"}`}
                      />
                      <div className="font-mono text-[9px] text-white/40">{i.toString(2).padStart(n,"0")}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-md border border-white/10 bg-white/[0.02] p-4 space-y-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">Qubits</div>
              <div className="mt-2 flex gap-1">
                {[1,2,3].map((k) => (
                  <button key={k} onClick={() => { setN(k); setOps([]); setCollapsed(null); }}
                    className={`flex-1 rounded border px-2 py-1 text-xs font-mono ${n===k?"border-cyan-400 bg-cyan-400/10 text-cyan-200":"border-white/15 text-white/70"}`}>
                    {k}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">Gate Palette</div>
              <div className="mt-2 grid grid-cols-4 gap-1">
                {(["H","X","Y","Z","S","T","CNOT"] as Gate[]).map((g) => (
                  <button key={g} onClick={() => { setPicked(g); setControl(null); }}
                    className={`rounded border px-2 py-2 text-[11px] font-mono font-bold ${picked===g?"border-fuchsia-400 bg-fuchsia-400/10 text-fuchsia-200":"border-white/15 text-white/80 hover:bg-white/5"}`}>
                    {g}
                  </button>
                ))}
              </div>
              {picked === "CNOT" && (
                <div className="mt-2 rounded border border-fuchsia-400/30 bg-fuchsia-400/5 p-2 font-mono text-[10px] text-fuchsia-200">
                  CNOT mode · click a qubit row to set <b>control</b>, then click another row to set <b>target</b>.
                </div>
              )}
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-white/60">Decoherence · {(noise*100).toFixed(0)}%</label>
              <input type="range" min={0} max={0.6} step={0.01} value={noise}
                onChange={(e) => setNoise(parseFloat(e.target.value))} className="mt-2 w-full" />
            </div>
            <div className="flex gap-2">
              <button onClick={measure} className="flex-1 rounded border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-xs font-mono uppercase tracking-widest text-amber-200 hover:bg-amber-400/20">
                Measure
              </button>
              <button onClick={undo} className="rounded border border-white/15 px-3 py-2 text-xs font-mono uppercase tracking-widest text-white/80 hover:bg-white/5">
                Undo
              </button>
              <button onClick={clear} className="rounded border border-white/15 px-3 py-2 text-xs font-mono uppercase tracking-widest text-white/80 hover:bg-white/5">
                Clear
              </button>
            </div>
            <div className="rounded border border-white/10 bg-black/40 p-2 font-mono text-[10px] text-white/60 leading-relaxed">
              <div className="text-cyan-300 mb-1">OpenQASM</div>
              <pre className="whitespace-pre-wrap text-[10px] text-white/80">
{`OPENQASM 2.0;\nqreg q[${n}];\n` + ops.map(o => o.gate === "CNOT" ? `cx q[${o.control}],q[${o.target}];` : `${o.gate.toLowerCase()} q[${o.target}];`).join("\n")}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
