// Compact quantum circuit simulator: 1-3 qubits, gates H/X/Y/Z/S/T/CNOT/Measure
// Visualizes Bloch vectors (single-qubit reduced) + probability histogram.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
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
  // 0 = perf mode (no particles / static refraction), 1 = full FX.
  const [shaderIntensity, setShaderIntensity] = useState(0.75);

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

  // Export presets ---------------------------------------------------------
  const PNG_PRESETS = {
    hd:  { label: "HD 1280×720",       w: 1280, h: 720,  badge: "[1280×720]"   },
    fhd: { label: "FHD 1920×1080",     w: 1920, h: 1080, badge: "[1920×1080]"  },
    qhd: { label: "2K 2560×1440",      w: 2560, h: 1440, badge: "[2560×1440]"  },
    uhd: { label: "4K 3840×2160",      w: 3840, h: 2160, badge: "[3840×2160 · 4K]" },
    sq:  { label: "Square 2048×2048",  w: 2048, h: 2048, badge: "[2048² · social]" },
  } as const;
  type PngPreset = keyof typeof PNG_PRESETS;

  const GIF_PRESETS = {
    sm: { label: "Small · 480p · 12 fps · 2.5s", w: 480,  h: 270, fps: 12, dur: 2.5 },
    md: { label: "Medium · 640p · 20 fps · 3s",  w: 640,  h: 360, fps: 20, dur: 3.0 },
    lg: { label: "Large · 960p · 24 fps · 4s",   w: 960,  h: 540, fps: 24, dur: 4.0 },
    sq: { label: "Square · 540² · 18 fps · 3s",  w: 540,  h: 540, fps: 18, dur: 3.0 },
  } as const;
  type GifPreset = keyof typeof GIF_PRESETS;

  const [pngPreset, setPngPreset] = useState<PngPreset>("fhd");
  const [gifPreset, setGifPreset] = useState<GifPreset>("md");
  const [pngTransparent, setPngTransparent] = useState(false);
  const [gifTransparent, setGifTransparent] = useState(false);
  const [exporting, setExporting] = useState<null | "png" | "gif">(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportLabel, setExportLabel] = useState("");

  // New: resolution multiplier, watermark, GIF frame range, saved profiles
  const [resScale, setResScale] = useState(1);             // 0.5 .. 2
  const [watermarkOn, setWatermarkOn] = useState(true);
  const [watermarkText, setWatermarkText] = useState("QUANTARA · quantara.app");
  type WmPos = "br" | "bl" | "tr" | "tl";
  const [watermarkPos, setWatermarkPos] = useState<WmPos>("br");
  const [watermarkColor, setWatermarkColor] = useState("#e9d5ff");
  const [watermarkSize, setWatermarkSize] = useState(12);   // px @ 1280-wide
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.9);
  const [gifStart, setGifStart] = useState(0);             // 0 .. 1
  const [gifEnd, setGifEnd] = useState(1);                 // 0 .. 1
  const cancelRef = useRef(false);
  type ExportProfile = {
    name: string; pngPreset: PngPreset; gifPreset: GifPreset;
    pngTransparent: boolean; gifTransparent: boolean;
    resScale: number; watermarkOn: boolean; watermarkText: string;
    watermarkPos?: WmPos; watermarkColor?: string; watermarkSize?: number; watermarkOpacity?: number;
    gifStart: number; gifEnd: number;
  };
  const PROFILE_KEY = "quantara.exportProfiles.v1";
  const [profiles, setProfiles] = useState<ExportProfile[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]"); } catch { return []; }
  });
  const [profileName, setProfileName] = useState("");
  const profileFileRef = useRef<HTMLInputElement | null>(null);
  const persistProfiles = (next: ExportProfile[]) => {
    setProfiles(next);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch {}
  };
  const saveProfile = () => {
    const name = profileName.trim() || `Preset ${profiles.length + 1}`;
    const p: ExportProfile = {
      name, pngPreset, gifPreset, pngTransparent, gifTransparent,
      resScale, watermarkOn, watermarkText, watermarkPos, watermarkColor, watermarkSize, watermarkOpacity,
      gifStart, gifEnd,
    };
    const next = [...profiles.filter((x) => x.name !== name), p];
    persistProfiles(next);
    setProfileName("");
  };
  const loadProfile = (name: string) => {
    const p = profiles.find((x) => x.name === name);
    if (!p) return;
    setPngPreset(p.pngPreset); setGifPreset(p.gifPreset);
    setPngTransparent(p.pngTransparent); setGifTransparent(p.gifTransparent);
    setResScale(p.resScale); setWatermarkOn(p.watermarkOn);
    setWatermarkText(p.watermarkText);
    if (p.watermarkPos) setWatermarkPos(p.watermarkPos);
    if (p.watermarkColor) setWatermarkColor(p.watermarkColor);
    if (typeof p.watermarkSize === "number") setWatermarkSize(p.watermarkSize);
    if (typeof p.watermarkOpacity === "number") setWatermarkOpacity(p.watermarkOpacity);
    setGifStart(p.gifStart); setGifEnd(p.gifEnd);
  };
  const deleteProfile = (name: string) => persistProfiles(profiles.filter((x) => x.name !== name));
  const exportProfilesFile = () => {
    const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `quantara-export-profiles-${Date.now()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importProfilesFile = async (file: File) => {
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (!Array.isArray(parsed)) return;
      const byName = new Map(profiles.map((p) => [p.name, p]));
      for (const p of parsed) {
        if (p && typeof p.name === "string") byName.set(p.name, p as ExportProfile);
      }
      persistProfiles(Array.from(byName.values()));
    } catch {}
  };
  const cancelExport = () => { cancelRef.current = true; };

  // Draw a frame into a canvas. Used by both PNG and GIF paths.
  const drawFrameInto = (
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
    probsOverride: number[],
    collapsedOverride: number | null,
    badge: string | undefined,
    transparent: boolean,
  ) => {
    ctx.clearRect(0, 0, W, H);
    if (!transparent) {
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#06070c"); bg.addColorStop(1, "#03040a");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    }
    const S = W / 1280;
    ctx.fillStyle = "#a5f3fc";
    ctx.font = `bold ${28*S}px ui-monospace, monospace`;
    ctx.fillText("QUANTARA · QUANTUM CIRCUIT FRAME", 48*S, 64*S);
    ctx.fillStyle = transparent ? "#cbd5e1" : "#94a3b8";
    ctx.font = `${14*S}px ui-monospace, monospace`;
    ctx.fillText(`n=${n} · ops=${ops.length} · noise=${(noise*100).toFixed(0)}%${badge ? "  " + badge : ""}`, 48*S, 92*S);
    const padL = 80*S, padR = 80*S, padT = 160*S, padB = 140*S;
    const gw = W - padL - padR;
    const gh = H - padT - padB;
    const bw = gw / probsOverride.length;
    const localMax = probsOverride.indexOf(Math.max(...probsOverride));
    probsOverride.forEach((p, i) => {
      const h = Math.max(2*S, p * gh);
      const x = padL + i * bw + bw * 0.12;
      const y = padT + (gh - h);
      const w = bw * 0.76;
      const isPeak = i === localMax && p > 0.04;
      const isC = collapsedOverride === i;
      const grd = ctx.createLinearGradient(x, y, x, y + h);
      if (isC) { grd.addColorStop(0, "#fde68a"); grd.addColorStop(1, "#f59e0b"); }
      else if (isPeak) { grd.addColorStop(0, "#fdf4ff"); grd.addColorStop(0.5, "#e879f9"); grd.addColorStop(1, "#86198f"); }
      else { grd.addColorStop(0, "rgba(167,139,250,0.65)"); grd.addColorStop(1, "rgba(91,33,182,0.25)"); }
      ctx.fillStyle = grd;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = transparent ? "#94a3b8" : "#64748b";
      ctx.font = `${11*S}px ui-monospace, monospace`;
      ctx.fillText(`|${i.toString(2).padStart(n, "0")}⟩`, x, H - padB + 18*S);
      ctx.fillText(`${(p*100).toFixed(1)}%`, x, H - padB + 34*S);
    });
    const stab = (probsOverride[localMax] || 0) * (1 - noise);
    const lExp = Math.round(-12 - stab * 110);
    const lMan = (1 + stab * 0.9).toFixed(4);
    ctx.fillStyle = "#f0abfc";
    ctx.font = `bold ${18*S}px ui-monospace, monospace`;
    ctx.fillText(`SOLUTION STABILITY: ${(stab*100).toFixed(2)}%   Λ = ${lMan} × 10^${lExp}`, 48*S, H - 60*S);
    ctx.fillStyle = transparent ? "#cbd5e1" : "#94a3b8";
    ctx.font = `${12*S}px ui-monospace, monospace`;
    ctx.fillText(collapsedOverride !== null ? `collapsed → |${collapsedOverride.toString(2).padStart(n,"0")}⟩` : "superposition · unmeasured", 48*S, H - 38*S);

    // Watermark — configurable position, color, size, opacity
    if (watermarkOn && watermarkText.trim()) {
      const txt = watermarkText.trim();
      ctx.save();
      const sz = Math.max(6, watermarkSize) * S;
      ctx.font = `${sz}px ui-monospace, monospace`;
      const tw = ctx.measureText(txt).width;
      const padX = 24 * S, padY = 22 * S;
      let px = W - tw - padX, py = H - padY;
      if (watermarkPos === "bl") { px = padX; py = H - padY; }
      else if (watermarkPos === "tr") { px = W - tw - padX; py = padY + sz; }
      else if (watermarkPos === "tl") { px = padX; py = padY + sz; }
      ctx.globalAlpha = Math.min(1, Math.max(0, watermarkOpacity)) * 0.6;
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(px - 8*S, py - sz - 2*S, tw + 16*S, sz + 8*S);
      ctx.globalAlpha = Math.min(1, Math.max(0, watermarkOpacity));
      ctx.fillStyle = watermarkColor;
      ctx.fillText(txt, px, py);
      ctx.restore();
    }
  };

  const exportFrame = () => {
    if (exporting) return;
    const preset = PNG_PRESETS[pngPreset];
    const W = Math.max(320, Math.round(preset.w * resScale));
    const H = Math.max(180, Math.round(preset.h * resScale));
    const badge = `[${W}×${H}${resScale !== 1 ? ` · ${resScale.toFixed(2)}x` : ""}]`;
    setExporting("png");
    setExportLabel(`PNG · ${preset.label}${resScale !== 1 ? ` @${resScale.toFixed(2)}x` : ""}${pngTransparent ? " · alpha" : ""}`);
    setExportProgress(0.15);
    // give the UI a tick to repaint
    requestAnimationFrame(() => {
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d")!;
      drawFrameInto(ctx, W, H, probs, collapsed, badge, pngTransparent);
      setExportProgress(0.7);
      c.toBlob((blob) => {
        setExportProgress(1);
        setTimeout(() => { setExporting(null); setExportProgress(0); }, 350);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `quantara-frame-${pngPreset}-${W}x${H}${pngTransparent ? "-alpha" : ""}-${Date.now()}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
      logLedger("kernel", `Q-Circuit · render frame ${pngPreset} @${resScale.toFixed(2)}x n=${n}`);
      creditDat(pngPreset === "uhd" ? 16 : pngPreset === "qhd" ? 10 : pngPreset === "fhd" ? 6 : 4);
    });
  };

  // Compute frame-probs along the collapse timeline at t∈[0,1]. Used by GIF and preview.
  const computeFrameAt = (t: number, target: number): { probs: number[]; collapsed: number | null } => {
    const uniform = probs.map(() => 1 / probs.length);
    if (t < 0.45) {
      const k = t / 0.45;
      return { probs: probs.map((p, i) => uniform[i] * (1 - k) + p * k), collapsed: null };
    } else if (t < 0.7) {
      return { probs: probs.slice(), collapsed: null };
    } else {
      const k = (t - 0.7) / 0.3;
      const fp = probs.map((p, i) => (i === target ? p * (1 - k) + 1 * k : p * (1 - k)));
      return { probs: fp, collapsed: k > 0.7 ? target : null };
    }
  };

  const exportGif = async () => {
    if (exporting) return;
    const preset = GIF_PRESETS[gifPreset];
    const W = Math.max(160, Math.round(preset.w * resScale));
    const H = Math.max(90, Math.round(preset.h * resScale));
    const fps = preset.fps;
    const dur = preset.dur;
    // Frame range — clamp to [0,1], ensure end > start
    const rs = Math.min(0.99, Math.max(0, gifStart));
    const re = Math.min(1, Math.max(rs + 0.05, gifEnd));
    const FRAMES = Math.max(6, Math.round(fps * dur * (re - rs)));
    const DELAY = Math.round(1000 / fps);
    cancelRef.current = false;
    setExporting("gif");
    setExportLabel(`GIF · ${preset.label}${resScale !== 1 ? ` @${resScale.toFixed(2)}x` : ""} · t[${rs.toFixed(2)}–${re.toFixed(2)}]${gifTransparent ? " · alpha" : ""}`);
    setExportProgress(0.02);
    await new Promise((r) => setTimeout(r, 30));
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    const gif = GIFEncoder();
    const r = Math.random();
    let acc = 0; let target = 0;
    for (let i = 0; i < probs.length; i++) {
      acc += probs[i]; if (r <= acc) { target = i; break; }
    }
    let cancelled = false;
    for (let f = 0; f < FRAMES; f++) {
      if (cancelRef.current) { cancelled = true; break; }
      const t = rs + (re - rs) * (f / Math.max(1, FRAMES - 1));
      const { probs: frameProbs, collapsed: frameCollapsed } = computeFrameAt(t, target);
      drawFrameInto(ctx, W, H, frameProbs, frameCollapsed, `[${fps}fps · t=${t.toFixed(2)}]`, gifTransparent);
      const data = ctx.getImageData(0, 0, W, H).data;
      const palette = quantize(data, gifTransparent ? 255 : 256, {
        format: "rgb444",
        oneBitAlpha: gifTransparent,
        clearAlpha: gifTransparent,
        clearAlphaThreshold: 32,
      });
      const index = applyPalette(data, palette, "rgb444");
      gif.writeFrame(index, W, H, { palette, delay: DELAY, transparent: gifTransparent });
      setExportProgress(0.05 + 0.9 * ((f + 1) / FRAMES));
      if (f % 4 === 3) await new Promise((r2) => setTimeout(r2, 0));
    }
    if (cancelled) {
      setExportLabel("GIF · cancelled");
      setExportProgress(0);
      setTimeout(() => { setExporting(null); }, 300);
      cancelRef.current = false;
      return;
    }
    gif.finish();
    const bytes = gif.bytesView();
    const buf = new Uint8Array(bytes.byteLength);
    buf.set(bytes);
    const blob = new Blob([buf], { type: "image/gif" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `quantara-collapse-${gifPreset}${gifTransparent ? "-alpha" : ""}-${Date.now()}.gif`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setExportProgress(1);
    setTimeout(() => { setExporting(null); setExportProgress(0); }, 400);
    logLedger("kernel", `Q-Circuit · render gif ${gifPreset} n=${n}`);
    creditDat(gifPreset === "lg" ? 24 : gifPreset === "md" ? 14 : 8);
  };

  // Live preview thumbnails of GIF frame range (start / mid / end)
  const previewRefs = [useRef<HTMLCanvasElement | null>(null), useRef<HTMLCanvasElement | null>(null), useRef<HTMLCanvasElement | null>(null)];
  useEffect(() => {
    const rs = Math.min(0.99, Math.max(0, gifStart));
    const re = Math.min(1, Math.max(rs + 0.05, gifEnd));
    const ts = [rs, (rs + re) / 2, re];
    const maxI = probs.indexOf(Math.max(...probs));
    ts.forEach((t, idx) => {
      const cv = previewRefs[idx].current;
      if (!cv) return;
      const W = cv.width, H = cv.height;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const { probs: fp, collapsed } = computeFrameAt(t, maxI);
      drawFrameInto(ctx, W, H, fp, collapsed, undefined, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gifStart, gifEnd, probs, collapsed, n, noise, watermarkOn, watermarkText, watermarkPos, watermarkColor, watermarkSize, watermarkOpacity]);

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
                onClick={parseAndInitialize}
                disabled={cascading}
                className="group relative w-full overflow-hidden rounded-sm border border-emerald-300/60 bg-gradient-to-b from-emerald-400/30 to-emerald-600/20 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] transition-all hover:from-emerald-400/45 hover:to-emerald-600/30 disabled:opacity-80"
              >
                <span className="relative z-10">{cascading ? "Cascading…" : "Parse & Initialize"}</span>
                {cascading && (
                  <span aria-hidden className="absolute inset-0 overflow-hidden">
                    <span className="absolute inset-y-0 left-0 w-full origin-left animate-[cascadeSweep_1.1s_ease-out_forwards] bg-gradient-to-r from-emerald-300/60 via-cyan-200/40 to-fuchsia-300/60" />
                  </span>
                )}
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent opacity-70" />
              </button>

              {/* PNG export preset */}
              <div className="space-y-1 rounded-sm border border-cyan-300/25 bg-black/50 p-2">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-cyan-200/80">
                  <span>PNG Frame · Preset</span>
                  <label className="flex cursor-pointer items-center gap-1 text-white/55 normal-case tracking-normal">
                    <input
                      type="checkbox"
                      checked={pngTransparent}
                      onChange={(e) => setPngTransparent(e.target.checked)}
                      className="h-3 w-3 accent-cyan-400"
                    />
                    <span className="text-[9px] uppercase tracking-widest">α bg</span>
                  </label>
                </div>
                <div className="flex gap-1">
                  <select
                    value={pngPreset}
                    onChange={(e) => setPngPreset(e.target.value as PngPreset)}
                    className="flex-1 rounded-sm border border-cyan-400/20 bg-black/70 px-2 py-1.5 font-mono text-[10px] text-cyan-100 outline-none focus:border-cyan-300"
                  >
                    {(Object.keys(PNG_PRESETS) as PngPreset[]).map((k) => (
                      <option key={k} value={k} className="bg-black">{PNG_PRESETS[k].label}</option>
                    ))}
                  </select>
                  <button
                    onClick={exportFrame}
                    disabled={!!exporting}
                    className="rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
                  >
                    ⤓ PNG
                  </button>
                </div>
              </div>

              {/* GIF export preset */}
              <div className="space-y-1 rounded-sm border border-amber-300/25 bg-black/50 p-2">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-amber-200/80">
                  <span>GIF Animation · Preset</span>
                  <label className="flex cursor-pointer items-center gap-1 text-white/55 normal-case tracking-normal">
                    <input
                      type="checkbox"
                      checked={gifTransparent}
                      onChange={(e) => setGifTransparent(e.target.checked)}
                      className="h-3 w-3 accent-amber-400"
                    />
                    <span className="text-[9px] uppercase tracking-widest">α bg</span>
                  </label>
                </div>
                <div className="flex gap-1">
                  <select
                    value={gifPreset}
                    onChange={(e) => setGifPreset(e.target.value as GifPreset)}
                    className="flex-1 rounded-sm border border-amber-400/20 bg-black/70 px-2 py-1.5 font-mono text-[10px] text-amber-100 outline-none focus:border-amber-300"
                  >
                    {(Object.keys(GIF_PRESETS) as GifPreset[]).map((k) => (
                      <option key={k} value={k} className="bg-black">{GIF_PRESETS[k].label}</option>
                    ))}
                  </select>
                  <button
                    onClick={exportGif}
                    disabled={!!exporting}
                    className="rounded-sm border border-amber-300/50 bg-amber-400/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-100 hover:bg-amber-400/25 disabled:opacity-50"
                  >
                    {exporting === "gif" ? "ENC…" : "⤓ GIF"}
                  </button>
                </div>
              </div>

              {/* Resolution scale */}
              <div className="space-y-1 rounded-sm border border-fuchsia-300/25 bg-black/50 p-2">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-fuchsia-200/80">
                  <span>Resolution Scale</span>
                  <span className="text-fuchsia-100">{resScale.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={resScale}
                  onChange={(e) => setResScale(parseFloat(e.target.value))}
                  className="w-full accent-fuchsia-400"
                />
                <div className="flex justify-between font-mono text-[8px] uppercase tracking-widest text-white/35">
                  <span>0.5×</span><span>1×</span><span>2×</span>
                </div>
              </div>

              {/* GIF frame range */}
              <div className="space-y-1 rounded-sm border border-amber-300/25 bg-black/50 p-2">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-amber-200/80">
                  <span>GIF Frame Range</span>
                  <span className="text-amber-100">t [{gifStart.toFixed(2)} → {gifEnd.toFixed(2)}]</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">start</span>
                    <input type="range" min={0} max={0.95} step={0.01} value={gifStart}
                      onChange={(e) => { const v = parseFloat(e.target.value); setGifStart(v); if (gifEnd <= v + 0.05) setGifEnd(Math.min(1, v + 0.05)); }}
                      className="w-full accent-amber-400" />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-white/45">end</span>
                    <input type="range" min={0.05} max={1} step={0.01} value={gifEnd}
                      onChange={(e) => { const v = parseFloat(e.target.value); setGifEnd(v); if (gifStart >= v - 0.05) setGifStart(Math.max(0, v - 0.05)); }}
                      className="w-full accent-amber-400" />
                  </label>
                </div>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  {["start", "mid", "end"].map((lbl, i) => (
                    <div key={lbl} className="overflow-hidden rounded-sm border border-amber-300/15 bg-black/70">
                      <canvas
                        ref={previewRefs[i]}
                        width={160}
                        height={90}
                        className="block w-full"
                      />
                      <div className="px-1 py-0.5 font-mono text-[8px] uppercase tracking-widest text-amber-200/60">{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Watermark */}
              <div className="space-y-2 rounded-sm border border-violet-300/25 bg-black/50 p-2">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-violet-200/80">
                  <span>Watermark</span>
                  <label className="flex cursor-pointer items-center gap-1 text-white/55 normal-case tracking-normal">
                    <input
                      type="checkbox"
                      checked={watermarkOn}
                      onChange={(e) => setWatermarkOn(e.target.checked)}
                      className="h-3 w-3 accent-violet-400"
                    />
                    <span className="text-[9px] uppercase tracking-widest">on</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  disabled={!watermarkOn}
                  placeholder="QUANTARA · your-name"
                  className="w-full rounded-sm border border-violet-400/20 bg-black/70 px-2 py-1.5 font-mono text-[10px] text-violet-100 outline-none focus:border-violet-300 disabled:opacity-40"
                />
                <div className="grid grid-cols-4 gap-1">
                  {(["tl","tr","bl","br"] as WmPos[]).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      disabled={!watermarkOn}
                      onClick={() => setWatermarkPos(pos)}
                      className={`rounded-sm border px-1 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors disabled:opacity-40 ${
                        watermarkPos === pos
                          ? "border-violet-300 bg-violet-400/20 text-violet-100"
                          : "border-white/10 bg-black/40 text-white/55 hover:border-violet-300/40"
                      }`}
                      title={`Anchor ${pos.toUpperCase()}`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={watermarkColor}
                    onChange={(e) => setWatermarkColor(e.target.value)}
                    disabled={!watermarkOn}
                    className="h-7 w-9 cursor-pointer rounded-sm border border-violet-400/20 bg-black/40 disabled:opacity-40"
                    aria-label="Watermark color"
                  />
                  <label className="flex-1">
                    <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-widest text-violet-200/70">
                      <span>size</span><span>{watermarkSize}px</span>
                    </div>
                    <input
                      type="range" min={6} max={42} step={1}
                      value={watermarkSize}
                      onChange={(e) => setWatermarkSize(parseInt(e.target.value, 10))}
                      disabled={!watermarkOn}
                      className="w-full accent-violet-400 disabled:opacity-40"
                    />
                  </label>
                  <label className="flex-1">
                    <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-widest text-violet-200/70">
                      <span>α</span><span>{watermarkOpacity.toFixed(2)}</span>
                    </div>
                    <input
                      type="range" min={0.1} max={1} step={0.05}
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      disabled={!watermarkOn}
                      className="w-full accent-violet-400 disabled:opacity-40"
                    />
                  </label>
                </div>
              </div>



              {/* Saved export profiles */}
              <div className="space-y-2 rounded-sm border border-emerald-300/25 bg-black/50 p-2">
                <div className="font-mono text-[9px] uppercase tracking-widest text-emerald-200/80">
                  Export Profiles
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="profile name"
                    className="flex-1 rounded-sm border border-emerald-400/20 bg-black/70 px-2 py-1.5 font-mono text-[10px] text-emerald-100 outline-none focus:border-emerald-300"
                  />
                  <button
                    onClick={saveProfile}
                    className="rounded-sm border border-emerald-300/50 bg-emerald-400/15 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100 hover:bg-emerald-400/25"
                  >
                    save
                  </button>
                </div>
                {profiles.length > 0 ? (
                  <ul className="space-y-1">
                    {profiles.map((p) => (
                      <li key={p.name} className="flex items-center justify-between gap-1 rounded-sm border border-white/10 bg-black/40 px-2 py-1 font-mono text-[10px]">
                        <span className="truncate text-emerald-100/90">{p.name}</span>
                        <span className="flex gap-1">
                          <button
                            onClick={() => loadProfile(p.name)}
                            className="rounded-sm border border-emerald-300/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-emerald-100 hover:bg-emerald-400/20"
                          >
                            load
                          </button>
                          <button
                            onClick={() => deleteProfile(p.name)}
                            className="rounded-sm border border-rose-300/30 px-2 py-0.5 text-[9px] uppercase tracking-widest text-rose-200/80 hover:bg-rose-400/15"
                            aria-label={`Delete ${p.name}`}
                          >
                            ×
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="font-mono text-[9px] uppercase tracking-widest text-white/35">
                    no saved profiles · adjust + save
                  </div>
                )}
              </div>



              {/* Export progress */}
              {exporting && (
                <div className="space-y-1 rounded-sm border border-emerald-300/30 bg-black/60 p-2">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-emerald-200/90">
                    <span>{exportLabel}</span>
                    <span className="text-emerald-100">{Math.round(exportProgress * 100)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-emerald-400/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-200 to-fuchsia-300 transition-[width] duration-150 ease-out shadow-[0_0_10px_rgba(110,231,183,0.6)]"
                      style={{ width: `${Math.min(100, Math.max(2, exportProgress * 100))}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-sm border border-white/10 bg-black/40 p-2 font-mono text-[9px] uppercase tracking-widest text-white/50">
                Status: <span className={exporting ? "text-amber-300" : cascading ? "text-amber-300" : "text-emerald-300"}>{exporting ? "EXPORTING" : cascading ? "CASCADING" : "READY"}</span> · noise <span className="text-fuchsia-300">{(noise * 100).toFixed(0)}%</span>
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

              {/* Decoherence speckle — TV-static artifacts that intensify with noise */}
              {noise > 0 && shaderIntensity > 0.05 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 mix-blend-screen"
                  style={{
                    opacity: Math.min(0.85, noise * 1.4) * shaderIntensity,
                    backgroundImage:
                      "radial-gradient(circle at 17% 22%, rgba(232,121,249,0.7) 0 1px, transparent 1.5px), radial-gradient(circle at 73% 41%, rgba(125,211,252,0.6) 0 1px, transparent 1.5px), radial-gradient(circle at 38% 78%, rgba(252,211,77,0.55) 0 1px, transparent 1.5px), radial-gradient(circle at 88% 86%, rgba(167,139,250,0.6) 0 1px, transparent 1.5px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 3px)",
                    backgroundSize: "7px 7px, 11px 11px, 13px 13px, 9px 9px, auto",
                    animation: shaderIntensity > 0.5 ? "qstatic 0.18s steps(4) infinite" : undefined,
                    filter: `blur(${noise * 0.6 * shaderIntensity}px)`,
                  }}
                />
              )}


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
                        {/* pulse traveling along the wire (skipped in perf mode) */}
                        {shaderIntensity > 0.1 && (
                          <span
                            aria-hidden
                            className="pointer-events-none absolute left-3 right-3 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full"
                          >
                            <span
                              className="block h-full w-1/4 rounded-full"
                              style={{
                                background:
                                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
                                animation: `qpulse ${4.4 - shaderIntensity * 1.6}s linear infinite`,
                                animationDelay: `${q * 0.6}s`,
                                opacity: 0.4 + shaderIntensity * 0.6,
                              }}
                            />
                          </span>
                        )}

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

              {/* Shader intensity — performance vs. visual fidelity */}
              <div className="mt-2 rounded-sm border border-white/10 bg-black/60 p-3">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest">
                  <span className="text-white/55">Shader Intensity · GPU Load</span>
                  <span className={shaderIntensity < 0.2 ? "text-emerald-300" : shaderIntensity > 0.8 ? "text-fuchsia-300" : "text-cyan-300"}>
                    {shaderIntensity < 0.05 ? "PERF" : `${Math.round(shaderIntensity*100)}%`}
                  </span>
                </div>
                <input
                  type="range" min={0} max={1} step={0.01} value={shaderIntensity}
                  onChange={(e) => setShaderIntensity(parseFloat(e.target.value))}
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
              collapseTick={collapseTick}
              shaderIntensity={shaderIntensity}
            />
          </GlassPane>
        </div>
      </div>

      {/* SVG refraction filter shared by all GlassPane wrappers */}
      <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id="qc-glass-refraction" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.022" numOctaves={2} seed={7} result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale={8} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="qc-glass-edge" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>
      </svg>

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
        @keyframes cascadeSweep {
          0%   { transform: scaleX(0); opacity: 0.9; }
          100% { transform: scaleX(1); opacity: 0.1; }
        }
        @keyframes qstatic {
          0%   { background-position: 0 0, 0 0, 0 0, 0 0, 0 0; }
          100% { background-position: 3px -2px, -4px 3px, 2px 4px, -3px -3px, 0 0; }
        }
        @keyframes spikeCollapse {
          0%   { transform: scaleY(0.2); filter: brightness(2.4); }
          40%  { transform: scaleY(1.25); filter: brightness(1.4); }
          70%  { transform: scaleY(0.92); }
          100% { transform: scaleY(1); filter: brightness(1); }
        }
        @keyframes shockRing {
          0%   { transform: scale(0.2); opacity: 0.9; }
          100% { transform: scale(2.6); opacity: 0; }
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
      {/* Refracted glass corner caustics — SVG turbulence displacement */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-px overflow-hidden rounded-md"
        style={{
          filter: "url(#qc-glass-refraction)",
          background: `radial-gradient(120px 80px at 10% 0%, ${edge}, transparent 70%), radial-gradient(140px 90px at 100% 100%, ${edge}, transparent 70%)`,
          opacity: 0.55,
          mixBlendMode: "screen",
        }}
      />
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
  collapseTick,
  shaderIntensity,
}: {
  probs: number[];
  n: number;
  collapsed: number | null;
  maxIdx: number;
  peakStability: number;
  lambdaMantissa: string;
  lambdaExp: number;
  collapseTick: number;
  shaderIntensity: number;
}) {
  // Particle density on the dominant bin (the magenta spike).
  const peakHeight = Math.max(8, Math.min(100, peakStability * 100));
  // Particle count scales with shader intensity; perf mode → 0 particles.
  const peakParticles = shaderIntensity < 0.05 ? 0 : Math.round((6 + peakStability * 30) * shaderIntensity);

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
                  key={`bar-${i}-${collapseTick}`}
                  className="w-full origin-bottom rounded-t-sm"
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
                    animation: isCollapsed ? "spikeCollapse 900ms cubic-bezier(.2,.9,.25,1)" : undefined,
                  }}
                />
                {/* shock ring when this bin collapses */}
                {isCollapsed && (
                  <span
                    key={`ring-${collapseTick}`}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      border: "1.5px solid rgba(253,224,71,0.85)",
                      boxShadow: "0 0 18px rgba(253,224,71,0.7)",
                      animation: "shockRing 700ms ease-out forwards",
                    }}
                  />
                )}
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
