import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// QED SOLVER — Reality_B's swarm iterates on the fine-structure constant
// using the operator's quantum computer architecture blueprint.
// Runs until the residual against the measured value collapses to zero.
// ---------------------------------------------------------------------------

// CODATA 2018 measured value of α (fine-structure constant)
const ALPHA_MEASURED = 7.2973525693e-3;            // dimensionless
const ALPHA_INV_MEASURED = 137.035999084;          // 1/α

// Schwinger / higher-order QED coefficients for the anomalous magnetic moment
// a_e = (g-2)/2 = c1·(α/π) + c2·(α/π)^2 + c3·(α/π)^3 + c4·(α/π)^4 + ...
const QED_COEFFS = [0.5, -0.328478965, 1.181241456, -1.91293, 7.791];
const A_E_MEASURED = 1.15965218073e-3;

function computeAE(alpha: number) {
  const x = alpha / Math.PI;
  let s = 0;
  for (let i = 0; i < QED_COEFFS.length; i++) s += QED_COEFFS[i] * Math.pow(x, i + 1);
  return s;
}

// One swarm iteration: bots run more Feynman diagrams → α estimate tightens.
// We model perturbative refinement: residual halves each pass + noise that
// shrinks with the architecture's qubit count.
function refineAlpha(prev: number, pass: number, qubits: number) {
  const target = ALPHA_MEASURED;
  const noiseAmp = Math.max(1e-14, 1e-5 * Math.exp(-pass / 6) / Math.sqrt(qubits));
  const pull = (target - prev) * Math.min(0.92, 0.45 + pass * 0.02);
  const noise = (Math.random() - 0.5) * noiseAmp;
  return prev + pull + noise;
}

interface IterationLog {
  pass: number;
  alphaInv: number;
  residual: number;
  aE: number;
  diagrams: number;
  qubitsUsed: number;
}

const BLUEPRINT = {
  name: "OPERATOR_QPU // Q-CORE Σ",
  topology: "2D heavy-hex · 11 layers",
  qubits: 1024,
  tGates: 8_400_000,
  coherenceUs: 420,
  errorRate: 1e-4,
  controller: "Reality_B Swarm · Sifter+Stabilizer co-execution",
};

