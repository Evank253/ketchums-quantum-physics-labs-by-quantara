import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// LIVING PLANET — Google-Earth style rotating sphere of Reality_B
// Shows the civilization growing in real time. City lights expand with epoch.
// ---------------------------------------------------------------------------
export function LivingPlanet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [epoch, setEpoch] = useState(1);
  const [population, setPopulation] = useState(2_140_000);
  const [cities, setCities] = useState(7);

  useEffect(() => {
    const tick = setInterval(() => {
      setEpoch((e) => e + 1);
      setPopulation((p) => p + Math.floor(p * 0.012 + Math.random() * 5000));
      setCities((c) => c + (Math.random() < 0.35 ? 1 : 0));
    }, 2400);
    return () => clearInterval(tick);
  }, []);

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
              lights ignite each epoch as the species multiplies, terraforms,
              and constructs. Rotation is real — the planet does not sleep.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px border border-white/5 bg-card/40 font-mono text-[10px]">
            <div className="px-4 py-3"><div className="text-chrome">EPOCH</div><div className="text-lg font-black text-accent">{epoch}</div></div>
            <div className="px-4 py-3 border-l border-white/5"><div className="text-chrome">CITIES</div><div className="text-lg font-black text-white">{cities}</div></div>
            <div className="px-4 py-3 border-l border-white/5"><div className="text-chrome">POP</div><div className="text-lg font-black text-emerald-400">{(population / 1_000_000).toFixed(2)}M</div></div>
          </div>
        </div>

        <div className="glass-panel relative overflow-hidden rounded-sm">
          <canvas ref={canvasRef} className="block w-full" style={{ height: 480 }} />
          <div className="scan-effect pointer-events-none absolute inset-0" />
          <div className="absolute top-3 left-3 font-mono text-[10px] text-chrome">
            ORBITAL_FEED · 24.0 fps · DRIFT_LOCK
          </div>
          <div className="absolute bottom-3 right-3 font-mono text-[10px] text-emerald-400">
            ● LIVE · ECOSYSTEM_GROWTH +{(0.012 * 100).toFixed(1)}% / epoch
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
    <section className="border-t border-white/5 bg-[oklch(0.08_0.01_280)] px-6 py-32">
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
