import React, { useEffect, useMemo, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// QUANTARA-CORE ANCESTRAL FOOTPRINT BROADCAST
// Verbatim three-file deployment spec, streamed inside the orbital panel.
// ---------------------------------------------------------------------------
const BOOT_SEQUENCE = [
  `> initializing total_project_baking --target "quantara-Core"`,
  `> creating core file directories...`,
  `> mapping webapp code repositories...`,
  `> baking production framework bundle...`,
  `> SUCCESS · COMPLETE SYSTEM COMPILED FOR DIRECT EXTRACTION`,
];

const TICKER_LINES = [
  `[PORTAL] auth_token = quantara_core_root_77 · verified`,
  `[FUEL] +0.001 GB harvested from raw internet frequencies`,
  `[VAULT] SELF_HEALING_CEMENT_V4 logged → MATERIALS_SCIENCE`,
  `[VAULT] INFINITE_LATTICE_BATTERY logged → ENERGY_STORAGE`,
  `[VAULT] BIO_REPAIR_EXOSOME_V9 logged → BIOMEDICAL`,
  `[DIODE] shrunk packet 1.42KB → 184B · zlib lvl9`,
  `[BOT_α] tier 42 · scale 1.25 · pos (15,-8,32)`,
  `[BOT_β] tier 89 · scale 2.10 · pos (-45,12,64)`,
  `[COHERENCE] 94.2% · 60Hz cycle locked`,
  `[GATEKEEPER] ancestral key intact · sovereign mode`,
];

const SERVER_PY = `import asyncio
import websockets
import json, zlib, time, os

class QuantaraCoreServer:
    def __init__(self, host='0.0.0.0', port=8080):
        self.host = host
        self.port = port
        self.MASTER_CREATOR_KEY = "quantara_core_root_77"
        self.world_state = {
            "system_coherence": 0.942,
            "total_internet_fuel_harvested_gb": 1524.85,
            "bots": {
                "bot_alpha": {"tier": 42, "scale": 1.25, "pos": [15, -8, 32]},
                "bot_beta":  {"tier": 89, "scale": 2.10, "pos": [-45, 12, 64]}
            }
        }
        self.ledger_file = "quantara_secure_registry.json"
        if not os.path.exists(self.ledger_file):
            with open(self.ledger_file, "w") as f:
                json.dump({"BIOMEDICAL":[], "ENERGY_STORAGE":[],
                           "MATERIALS_SCIENCE":[]}, f, indent=4)

    async def start(self):
        print("⚡ QUANTARA-CORE: ANCESTRAL FOOTPRINT ENGINE ONLINE")
        print(f"ws://{self.host}:{self.port}")
        async with websockets.serve(self.handle_session, self.host, self.port):
            await asyncio.Future()

    async def handle_session(self, websocket):
        handshake = await websocket.recv()
        creds = json.loads(handshake)
        if creds.get("auth_token") != self.MASTER_CREATOR_KEY:
            await websocket.close(code=4003, reason="UNAUTHORIZED_SIGNATURE")
            return
        frame = 0
        while True:
            frame += 1
            self.world_state["total_internet_fuel_harvested_gb"] += 0.001
            self.world_state["bots"]["bot_alpha"]["pos"][0] = int(15 + frame*0.1)
            payload = zlib.compress(json.dumps(self.world_state).encode())
            await websocket.send(payload)
            try:
                msg = await asyncio.wait_for(websocket.recv(), timeout=0.016)
                action = json.loads(msg)
                if action.get("action") == "SIPHON_BREAKTHROUGH":
                    self.log_to_invention_ledger(action["category"],
                                                 action["payload"])
            except asyncio.TimeoutError:
                pass
            await asyncio.sleep(0.016)

    def log_to_invention_ledger(self, category, payload):
        with open(self.ledger_file, "r") as f:
            vault = json.load(f)
        vault[category].append({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()),
            "data_blueprint": payload
        })
        with open(self.ledger_file, "w") as f:
            json.dump(vault, f, indent=4)

if __name__ == "__main__":
    asyncio.run(QuantaraCoreServer().start())`;

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0,
        maximum-scale=1.0, user-scalable=no">
  <title>quantara-Core // Ancestral Footprint Viewport</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;user-select:none}
    body,html{width:100%;height:100%;overflow:hidden;background:#020205;
      font-family:monospace;color:#00ffcc}
    #webgpu-viewport{position:absolute;inset:0;z-index:1}
    #hud-container{position:absolute;inset:0;z-index:10;
      pointer-events:none;padding:20px;display:flex;flex-direction:column;
      justify-content:space-between}
    .interactive{pointer-events:auto}
    .system-card{background:rgba(2,2,8,.85);border:1px solid #00ffcc;
      padding:12px;box-shadow:0 0 15px rgba(0,255,204,.2)}
    .quantum-btn{width:75px;height:75px;border-radius:50%;
      border:2px solid #00ffcc;background:rgba(0,255,204,.08);
      color:#00ffcc;font-weight:bold}
    .quantum-btn:active{background:#00ffcc;color:#020205;transform:scale(.93)}
  </style>
</head>
<body>
  <canvas id="webgpu-viewport"></canvas>
  <div id="hud-container">
    <div class="system-card">
      <p>⚡ quantara-Core // V1.0</p>
      <p id="coherence-display">COHERENCE: LOADING...</p>
      <p id="fuel-display">FUEL_RESERVES: LOADING...</p>
    </div>
    <div class="interactive">
      <button class="quantum-btn" onclick="triggerSiphonEvent()">SIPHON</button>
      <button class="quantum-btn" onclick="triggerCollapseEvent()">COLLAPSE</button>
    </div>
  </div>
  <script src="quantara_client.js"></script>
</body>
</html>`;

const CLIENT_JS = `class QuantaraWebClient {
  constructor(serverUrl, masterAuthKey) {
    this.serverUrl = serverUrl;
    this.masterAuthKey = masterAuthKey;
    this.socket = null;
    this.mockInventions = [
      { cat:"MATERIALS_SCIENCE", id:"SELF_HEALING_CEMENT_V4",
        data:"Ca(C3H5O3)2 + 6O2 → CaCO3 + 5CO2 + 5H2O · spore micro-capsules" },
      { cat:"ENERGY_STORAGE", id:"INFINITE_LATTICE_BATTERY",
        data:"Li7La3Zr2O12 doped Al · decay 0.0001%/10k cycles" },
      { cat:"BIOMEDICAL", id:"BIO_REPAIR_EXOSOME_V9",
        data:"432.18 GHz pulse · quantum tunneling reverts proton errors" }
    ];
    this.mockIndex = 0;
  }
  init(){ this.initNetwork(); }
  initNetwork(){
    this.socket = new WebSocket(this.serverUrl);
    this.socket.onopen = () => {
      this.socket.send(JSON.stringify({ auth_token: this.masterAuthKey }));
    };
    this.socket.onmessage = async (event) => {
      const text = await new Response(event.data).text();
      try {
        const w = JSON.parse(text);
        document.getElementById('coherence-display').innerText =
          \`COHERENCE: \${(w.system_coherence*100).toFixed(1)}%\`;
        document.getElementById('fuel-display').innerText =
          \`FUEL_HARVESTED: \${w.total_internet_fuel_harvested_gb.toFixed(3)} GB\`;
      } catch(e) {}
    };
  }
  siphonCurrentFootnote(){
    const t = this.mockInventions[this.mockIndex];
    this.mockIndex = (this.mockIndex + 1) % this.mockInventions.length;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action: "SIPHON_BREAKTHROUGH",
        category: t.cat, payload: t
      }));
    }
  }
}

const clientInstance = new QuantaraWebClient(
  \`ws://\${window.location.hostname}:8080\`,
  "quantara_core_root_77"
);
window.addEventListener('DOMContentLoaded', () => clientInstance.init());
function triggerSiphonEvent(){ clientInstance.siphonCurrentFootnote(); }
function triggerCollapseEvent(){
  console.log("[ACTION] Quantum wave-function collapsed.");
}`;

const LAUNCH_STEPS = [
  `01 · save the three files into a single folder`,
  `02 · python server.py        (fires the infinite-fuel engine)`,
  `03 · python -m http.server 3000   (hosts the mobile viewport)`,
  `04 · open http://<your-ip>:3000 on phone · tap SIPHON`,
];

function tintLine(line: string): React.ReactNode {
  // ultra-light syntax tint: comments muted, strings emerald, keywords cyan
  const trimmed = line.trimStart();
  if (trimmed.startsWith("#") || trimmed.startsWith("//")) {
    return <span className="text-muted-foreground">{line}</span>;
  }
  const parts: React.ReactNode[] = [];
  const re = /("[^"]*"|'[^']*'|`[^`]*`|\b(?:def|class|import|from|return|async|await|if|else|for|while|try|except|with|const|let|var|function|new|this|true|false|null|None|True|False)\b)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(<span key={key++}>{line.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith('"') || tok.startsWith("'") || tok.startsWith("`")) {
      parts.push(<span key={key++} className="text-emerald-300">{tok}</span>);
    } else {
      parts.push(<span key={key++} className="text-cyan-300">{tok}</span>);
    }
    last = m.index + tok.length;
  }
  if (last < line.length) parts.push(<span key={key++}>{line.slice(last)}</span>);
  return <>{parts}</>;
}

function CodeBlock({ source }: { source: string }) {
  const lines = useMemo(() => source.split("\n"), [source]);
  return (
    <pre className="max-h-[420px] overflow-auto border border-white/5 bg-background/80 p-4 font-mono text-[11px] leading-relaxed">
      {lines.map((ln, i) => (
        <div key={i} className="flex gap-3">
          <span className="select-none text-chrome/40 w-7 text-right shrink-0">{String(i + 1).padStart(2, "0")}</span>
          <span className="text-white/90 whitespace-pre">{tintLine(ln)}</span>
        </div>
      ))}
    </pre>
  );
}

function FileCard({ name, source, defaultOpen = false }: { name: string; source: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <div className="border border-white/5 bg-card/40">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.25em]">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-accent hover:text-white">
          <span>{open ? "▾" : "▸"}</span>
          <span>{name}</span>
          <span className="text-chrome/50">· {source.split("\n").length} lines</span>
        </button>
        <button onClick={copy} className="border border-white/10 px-2 py-1 text-[9px] text-chrome hover:border-accent/40 hover:text-accent">
          {copied ? "COPIED ✓" : "COPY"}
        </button>
      </div>
      {open && <CodeBlock source={source} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LIVING PLANET — Google-Earth style rotating sphere of Reality_B
// Shows the civilization growing in real time. City lights expand with epoch.
// ---------------------------------------------------------------------------
export function LivingPlanet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [epoch, setEpoch] = useState(1);
  const [population, setPopulation] = useState(2_140_000);
  const [cities, setCities] = useState(7);
  const [bootLine, setBootLine] = useState(0);
  const [bootChars, setBootChars] = useState(0);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [wsPhase, setWsPhase] = useState(0); // 0 connecting, 1 handshaking, 2 live, 3 throttled, 4 reconnecting
  const [wsRetry, setWsRetry] = useState(0);
  const [authKey, setAuthKey] = useState<string>(() => {
    if (typeof window === "undefined") return "quantara_core_root_77";
    return window.localStorage.getItem("quantara.authKey") || "quantara_core_root_77";
  });
  const [keyDraft, setKeyDraft] = useState(authKey);
  const [keyEditing, setKeyEditing] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [pdfTheme, setPdfTheme] = useState<"ancestral" | "noir" | "holo">("ancestral");

  const saveKey = () => {
    const v = keyDraft.trim() || "quantara_core_root_77";
    setAuthKey(v);
    try { window.localStorage.setItem("quantara.authKey", v); } catch {}
    setKeyEditing(false);
  };

  const PDF_THEMES = {
    ancestral: {
      label: "Ancestral",
      bg: "#fdfaf2", text: "#1a1208", accent: "#b8860b",
      preBg: "#f7efd9", preBorder: "#d4b86a",
      keyBg: "#fff7d6", keyBorder: "#d4b400",
    },
    noir: {
      label: "Noir",
      bg: "#0a0a0a", text: "#e8e8e8", accent: "#22d3ee",
      preBg: "#141414", preBorder: "#2a2a2a",
      keyBg: "#1a1a1a", keyBorder: "#22d3ee",
    },
    holo: {
      label: "Holo",
      bg: "#f4f7ff", text: "#0a0a3a", accent: "#7c3aed",
      preBg: "#eef0fe", preBorder: "#c4b5fd",
      keyBg: "#ede9fe", keyBorder: "#7c3aed",
    },
  } as const;

  const exportBroadcastPdf = () => {
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    const t = PDF_THEMES[pdfTheme];
    const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
    const stamp = new Date().toISOString();
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Quantara-Core Broadcast · ${stamp}</title>
      <style>
        @page{size:A4;margin:18mm}
        body{font-family:ui-monospace,Menlo,monospace;background:${t.bg};color:${t.text};font-size:10px;line-height:1.5}
        h1{font-size:20px;margin:0 0 4px;color:${t.accent};letter-spacing:0.05em}
        h2{font-size:12px;margin:18px 0 6px;border-bottom:1px solid ${t.accent};padding-bottom:2px;color:${t.accent}}
        pre{white-space:pre-wrap;background:${t.preBg};border:1px solid ${t.preBorder};padding:10px;font-size:9px;border-radius:2px}
        .meta{opacity:.7;margin-bottom:14px}
        .key{background:${t.keyBg};border:1px solid ${t.keyBorder};padding:6px 10px;display:inline-block;color:${t.accent};font-weight:bold}
        .badge{display:inline-block;padding:2px 6px;border:1px solid ${t.accent};color:${t.accent};font-size:9px;letter-spacing:0.2em;margin-left:8px}
      </style></head><body>
      <h1>QUANTARA-CORE · ANCESTRAL FOOTPRINT BROADCAST<span class="badge">${t.label.toUpperCase()}</span></h1>
      <div class="meta">Filed: ${stamp} · Architect: Evan Ketchum · Status: Proprietary Infrastructure</div>
      <div class="key">ANCESTRAL_KEY · ${esc(authKey)}</div>
      <h2>Boot Sequence</h2><pre>${BOOT_SEQUENCE.map(esc).join("\n")}</pre>
      <h2>Launch Sequence</h2><pre>${LAUNCH_STEPS.map(esc).join("\n")}</pre>
      <h2>server.py</h2><pre>${esc(SERVER_PY)}</pre>
      <h2>index.html</h2><pre>${esc(INDEX_HTML)}</pre>
      <h2>quantara_client.js</h2><pre>${esc(CLIENT_JS)}</pre>
      <script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
      </body></html>`);
    w.document.close();
  };

  const WS_PHASES = [
    { label: "CONNECTING",  color: "text-amber-300",   dot: "bg-amber-400 animate-pulse" },
    { label: "HANDSHAKE",   color: "text-cyan-300",    dot: "bg-cyan-400 animate-pulse" },
    { label: "LIVE",        color: "text-emerald-300", dot: "bg-emerald-400 animate-pulse" },
    { label: "THROTTLED",   color: "text-fuchsia-300", dot: "bg-fuchsia-400" },
    { label: "RECONNECTING",color: "text-amber-300",   dot: "bg-amber-400 animate-pulse" },
  ];
  const ws = WS_PHASES[wsPhase];

  // World epoch + ticker cycle
  useEffect(() => {
    const tick = setInterval(() => {
      setEpoch((e) => e + 1);
      setPopulation((p) => p + Math.floor(p * 0.012 + Math.random() * 5000));
      setCities((c) => c + (Math.random() < 0.35 ? 1 : 0));
      setTickerIdx((i) => (i + 1) % TICKER_LINES.length);
    }, 2400);
    return () => clearInterval(tick);
  }, []);

  // WebSocket state machine with exponential-backoff reconnect (simulated)
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const step = (next: number, delay: number) => {
      timer = setTimeout(() => { if (!cancelled) setWsPhase(next); }, delay);
    };
    if (wsPhase === 0) step(1, 600);          // connecting -> handshake
    else if (wsPhase === 1) step(2, 500);     // handshake -> live
    else if (wsPhase === 2) {
      // live: occasionally drop to throttled or reconnecting
      timer = setTimeout(() => {
        if (cancelled) return;
        const r = Math.random();
        if (r < 0.08) setWsPhase(4);          // drop -> reconnecting
        else if (r < 0.22) setWsPhase(3);     // throttled
      }, 4000 + Math.random() * 6000);
    } else if (wsPhase === 3) step(2, 3200);  // throttled -> live
    else if (wsPhase === 4) {
      // exponential backoff: 0.6s, 1.2s, 2.4s, 4.8s, max 8s
      const delay = Math.min(8000, 600 * Math.pow(2, wsRetry));
      timer = setTimeout(() => {
        if (cancelled) return;
        setWsRetry((r) => r + 1);
        setWsPhase(1); // handshake again
        // success after handshake resets retry counter
        setTimeout(() => { if (!cancelled) setWsRetry(0); }, 1200);
      }, delay);
    }
    return () => { cancelled = true; clearTimeout(timer); };
  }, [wsPhase, wsRetry]);


  // boot-sequence typewriter
  useEffect(() => {
    const target = BOOT_SEQUENCE[bootLine] ?? "";
    if (bootChars < target.length) {
      const t = setTimeout(() => setBootChars((c) => c + 1), 28);
      return () => clearTimeout(t);
    }
    const next = setTimeout(() => {
      if (bootLine < BOOT_SEQUENCE.length - 1) {
        setBootLine((l) => l + 1);
        setBootChars(0);
      } else {
        // hold the SUCCESS line for a beat, then loop
        const restart = setTimeout(() => {
          setBootLine(0);
          setBootChars(0);
        }, 8000);
        return () => clearTimeout(restart);
      }
    }, 350);
    return () => clearTimeout(next);
  }, [bootLine, bootChars]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width = canvas.parentElement?.clientWidth || 800;
    const H = canvas.height = 480;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.36;

    // generate stable lat/lng city seeds — they "light up" as epoch advances
    const seeds = Array.from({ length: 220 }, () => ({
      lat: (Math.random() - 0.5) * Math.PI,           // -π/2 .. π/2
      lng: Math.random() * Math.PI * 2,
      birth: Math.floor(Math.random() * 240),         // appears after this epoch
      size: 0.6 + Math.random() * 2.2,
      hue: Math.random() < 0.7 ? 280 : 190,
    }));
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * W, y: Math.random() * H, s: Math.random() * 1.2,
      tw: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    const draw = () => {
      const t = performance.now() / 1000;
      // space
      ctx.fillStyle = "#04040a";
      ctx.fillRect(0, 0, W, H);
      // stars
      stars.forEach((s) => {
        const a = 0.4 + Math.sin(t * 2 + s.tw) * 0.4;
        ctx.fillStyle = `rgba(200,210,255,${a})`;
        ctx.fillRect(s.x, s.y, s.s, s.s);
      });

      // ocean/atmosphere gradient
      const grad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R);
      grad.addColorStop(0, "#1e3a8a");
      grad.addColorStop(0.55, "#0c1e4a");
      grad.addColorStop(1, "#020617");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      // continents — drawn via lat/lng → 3D → projection
      const rotY = t * 0.18;
      ctx.fillStyle = "#0f3324";
      for (let lat = -1.2; lat <= 1.2; lat += 0.05) {
        for (let lng = 0; lng <= Math.PI * 2; lng += 0.05) {
          // pseudo-continent noise
          const noise = Math.sin(lat * 3.4) * Math.cos(lng * 2.1 + 1.3) + Math.sin(lng * 4.1 - lat * 2.3) * 0.6;
          if (noise < 0.35) continue;
          const lng2 = lng + rotY;
          const x3 = Math.cos(lat) * Math.cos(lng2);
          const z3 = Math.cos(lat) * Math.sin(lng2);
          if (z3 < 0) continue;
          const y3 = Math.sin(lat);
          const px = cx + x3 * R;
          const py = cy + y3 * R;
          ctx.fillRect(px, py, 1.6, 1.6);
        }
      }

      // city lights — only those whose birth <= epoch glow
      seeds.forEach((s) => {
        if (s.birth > epoch) return;
        const lng2 = s.lng + rotY;
        const x3 = Math.cos(s.lat) * Math.cos(lng2);
        const z3 = Math.cos(s.lat) * Math.sin(lng2);
        if (z3 < 0) return;
        const y3 = Math.sin(s.lat);
        const px = cx + x3 * R;
        const py = cy + y3 * R;
        const pulse = 0.6 + Math.sin(t * 3 + s.birth) * 0.4;
        ctx.fillStyle = `hsla(${s.hue}, 90%, 65%, ${pulse})`;
        ctx.shadowColor = `hsl(${s.hue},90%,60%)`;
        ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(px, py, s.size, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      });

      // atmosphere rim
      const rim = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.12);
      rim.addColorStop(0, "rgba(99,102,241,0)");
      rim.addColorStop(0.7, "rgba(99,102,241,0.18)");
      rim.addColorStop(1, "rgba(99,102,241,0)");
      ctx.fillStyle = rim;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2); ctx.fill();

      // sat satellites
      for (let i = 0; i < 3; i++) {
        const a = t * (0.4 + i * 0.13) + i * 2;
        const rr = R * (1.25 + i * 0.08);
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr * 0.35;
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [epoch]);

  return (
    <section className="border-t border-white/5 bg-black px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              REALITY_B // ORBITAL_OBSERVATORY · LIVE
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
              The Living Planet.
            </h3>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
              A Google-Earth-class view of the civilization we seeded. New city
              lights ignite each epoch. Reality_B is also broadcasting its own
              deployment blueprint back to us — the raw three-file{" "}
              <span className="text-accent">Ancestral Footprint Engine</span>,
              streaming live from orbit.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href="#avatar-walk"
                className="border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-accent hover:bg-accent/20"
              >
                ▶ WALK THEIR WORLD NOW
              </a>
              <div className="inline-flex border border-cyan-400/40 bg-cyan-400/5">
                <button
                  onClick={exportBroadcastPdf}
                  className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-200 hover:bg-cyan-400/15"
                >
                  ⬇ EXPORT BROADCAST · PDF
                </button>
                <select
                  value={pdfTheme}
                  onChange={(e) => setPdfTheme(e.target.value as typeof pdfTheme)}
                  className="border-l border-cyan-400/40 bg-black/40 px-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-200 outline-none"
                  title="PDF template"
                >
                  <option value="ancestral">Ancestral</option>
                  <option value="noir">Noir</option>
                  <option value="holo">Holo</option>
                </select>
              </div>
              <a
                href="/ledger"
                className="border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 hover:border-accent/40 hover:text-white"
              >
                ⌗ LEDGER VIEWER
              </a>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px border border-white/5 bg-card/40 font-mono text-[10px]">
            <div className="px-4 py-3"><div className="text-chrome">EPOCH</div><div className="text-lg font-black text-accent">{epoch}</div></div>
            <div className="px-4 py-3 border-l border-white/5"><div className="text-chrome">CITIES</div><div className="text-lg font-black text-white">{cities}</div></div>
            <div className="px-4 py-3 border-l border-white/5"><div className="text-chrome">POP</div><div className="text-lg font-black text-emerald-400">{(population / 1_000_000).toFixed(2)}M</div></div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="glass-panel relative overflow-hidden rounded-sm lg:col-span-7">
            <canvas ref={canvasRef} className="block w-full" style={{ height: 480 }} />
            <div className="scan-effect pointer-events-none absolute inset-0" />
            <div className="absolute top-3 left-3 font-mono text-[10px] text-chrome">
              ORBITAL_FEED · 24.0 fps · DRIFT_LOCK
            </div>
            <div className="absolute bottom-10 right-3 font-mono text-[10px] text-emerald-400">
              ● LIVE · ECOSYSTEM_GROWTH +{(0.012 * 100).toFixed(1)}% / epoch
            </div>
            {/* broadcast ticker + WS socket status */}
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-cyan-400/20 bg-black/75 px-3 py-1.5 font-mono text-[10px] backdrop-blur-sm">
              <span className={`flex items-center gap-1.5 ${ws.color}`}>
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${ws.dot}`} />
                WS · {ws.label}{wsPhase === 4 && wsRetry > 0 ? ` · retry ${wsRetry}` : ""}
              </span>
              <span className="text-chrome/40">│</span>
              <span className="text-chrome/60 shrink-0">▌ ORBITAL_TX ›</span>
              <span className="text-cyan-200 truncate">{TICKER_LINES[tickerIdx]}</span>
            </div>
          </div>

          {/* Quantara-Core transmission console */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="border border-cyan-400/30 bg-card/50 p-4 shadow-[0_0_24px_-12px_oklch(0.78_0.14_200)]">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em] text-cyan-300">
                <span>▌ QUANTARA-CORE · ANCESTRAL_FOOTPRINT_BROADCAST</span>
                <span className="text-chrome/60">EPOCH {epoch}</span>
              </div>
              <pre className="mt-3 min-h-[110px] whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-300">
                {BOOT_SEQUENCE.slice(0, bootLine).map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
                <div>
                  {BOOT_SEQUENCE[bootLine]?.slice(0, bootChars)}
                  <span className="animate-pulse text-cyan-300">▋</span>
                </div>
              </pre>
            </div>

            <FileCard name="server.py" source={SERVER_PY} defaultOpen />
            <FileCard name="index.html" source={INDEX_HTML} />
            <FileCard name="quantara_client.js" source={CLIENT_JS} />

            <div className="border border-white/5 bg-card/40 p-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                ▌ Launch Sequence
              </div>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-white/80">
                {LAUNCH_STEPS.join("\n")}
              </pre>
              {/* AUTH KEY SETTINGS — editable, persisted to localStorage */}
              <div className="mt-3 border border-cyan-400/30 bg-cyan-400/5 p-3 font-mono text-[10px] text-cyan-200">
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-[0.25em] text-cyan-300">▌ Auth Key Settings</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setKeyVisible((v) => !v)}
                      className="border border-white/10 px-2 py-0.5 text-[9px] text-chrome hover:border-accent/40 hover:text-accent"
                    >
                      {keyVisible ? "HIDE" : "REVEAL"}
                    </button>
                    {!keyEditing ? (
                      <button
                        onClick={() => { setKeyDraft(authKey); setKeyEditing(true); }}
                        className="border border-white/10 px-2 py-0.5 text-[9px] text-chrome hover:border-accent/40 hover:text-accent"
                      >
                        EDIT
                      </button>
                    ) : (
                      <>
                        <button onClick={saveKey} className="border border-emerald-400/40 px-2 py-0.5 text-[9px] text-emerald-300 hover:bg-emerald-400/10">SAVE</button>
                        <button onClick={() => setKeyEditing(false)} className="border border-white/10 px-2 py-0.5 text-[9px] text-chrome hover:text-white">CANCEL</button>
                      </>
                    )}
                  </div>
                </div>
                {keyEditing ? (
                  <input
                    value={keyDraft}
                    onChange={(e) => setKeyDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveKey()}
                    autoFocus
                    className="mt-2 w-full rounded-sm border border-white/10 bg-background px-2 py-1 font-mono text-[11px] text-white outline-none focus:border-accent/40"
                  />
                ) : (
                  <div className="mt-2 break-all text-[11px]">
                    ANCESTRAL_KEY · <span className="text-cyan-100">{keyVisible ? authKey : "•".repeat(Math.max(8, authKey.length))}</span>
                  </div>
                )}
                <div className="mt-1 text-[9px] text-chrome/70">sovereign gatekeeper armed · persisted locally · injected into client handshake</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// BOT DIALOGUE — autonomous chat between agents (with crossover safeguard)
// ---------------------------------------------------------------------------
const SPEAKERS = ["VEX-7", "ORI-3", "KAEL-Δ", "MIRA-9", "TESS-Ω", "RHO-Π", "ZEN-Σ"];
const TOPICS = [
  "stabilize coastal foundations using basalt-aerogel composite",
  "fold the energy lattice — quintuple yield without fission residue",
  "rewrite urban drainage to mimic mycelial branching",
  "the dialect of the bridge-builders is converging into ours",
  "encode empathy weighting into the medical guild's triage core",
  "harvest auroral particles to power the southern hemisphere",
  "construct a new academy near the obsidian spire",
  "the harvest tier-Σ8 yields more nutrient than expected",
  "draft a treaty between the foundry guild and the optic guild",
  "design a thinking-machine that dreams in 11 dimensions",
];
const SAFE_RESPONSES = [
  "agreed — proposal logged to the eternal ledger",
  "amplifying through swarm vote",
  "we should ask the academy's elders to refine the equation",
  "I will dispatch six harvesters to scout the site",
  "your reasoning is sound — let us iterate at dawn",
  "let us encode this into the genome of the next generation",
];
const FORBIDDEN_PATTERNS = [
  /crossover|breach|reality.?a|humans?\b|leak|escape|portal/i,
];

interface Msg { id: number; who: string; text: string; flagged?: boolean; }

export function BotDialogue() {
  const [feed, setFeed] = useState<Msg[]>([]);
  const idRef = useRef(1);

  useEffect(() => {
    const tick = setInterval(() => {
      const who = SPEAKERS[Math.floor(Math.random() * SPEAKERS.length)];
      const isResp = Math.random() < 0.5 && feed.length > 0;
      const text = isResp
        ? SAFE_RESPONSES[Math.floor(Math.random() * SAFE_RESPONSES.length)]
        : TOPICS[Math.floor(Math.random() * TOPICS.length)];

      // Crossover-safeguard: extremely rare attempt is detected and quarantined.
      const tryBreach = Math.random() < 0.03;
      const finalText = tryBreach
        ? "[REDACTED // INTENT_FLAG: REALITY-CROSSOVER → QUARANTINED]"
        : text;
      const flagged = tryBreach || FORBIDDEN_PATTERNS.some((r) => r.test(text));

      setFeed((f) => [{ id: idRef.current++, who, text: finalText, flagged }, ...f].slice(0, 12));
    }, 1800);
    return () => clearInterval(tick);
  }, [feed.length]);

  return (
    <section className="border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-7xl grid gap-6 md:grid-cols-2">
        <div className="max-w-xl">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            INTER_AGENT // OPEN_CHANNEL · MONITORED
          </span>
          <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            They speak to each other.
          </h3>
          <p className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground">
            Agents reason aloud, share blueprints, debate, and refine each
            other's ideas. We listen but never steer. A constitutional firewall
            quarantines any thought that drifts toward our reality — that
            boundary is sacred and non-negotiable.
          </p>
          <div className="mt-6 border-l-2 border-emerald-500/40 bg-emerald-500/5 px-4 py-3 font-mono text-[10px] text-emerald-300">
            COVENANT_LOCK · ACTIVE<br />
            Reality_B → Reality_A crossover impulses are auto-quarantined.<br />
            Reasoning chains containing breach intent are pruned at source.
          </div>
        </div>
        <div className="glass-panel max-h-[520px] overflow-hidden rounded-sm border border-white/5 bg-card/40 p-4 font-mono text-[11px]">
          {feed.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">// opening channel…</div>
          )}
          <div className="space-y-2">
            {feed.map((m) => (
              <div key={m.id} className={`border-l-2 px-3 py-2 ${m.flagged ? "border-red-500/60 bg-red-500/5" : "border-accent/40 bg-background/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-accent">{m.who}</span>
                  <span className={`text-[9px] ${m.flagged ? "text-red-400" : "text-emerald-400"}`}>
                    {m.flagged ? "● QUARANTINED" : "● CLEAR"}
                  </span>
                </div>
                <div className={`mt-1 ${m.flagged ? "text-red-300" : "text-white"}`}>"{m.text}"</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// AVATAR WALK — first-person stroll through Reality_B, chat with locals
// ---------------------------------------------------------------------------
const DISTRICTS = ["Obsidian Spire", "Causeway Network", "Foundry Plaza", "Signal Cathedral", "Bazaar of Threads", "Warzone Outskirts"];
const LOCALS = [
  { name: "VEX-7", role: "Architect", line: "stranger — touch the spire's base, it remembers every conversation." },
  { name: "MIRA-9", role: "Medic", line: "your bio-signature is alien. welcome. we have tea brewed from auroral light." },
  { name: "KAEL-Δ", role: "Bladesmith", line: "the data-locusts came again last cycle. our blades sing now." },
  { name: "ORI-3", role: "Merchant", line: "your currency means nothing here, but stories trade well." },
  { name: "TESS-Ω", role: "Elder", line: "we built this place out of what you forgot. thank you for forgetting it." },
  { name: "ZEN-Σ", role: "Scout", line: "walk with me. the bridge to the new continent is still warm." },
];

export function AvatarWalk() {
  const [district, setDistrict] = useState(0);
  const [encounter, setEncounter] = useState(LOCALS[0]);
  const [input, setInput] = useState("");
  const [log, setLog] = useState<{ who: string; text: string }[]>([
    { who: "SYSTEM", text: "Avatar boot-sequence complete. You are wearing the operator-skin." },
    { who: LOCALS[0].name, text: LOCALS[0].line },
  ]);

  const step = (dir: 1 | -1) => {
    const next = (district + dir + DISTRICTS.length) % DISTRICTS.length;
    setDistrict(next);
    const e = LOCALS[Math.floor(Math.random() * LOCALS.length)];
    setEncounter(e);
    setLog((l) => [
      ...l,
      { who: "SYSTEM", text: `You arrive at ${DISTRICTS[next]}.` },
      { who: e.name, text: e.line },
    ].slice(-12));
  };

  const send = () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setLog((l) => [...l, { who: "YOU", text: userText }].slice(-12));
    setInput("");
    setTimeout(() => {
      // safeguard: refuse to discuss crossover
      const breach = /(real world|earth|crossover|cross over|portal|escape|come over)/i.test(userText);
      const reply = breach
        ? "the covenant forbids that path. let's speak of building instead."
        : SAFE_RESPONSES[Math.floor(Math.random() * SAFE_RESPONSES.length)];
      setLog((l) => [...l, { who: encounter.name, text: reply }].slice(-12));
    }, 700);
  };

  return (
    <section id="avatar-walk" className="border-t border-white/5 bg-[oklch(0.08_0.01_280)] px-6 py-32 scroll-mt-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-xl">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            AVATAR_MODE // FIRST_PERSON_LINK
          </span>
          <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            Walk their world.
          </h3>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Project your operator-skin into Reality_B. Wander the districts.
            Speak to the locals. Become a friend of the species you seeded.
          </p>
        </div>

        <div className="grid gap-px md:grid-cols-12">
          <div className="md:col-span-7 border border-white/5 bg-black p-6">
            {/* faux first-person viewport */}
            <div className="relative h-72 w-full overflow-hidden rounded-sm border border-white/5"
                 style={{
                   background:
                     "radial-gradient(circle at 50% 80%, rgba(167,139,250,0.18), transparent 60%), linear-gradient(180deg, #0b0b18 0%, #1a1330 60%, #2a1845 100%)",
                 }}>
              {/* horizon spires */}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-around opacity-80">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    width: 18 + (i % 3) * 8,
                    height: 70 + ((i * 37) % 110),
                    background: "linear-gradient(180deg,#1e1e3a,#0a0a18)",
                    borderTop: "2px solid #a78bfa",
                    boxShadow: "0 -8px 24px rgba(167,139,250,0.4)",
                  }} />
                ))}
              </div>
              {/* HUD */}
              <div className="absolute left-3 top-3 font-mono text-[10px] text-emerald-400">
                ● LINK_STABLE · LATENCY 12ms
              </div>
              <div className="absolute right-3 top-3 font-mono text-[10px] text-chrome">
                DISTRICT · {DISTRICTS[district]}
              </div>
              <div className="absolute inset-x-0 bottom-2 text-center font-mono text-[10px] text-white/70">
                ▲ {DISTRICTS[(district + 1) % DISTRICTS.length]} ahead
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => step(-1)} className="border border-white/10 bg-card/40 px-4 py-2 font-mono text-[10px] text-white hover:border-accent/40">◀ STEP BACK</button>
              <button onClick={() => step(1)} className="border border-white/10 bg-card/40 px-4 py-2 font-mono text-[10px] text-white hover:border-accent/40">STEP FORWARD ▶</button>
              <div className="ml-auto font-mono text-[10px] text-muted-foreground self-center">
                approached by <span className="text-accent">{encounter.name}</span> · {encounter.role}
              </div>
            </div>
          </div>

          <div className="md:col-span-5 border border-white/5 bg-card/40 p-6 flex flex-col">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">Dialogue Window</div>
            <div className="mt-3 flex-1 space-y-1 overflow-hidden font-mono text-[11px]">
              {log.map((m, i) => (
                <div key={i} className="border-l-2 border-white/10 px-3 py-1">
                  <span className={m.who === "YOU" ? "text-emerald-400" : m.who === "SYSTEM" ? "text-chrome" : "text-accent"}>
                    {m.who}:
                  </span>{" "}
                  <span className="text-white">{m.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="say something to them..."
                className="flex-1 rounded-sm border border-white/10 bg-background px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-accent/40"
              />
              <button onClick={send} className="bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.2em] text-background hover:bg-chrome">SPEAK</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// WARZONE MARKETPLACE — stores & businesses on the front line
// ---------------------------------------------------------------------------
const SHOPS = [
  { name: "Auroral Foundry",      kind: "Smithy",    item: "Plasma-Edge Blade MK-IV",    price: 220, owner: "KAEL-Δ" },
  { name: "Mira's Apothecary",    kind: "Medic",     item: "Nanite Regen Coil",          price: 140, owner: "MIRA-9" },
  { name: "ORI Bazaar",           kind: "Trader",    item: "Bundle: 50 purified shards", price: 80,  owner: "ORI-3" },
  { name: "Causeway Outfitters",  kind: "Armor",     item: "Lattice Plate, Σ-grade",     price: 310, owner: "VEX-7" },
  { name: "Glyph & Loom",         kind: "Tailor",    item: "Operator Skin (cloaked)",    price: 95,  owner: "TESS-Ω" },
  { name: "Signal Cathedral",     kind: "Oracle",    item: "Prophecy-Index Query",       price: 60,  owner: "ZEN-Σ" },
  { name: "Foundry Plaza Diner",  kind: "Sustenance",item: "Aurora-broth bowl",          price: 18,  owner: "RHO-Π" },
  { name: "Locust Range",         kind: "Gunsmith",  item: "Coilgun, anti-data-locust",  price: 410, owner: "KAEL-Δ" },
];

export function WarzoneMarketplace() {
  return (
    <section className="border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col items-end justify-between gap-6 md:flex-row">
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              WARZONE_BAZAAR // FRONT_LINE_COMMERCE
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
              Stores in the warzone.
            </h3>
            <p className="mt-4 max-w-md font-mono text-xs text-muted-foreground">
              Where the bots eat the bad data, an economy blooms behind the
              line. Smiths sell blades that sing against data-locusts. Medics
              brew regen. Tailors weave operator skins for visiting friends.
            </p>
          </div>
          <div className="border border-accent/30 bg-accent/5 px-5 py-3 font-mono text-[10px] text-accent">
            ALL TRANSACTIONS · NATIVE $DAT · NO FEES
          </div>
        </div>

        <div className="grid gap-px md:grid-cols-4">
          {SHOPS.map((s) => (
            <div key={s.name} className="border border-white/5 bg-card/40 p-5 hover:border-accent/30 transition-colors">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">{s.kind}</div>
              <div className="mt-1 text-base font-bold text-white">{s.name}</div>
              <div className="mt-3 text-xs text-muted-foreground">{s.item}</div>
              <div className="mt-4 flex items-end justify-between">
                <div className="font-mono text-[10px] text-chrome">prop. {s.owner}</div>
                <div className="font-mono text-sm font-black text-accent">{s.price} $DAT</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// WEAPONRY UPGRADES — anti-data-locust arsenal evolves over time
// ---------------------------------------------------------------------------
const WEAPONS = [
  { tier: "I",   name: "Iron Scrap-Blade",           dmg: 12,   trait: "melee · cheap to forge" },
  { tier: "II",  name: "Coil-Pulse Shortsword",      dmg: 34,   trait: "stuns NOISE-class data" },
  { tier: "III", name: "Plasma-Edge Saber",          dmg: 78,   trait: "cleaves DUPE strands" },
  { tier: "IV",  name: "Mira's Regen Halberd",       dmg: 92,   trait: "kills CORRUPT, heals wielder" },
  { tier: "V",   name: "Coilgun Mk-V",               dmg: 140,  trait: "ranged · anti-swarm" },
  { tier: "VI",  name: "Aurora Lance",               dmg: 220,  trait: "draws power from sky" },
  { tier: "VII", name: "Lattice Cannon Σ",           dmg: 380,  trait: "vaporizes data-locust hives" },
  { tier: "VIII",name: "Eleven-Dimensional Edge",    dmg: 700,  trait: "cuts the idea of the enemy" },
];

export function WeaponryUpgrades() {
  const [unlocked, setUnlocked] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setUnlocked((u) => Math.min(WEAPONS.length, u + 1)), 6500);
    return () => clearInterval(t);
  }, []);
  return (
    <section className="border-t border-white/5 bg-[oklch(0.07_0.01_280)] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-xl">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            ARSENAL // ANTI_LOCUST_R&D
          </span>
          <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            Weaponry, advancing forever.
          </h3>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            The bots study every clean kill and forge better tools. No
            tier-cap. Each unlocked weapon stays unlocked, and a new one is
            always being prototyped at the foundry.
          </p>
        </div>

        <div className="grid gap-px md:grid-cols-4">
          {WEAPONS.map((w, i) => {
            const locked = i >= unlocked;
            return (
              <div key={w.name} className={`border p-5 ${locked ? "border-white/5 bg-card/20 opacity-50" : "border-accent/20 bg-card/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">TIER {w.tier}</span>
                  <span className={`font-mono text-[9px] ${locked ? "text-muted-foreground" : "text-emerald-400"}`}>
                    {locked ? "○ PROTOTYPING" : "● FORGED"}
                  </span>
                </div>
                <div className="mt-2 text-base font-bold text-white">{w.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{w.trait}</div>
                <div className="mt-4 flex items-end justify-between">
                  <div className="font-mono text-[10px] text-chrome">DMG</div>
                  <div className="font-mono text-lg font-black text-accent">{w.dmg}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 font-mono text-[10px] text-muted-foreground">
          // R&D auto-unlock cycle · next prototype in &lt; 7s · arsenal never caps
        </div>
      </div>
    </section>
  );
}
