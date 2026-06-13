import { useMemo, useState } from "react";
import { saveSolve } from "@/lib/solved-archive";

// Two-qubit gate forge. State stored as 4 complex amps (re/im).
type Amp = [number, number];
type State4 = [Amp, Amp, Amp, Amp]; // |00>,|01>,|10>,|11>

const ZERO: State4 = [[1, 0], [0, 0], [0, 0], [0, 0]];

const cmul = (a: Amp, b: Amp): Amp => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cadd = (a: Amp, b: Amp): Amp => [a[0] + b[0], a[1] + b[1]];
const cscale = (a: Amp, s: number): Amp => [a[0] * s, a[1] * s];

function apply(g: Gate, s: State4): State4 {
  if (g === "H1") {
    // Hadamard on qubit 1
    const inv = 1 / Math.SQRT2;
    return [
      cscale(cadd(s[0], s[2]), inv),
      cscale(cadd(s[1], s[3]), inv),
      cscale(cadd(s[0], cscale(s[2], -1)), inv),
      cscale(cadd(s[1], cscale(s[3], -1)), inv),
    ];
  }
  if (g === "H0") {
    const inv = 1 / Math.SQRT2;
    return [
      cscale(cadd(s[0], s[1]), inv),
      cscale(cadd(s[0], cscale(s[1], -1)), inv),
      cscale(cadd(s[2], s[3]), inv),
      cscale(cadd(s[2], cscale(s[3], -1)), inv),
    ];
  }
  if (g === "CNOT") {
    // control=1 (top), target=0; flips |10>↔|11>
    return [s[0], s[1], s[3], s[2]];
  }
  if (g === "CZ") {
    return [s[0], s[1], s[2], cscale(s[3], -1)];
  }
  if (g === "T1") {
    // T on qubit 1 phase e^{iπ/4} on |1*>
    const c = Math.cos(Math.PI / 4), si = Math.sin(Math.PI / 4);
    const phase: Amp = [c, si];
    return [s[0], s[1], cmul(phase, s[2]), cmul(phase, s[3])];
  }
  return s;
}

type Gate = "H0" | "H1" | "CNOT" | "CZ" | "T1";
const GATES: Gate[] = ["H0", "H1", "CNOT", "CZ", "T1"];

function fidelityBell(s: State4): number {
  // |Φ+> = (|00>+|11>)/√2
  const inv = 1 / Math.SQRT2;
  const inner = cadd(cscale(s[0], inv), cscale(s[3], inv));
  return inner[0] * inner[0] + inner[1] * inner[1];
}

function entropy(s: State4): number {
  // Schmidt entropy from 2x2 reduced density (trace-out qubit 0)
  // rho_B[i,j] = sum_a s[a,i] * conj(s[a,j])
  // basis ordering: index = 2*a + b where a=qubit1, b=qubit0
  const rho = [
    [[0, 0], [0, 0]],
    [[0, 0], [0, 0]],
  ] as Amp[][];
  for (let b1 = 0; b1 < 2; b1++) {
    for (let b2 = 0; b2 < 2; b2++) {
      for (let a = 0; a < 2; a++) {
        const x = s[2 * a + b1];
        const y: Amp = [s[2 * a + b2][0], -s[2 * a + b2][1]];
        rho[b1][b2] = cadd(rho[b1][b2], cmul(x, y));
      }
    }
  }
  // 2x2 eigenvalues
  const a = rho[0][0][0], d = rho[1][1][0];
  const trace = a + d;
  const det = a * d - (rho[0][1][0] * rho[1][0][0] - (-rho[0][1][1]) * rho[1][0][1]);
  const disc = Math.max(0, trace * trace - 4 * det);
  const l1 = (trace + Math.sqrt(disc)) / 2;
  const l2 = (trace - Math.sqrt(disc)) / 2;
  const safe = (x: number) => (x > 1e-12 ? -x * Math.log2(x) : 0);
  return safe(l1) + safe(l2);
}

export function EntangledGateSmith() {
  const [circuit, setCircuit] = useState<Gate[]>(["H1", "CNOT"]);
  const state = useMemo(() => circuit.reduce<State4>((acc, g) => apply(g, acc), ZERO), [circuit]);
  const fid = fidelityBell(state);
  const ent = entropy(state);

  const archive = () => {
    void saveSolve({
      theory: `Forged 2-qubit entangler: ${circuit.join("→")}`,
      solver: "Entangled Gate Smith",
      abstract: `2-qubit circuit ${circuit.join(" · ") || "(empty)"} starting from |00⟩ yields Bell-Φ⁺ fidelity ${fid.toFixed(6)} and von-Neumann entanglement entropy S = ${ent.toFixed(6)} bits.`,
      math: `|ψ⟩ = ${state.map((c, i) => `${["|00⟩", "|01⟩", "|10⟩", "|11⟩"][i]} (${c[0].toFixed(3)}${c[1] >= 0 ? "+" : ""}${c[1].toFixed(3)}i)`).join(" + ")}\nF(Φ⁺) = ${fid.toFixed(8)}\nS(ρ_B) = ${ent.toFixed(8)}`,
      source: "entangled-gate-smith",
    });
  };

  return (
    <div className="rounded-md border border-white/10 bg-card/40 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">Instrument · 02</div>
          <h4 className="mt-1 text-xl font-black tracking-[-0.02em] text-white">Entangled Gate Smith</h4>
        </div>
        <div className="font-mono text-[10px] text-fuchsia-300">F(Φ⁺) = {fid.toFixed(4)}</div>
      </div>

      <div className="rounded border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-cyan-200">
        |00⟩ ─[ {circuit.join(" ─ ") || "·"} ]─→ |ψ⟩
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {GATES.map((g) => (
          <button key={g} onClick={() => setCircuit((c) => [...c, g])}
            className="rounded border border-fuchsia-400/40 bg-fuchsia-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-fuchsia-200 hover:bg-fuchsia-400/20">+ {g}</button>
        ))}
        <button onClick={() => setCircuit([])}
          className="rounded border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-white/60 hover:bg-white/5">clear</button>
        <button onClick={() => setCircuit(["H1", "CNOT"])}
          className="rounded border border-emerald-400/30 bg-emerald-400/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-200 hover:bg-emerald-400/10">→ Bell pair</button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 font-mono text-[10px]">
        {(["|00⟩", "|01⟩", "|10⟩", "|11⟩"] as const).map((b, i) => {
          const p = state[i][0] * state[i][0] + state[i][1] * state[i][1];
          return (
            <div key={b} className="rounded border border-white/10 bg-black/40 p-2 text-center">
              <div className="text-chrome/70">{b}</div>
              <div className="text-white">{p.toFixed(3)}</div>
              <div className="mt-1 h-1 bg-white/5"><div className="h-full bg-fuchsia-400" style={{ width: `${p * 100}%` }} /></div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] font-mono">
        <div className="rounded border border-white/10 bg-black/30 p-2">
          <div className="text-chrome">Entanglement S</div>
          <div className="text-fuchsia-200">{ent.toFixed(4)} bits</div>
        </div>
        <button onClick={archive} className="rounded border border-emerald-400/40 bg-emerald-400/10 px-2 font-mono text-[10px] uppercase tracking-widest text-emerald-200 hover:bg-emerald-400/20">Archive solve</button>
      </div>
    </div>
  );
}