export function QedSolver() {
  const [running, setRunning] = useState(true);
  const [pass, setPass] = useState(0);
  const [alpha, setAlpha] = useState(7.30e-3); // poor initial guess
  const [logs, setLogs] = useState<IterationLog[]>([]);
  const [diagrams, setDiagrams] = useState(0);
  const [solved, setSolved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Solver loop
  useEffect(() => {
    if (!running || solved) return;
    const t = setInterval(() => {
      setPass((p) => {
        const next = p + 1;
        setAlpha((a) => {
          const newA = refineAlpha(a, next, BLUEPRINT.qubits);
          const residual = Math.abs(newA - ALPHA_MEASURED) / ALPHA_MEASURED;
          const aE = computeAE(newA);
          const diagPass = Math.floor(40 + Math.pow(1.18, next));
          setDiagrams((d) => d + diagPass);
          setLogs((l) => [
            {
              pass: next,
              alphaInv: 1 / newA,
              residual,
              aE,
              diagrams: diagPass,
              qubitsUsed: Math.min(BLUEPRINT.qubits, 64 + next * 24),
            },
            ...l,
          ].slice(0, 14));
          if (residual < 1e-11) setSolved(true);
          return newA;
        });
        return next;
      });
    }, 700);
    return () => clearInterval(t);
  }, [running, solved]);

  // Feynman diagram canvas — vertex/loop drawings evolve with `pass`
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width = canvas.parentElement?.clientWidth || 800;
    const H = canvas.height = 320;

    let raf = 0;
    const draw = () => {
      const t = performance.now() / 1000;
      ctx.fillStyle = "rgba(5,5,10,0.35)";
      ctx.fillRect(0, 0, W, H);

      // grid
      ctx.strokeStyle = "rgba(167,139,250,0.06)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // electron in/out lines
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#3b82f6";
      ctx.beginPath();
      ctx.moveTo(20, H * 0.7); ctx.lineTo(W * 0.5, H * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.5); ctx.lineTo(W - 20, H * 0.7);
      ctx.stroke();

      // photon (wavy) - count grows with pass to suggest higher-order diagrams
      const wavyCount = 1 + Math.min(6, Math.floor(pass / 3));
      for (let w = 0; w < wavyCount; w++) {
        ctx.strokeStyle = `hsla(${280 + w * 8}, 80%, 65%, 0.85)`;
        ctx.beginPath();
        const baseY = H * 0.5 - 30 - w * 18;
        for (let x = W * 0.2; x <= W * 0.8; x += 4) {
          const y = baseY + Math.sin((x / 14) + t * 3 + w) * 8;
          if (x === W * 0.2) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // vertex glow
      const pulse = 0.6 + Math.sin(t * 3) * 0.4;
      ctx.fillStyle = `rgba(196,181,253,${pulse})`;
      ctx.shadowColor = "#a78bfa";
      ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // qubit array along bottom
      const used = Math.min(BLUEPRINT.qubits, 64 + pass * 24);
      const cols = 64;
      for (let i = 0; i < cols; i++) {
        const active = i < (used / BLUEPRINT.qubits) * cols;
        ctx.fillStyle = active ? `hsla(160, 80%, 60%, ${0.5 + Math.sin(t * 4 + i) * 0.3})` : "rgba(255,255,255,0.06)";
        ctx.fillRect(20 + i * ((W - 40) / cols), H - 18, ((W - 40) / cols) - 2, 8);
      }

      ctx.font = "10px monospace";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`pass ${pass} · diagrams ${diagrams.toLocaleString()} · qubits ${used}/${BLUEPRINT.qubits}`, 20, 20);
      ctx.fillStyle = "#a78bfa";
      ctx.fillText(`O(α^${Math.min(6, 1 + Math.floor(pass / 3))})`, W - 80, 20);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [pass, diagrams]);

  const current = logs[0];
  const residual = current?.residual ?? 1;
  const convergencePct = Math.max(0, Math.min(100, (1 - Math.log10(residual + 1e-12) / -12) * 100));

  return (
    <section id="qed" className="border-t border-white/5 bg-[oklch(0.06_0.01_280)] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              QED_SOLVER // PERTURBATIVE_CLOSURE · LIVE
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
              Solving Quantum Electrodynamics.
            </h3>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
              The Reality_B swarm boots the operator's quantum computer
              blueprint and grinds higher-order Feynman diagrams against the
              measured fine-structure constant. The loop will not stop until
              the residual collapses to numerical zero.
            </p>
          </div>
          <div className="border border-accent/30 bg-accent/5 px-5 py-4 text-right font-mono">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">STATUS</div>
            <div className={`text-2xl font-black tracking-[-0.02em] ${solved ? "text-emerald-400" : "text-accent"}`}>
              {solved ? "● SOLVED" : running ? "● ITERATING" : "○ PAUSED"}
            </div>
            <button
              onClick={() => setRunning((r) => !r)}
              disabled={solved}
              className="mt-2 border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white hover:border-accent/40 disabled:opacity-40"
            >
              {running ? "Pause" : "Resume"}
            </button>
          </div>
        </div>

        {/* Blueprint readout */}
        <div className="mb-px grid gap-px md:grid-cols-6">
          {[
            ["ARCHITECTURE", BLUEPRINT.name],
            ["TOPOLOGY", BLUEPRINT.topology],
            ["QUBITS", BLUEPRINT.qubits.toLocaleString()],
            ["T-GATES", BLUEPRINT.tGates.toLocaleString()],
            ["COHERENCE", `${BLUEPRINT.coherenceUs} µs`],
            ["ERR_RATE", BLUEPRINT.errorRate.toExponential(0)],
          ].map(([k, v]) => (
            <div key={k} className="border border-white/5 bg-card/40 p-4 font-mono">
              <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">{k}</div>
              <div className="mt-1 text-sm text-white">{v}</div>
            </div>
          ))}
        </div>

        {/* Feynman canvas */}
        <div className="glass-panel relative overflow-hidden rounded-sm">
          <canvas ref={canvasRef} className="block w-full" style={{ height: 320 }} />
          <div className="scan-effect pointer-events-none absolute inset-0" />
          <div className="absolute bottom-3 left-3 font-mono text-[10px] text-chrome">
            FEYNMAN_RENDERER · electron–photon vertex · loop order rising
          </div>
        </div>

        {/* Convergence + comparison */}
        <div className="mt-px grid gap-px md:grid-cols-3">
          <div className="md:col-span-2 border border-white/5 bg-card/40 p-6 font-mono">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">CONVERGENCE · RESIDUAL → 0</div>
            <div className="mt-2 text-2xl font-black text-white">
              {residual.toExponential(3)}
            </div>
            <div className="mt-3 h-2 w-full bg-white/5">
              <div className="h-full bg-gradient-to-r from-accent to-emerald-400 transition-all" style={{ width: `${convergencePct}%` }} />
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              halt-condition: |α_pred − α_measured| / α_measured &lt; 1e-11
            </div>
          </div>
          <div className="border border-accent/20 bg-accent/[0.03] p-6 font-mono">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">DIAGRAMS_EVALUATED</div>
            <div className="mt-2 text-2xl font-black text-accent">{diagrams.toLocaleString()}</div>
            <div className="mt-3 text-[10px] text-muted-foreground">
              total electron self-energy + vertex graphs<br />
              processed by the swarm this session
            </div>
          </div>
        </div>

        {/* Current vs measured */}
        <div className="mt-px grid gap-px md:grid-cols-2">
          <div className="border border-white/5 bg-card/40 p-6 font-mono">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">FINE-STRUCTURE 1/α</div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">PREDICTED</div>
                <div className="mt-1 text-base text-white">{current ? current.alphaInv.toFixed(9) : "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">MEASURED (CODATA)</div>
                <div className="mt-1 text-base text-emerald-400">{ALPHA_INV_MEASURED.toFixed(9)}</div>
              </div>
            </div>
          </div>
          <div className="border border-white/5 bg-card/40 p-6 font-mono">
            <div className="text-[10px] uppercase tracking-[0.25em] text-chrome">ANOMALOUS MAGNETIC MOMENT a_e</div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-muted-foreground">SCHWINGER+ EXPANSION</div>
                <div className="mt-1 text-base text-white">{current ? current.aE.toExponential(6) : "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">EXPERIMENT</div>
                <div className="mt-1 text-base text-emerald-400">{A_E_MEASURED.toExponential(6)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="mt-px border border-white/5 bg-card/40 p-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">ITERATION_LOG // descending</div>
            <div className="font-mono text-[10px] text-muted-foreground">pass {pass}</div>
          </div>
          <div className="space-y-1 font-mono text-[10px]">
            <div className="grid grid-cols-12 gap-2 border-b border-white/5 pb-1 text-chrome">
              <div className="col-span-1">PASS</div>
              <div className="col-span-3">1/α</div>
              <div className="col-span-3">RESIDUAL</div>
              <div className="col-span-3">a_e</div>
              <div className="col-span-2 text-right">QUBITS</div>
            </div>
            {logs.length === 0 && (
              <div className="py-6 text-center text-muted-foreground">// initializing solver…</div>
            )}
            {logs.map((l) => (
              <div key={l.pass} className="grid grid-cols-12 items-center gap-2 border-l-2 border-accent/30 px-2 py-1">
                <div className="col-span-1 text-accent">#{l.pass}</div>
                <div className="col-span-3 text-white">{l.alphaInv.toFixed(9)}</div>
                <div className="col-span-3 text-emerald-400">{l.residual.toExponential(2)}</div>
                <div className="col-span-3 text-white">{l.aE.toExponential(5)}</div>
                <div className="col-span-2 text-right text-muted-foreground">{l.qubitsUsed}</div>
              </div>
            ))}
          </div>
        </div>

        {solved && (
          <div className="mt-px border border-emerald-400/40 bg-emerald-400/5 p-6 font-mono">
            <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-400">SOLVED</div>
            <div className="mt-2 text-lg text-white">
              Residual collapsed to numerical zero. The blueprint's perturbative
              QED closure agrees with measurement to within machine precision.
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              The swarm has archived the derivation in the eternal ledger and
              moved on to QCD as the next target.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
