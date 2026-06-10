import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { simulate, DEFAULT_PARAMS, type KVEParams } from "@/lib/kve-physics";

type SliderRow = {
  key: keyof KVEParams;
  label: string;
  min: number;
  max: number;
  step: number;
};

const CONTROLS: SliderRow[] = [
  { key: "lambda", label: "λ (potential slope)", min: 0.1, max: 100, step: 0.01 },
  { key: "omegaM0", label: "Ω_m today", min: 0.05, max: 0.6, step: 0.005 },
  { key: "omegaR0", label: "Ω_r today (×10⁻⁵)", min: 0, max: 50, step: 0.1 },
  { key: "phi0", label: "φ₀ initial", min: 0, max: 12, step: 0.01 },
  { key: "psi0", label: "ψ₀ initial (×10⁻⁸)", min: 0, max: 100, step: 0.1 },
];

export function KveLab() {
  const [raw, setRaw] = useState<KVEParams>(DEFAULT_PARAMS);

  const params = useMemo<KVEParams>(
    () => ({
      ...raw,
      // unit scaling for the two scaled sliders
      omegaR0: raw.omegaR0,
      psi0: raw.psi0,
    }),
    [raw],
  );

  const { frames, cpl } = useMemo(() => simulate(params), [params]);

  // Decimate for chart performance
  const data = useMemo(() => {
    const stride = Math.max(1, Math.floor(frames.length / 400));
    return frames
      .filter((_, i) => i % stride === 0)
      .map((f) => ({
        N: f.N.toFixed(3),
        a: f.a,
        phi: f.phi,
        w: f.w,
        wEff: f.wEff,
        H: f.H,
        OmegaM: f.OmegaM,
        OmegaR: f.OmegaR,
        OmegaPhi: f.OmegaPhi,
        D: f.D,
        civ: f.civIndex,
      }));
  }, [frames]);

  const today = frames[frames.length - 1];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            KVE — Scalar-Field Cosmology Lab
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Canonical scalar field <span className="font-mono">φ</span> with
            exponential potential{" "}
            <span className="font-mono">V(φ) = V₀ e^(−λφ/M_pl)</span> in a flat
            FRW background. ODE system evolved in{" "}
            <span className="font-mono">N = ln a</span> with RK4. Includes
            linear matter growth and a low-z CPL{" "}
            <span className="font-mono">w(a) = w₀ + wₐ(1−a)</span> fit. Runs
            entirely in your browser.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-5">
            <h2 className="font-semibold">Parameters</h2>
            {CONTROLS.map((c) => {
              const display =
                c.key === "omegaR0"
                  ? raw.omegaR0 * 1e5
                  : c.key === "psi0"
                  ? raw.psi0 * 1e8
                  : (raw[c.key] as number);
              return (
                <label key={c.key} className="block space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{c.label}</span>
                    <span className="font-mono text-muted-foreground">
                      {display.toFixed(c.step < 0.01 ? 3 : 2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={c.min}
                    max={c.max}
                    step={c.step}
                    value={display}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setRaw((s) => ({
                        ...s,
                        [c.key]:
                          c.key === "omegaR0"
                            ? v * 1e-5
                            : c.key === "psi0"
                            ? v * 1e-8
                            : v,
                      }));
                    }}
                    className="w-full accent-primary"
                  />
                </label>
              );
            })}
            <button
              onClick={() => setRaw(DEFAULT_PARAMS)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition"
            >
              Reset to defaults
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="w₀ (CPL fit)" value={cpl.w0.toFixed(4)} />
            <Stat label="wₐ (CPL fit)" value={cpl.wa.toFixed(4)} />
            <Stat label="Ω_φ today" value={today.OmegaPhi.toFixed(3)} />
            <Stat label="Ω_m today" value={today.OmegaM.toFixed(3)} />
            <Stat label="w_φ today" value={today.w.toFixed(3)} />
            <Stat label="w_eff today" value={today.wEff.toFixed(3)} />
            <Stat label="H today" value={today.H.toExponential(3)} />
            <Stat label="φ today" value={today.phi.toFixed(3)} />
          </div>
        </section>

        <Panel
          title="Panel 1 — Universe State: φ(N) and w(a)"
          subtitle="Scalar field evolution and dark-energy equation of state"
        >
          <ChartBlock data={data} xKey="N" lines={[
            { key: "phi", color: "hsl(var(--primary))", label: "φ(N)" },
            { key: "w", color: "#ef4444", label: "w_φ(a)" },
          ]} />
        </Panel>

        <Panel
          title="Panel 2 — Expansion Engine: H(a) and density fractions"
        >
          <ChartBlock data={data} xKey="N" lines={[
            { key: "H", color: "hsl(var(--primary))", label: "H(N)" },
            { key: "OmegaM", color: "#22c55e", label: "Ω_m" },
            { key: "OmegaPhi", color: "#a855f7", label: "Ω_φ" },
            { key: "OmegaR", color: "#f59e0b", label: "Ω_r" },
          ]} />
        </Panel>

        <Panel
          title="Panel 3 — Structure Growth: D(a)"
          subtitle="δ'' + (2 + Ḣ/H²)δ' − (3/2)Ω_m δ = 0, normalized so D(today)=1"
        >
          <ChartBlock data={data} xKey="N" lines={[
            { key: "D", color: "hsl(var(--primary))", label: "D(a)" },
          ]} />
        </Panel>

        <Panel
          title="Panel 4 — Interpretation Layer (visual metaphor, not physics)"
          subtitle="Civilization emergence index = D(a) · Ω_m(a). Derived overlay only."
        >
          <ChartBlock data={data} xKey="N" lines={[
            { key: "civ", color: "#06b6d4", label: "civ index" },
          ]} />
        </Panel>

        <footer className="text-xs text-muted-foreground pt-4 border-t border-border">
          <p>
            Units: M_pl = V₀ = 1. CPL fit performed on N &gt; −1 (low-z) slice
            by linear least squares. No CLASS/CAMB/MCMC — that requires the
            external Python pipeline in your spec.
          </p>
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-lg">{value}</div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ChartBlock({
  data,
  xKey,
  lines,
}: {
  data: Array<Record<string, number | string>>;
  xKey: string;
  lines: Array<{ key: string; color: string; label: string }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey={xKey} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label}
              stroke={l.color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
