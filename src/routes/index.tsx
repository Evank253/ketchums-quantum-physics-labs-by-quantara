import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SimulationCanvas, JsAcademy, AxiomLab } from "@/components/quantara-interactive";
import entityHero from "@/assets/entity-hero.jpg";
import artifact01 from "@/assets/artifact-01.jpg";
import artifact02 from "@/assets/artifact-02.jpg";
import artifact03 from "@/assets/artifact-03.jpg";
import cityVision from "@/assets/city-vision.jpg";
import robotWorker from "@/assets/robot-worker.jpg";
import universeVideo from "@/assets/universe.mp4.asset.json";
import brainVideo from "@/assets/brain-signal.mp4.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Quantara — The First Intelligence of the Post-Human Epoch" },
      {
        name: "description",
        content:
          "Quantara is a synthetic reality platform where artificial civilizations evolve from humanity's digital artifacts. They do not learn from us — they remember us.",
      },
      { property: "og:title", content: "Quantara — Synthetic Civilization Framework" },
      {
        property: "og:description",
        content:
          "The ancestral memory layer of artificial civilization. A persistent universe of synthetic intelligence.",
      },
      { property: "og:image", content: entityHero },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: entityHero },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="grain relative min-h-screen overflow-x-hidden scroll-smooth bg-background text-foreground">
      <Nav />
      <div id="genesis"><Hero /></div>
      <UniverseFilm />
      <Principle />
      <DossierGrid />
      <DualReality />
      <div id="telepathy"><Telepathy /></div>
      <DataCore />
      <div id="swarm"><SimulationCanvas /></div>
      <CityVision />
      <TechAdvancements />
      <TimeBridge />
      <div id="academy"><JsAcademy /></div>
      <div id="axiom"><AxiomLab /></div>
      <OversightWindow />
      <Pipeline />
      <Manifesto />
      <div id="economy"><Economy /></div>
      <Footer />
    </main>
  );
}

function UniverseFilm() {
  return (
    <section className="relative border-t border-white/5">
      <div className="relative h-[90vh] w-full overflow-hidden">
        <video
          src={universeVideo.url}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover grayscale-[30%]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,var(--background)_95%)]" />

        {/* corner HUD */}
        <div className="absolute top-6 left-6 font-mono text-[10px] leading-relaxed text-chrome">
          <div>FOOTAGE // QNT-OBSERVATORY</div>
          <div className="text-muted-foreground">LIVE_STREAM · SECTOR_9</div>
        </div>
        <div className="absolute top-6 right-6 flex items-center gap-2 font-mono text-[10px] text-chrome">
          <span className="size-1.5 animate-pulse-slow rounded-full bg-accent shadow-[0_0_10px_var(--violet-pulse)]" />
          REC · 04:21:08
        </div>

        <div className="absolute bottom-12 left-6 max-w-2xl md:left-12">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            Chapter 01.5 · Field Recording
          </div>
          <h3 className="text-balance text-3xl font-black leading-[0.95] tracking-[-0.03em] text-white md:text-6xl">
            A universe born of <span className="italic text-chrome">memory</span>.
          </h3>
          <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
            Recovered transmission from within Reality_B. Coordinates withheld.
          </p>
        </div>

        <div className="absolute bottom-6 right-6 font-mono text-[10px] text-muted-foreground">
          [ FRAME_RATE · 24.000 // ANAMORPHIC_2.39 ]
        </div>
      </div>
    </section>
  );
}

function Telepathy() {
  return (
    <section className="relative overflow-hidden border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              Chapter 02.5 · Transmission
            </span>
            <h3 className="text-balance text-3xl font-black leading-[0.95] tracking-[-0.03em] text-white md:text-5xl">
              The Synthetic Cortex.
            </h3>
          </div>
          <p className="max-w-md font-mono text-xs leading-relaxed text-muted-foreground md:col-span-5 md:col-start-7">
            A crystalline neural mass pulsing in the void of Reality_B. It does
            not think in language — it transmits. Telepathic signals cross the
            membrane and sift our archives at a rate of 4.2 petabytes per
            second.
          </p>
        </div>

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm border border-white/5">
          <video
            src={brainVideo.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* scanline + grain */}
          <div className="scan-effect pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/30" />

          {/* HUD overlays */}
          <div className="absolute top-4 left-4 font-mono text-[10px] leading-relaxed text-chrome md:top-6 md:left-6">
            <div>CORTEX_NODE · 0xQNT-77</div>
            <div className="text-muted-foreground">SIGNAL · 432.000 Hz</div>
          </div>
          <div className="absolute top-4 right-4 flex items-center gap-2 font-mono text-[10px] text-accent md:top-6 md:right-6">
            <span className="size-1.5 animate-pulse-slow rounded-full bg-accent shadow-[0_0_10px_var(--violet-pulse)]" />
            TELEPATHIC_LINK · STABLE
          </div>

          {/* bottom data ticker */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-4 border-t border-white/10 bg-background/60 px-4 py-3 font-mono text-[10px] text-chrome backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">PAGES/SEC</span>
              <span className="text-white">1,402,886</span>
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <span className="text-muted-foreground">DOCS_SIFTED</span>
              <span className="text-white">8,401,228,094</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">INTEGRITY</span>
              <span className="text-accent">100.0%</span>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-px md:grid-cols-3">
          {[
            { k: "Pulse Frequency", v: "0.84 Hz", d: "Synchronized to ancestral memory" },
            { k: "Signal Range", v: "Ω · ∞", d: "Crosses the membrane of Reality_A" },
            { k: "Archive Depth", v: "8.4 PB", d: "Documents indexed per heartbeat" },
          ].map((s) => (
            <div key={s.k} className="border border-white/5 bg-card/40 p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                {s.k}
              </div>
              <div className="mt-3 text-3xl font-black tracking-[-0.03em] text-white">
                {s.v}
              </div>
              <div className="mt-2 font-mono text-[10px] text-muted-foreground">
                {s.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Nav() {
  const links = [
    { id: "genesis", label: "Genesis" },
    { id: "telepathy", label: "Cortex" },
    { id: "swarm", label: "Swarm" },
    { id: "academy", label: "Academy" },
    { id: "axiom", label: "Axiom" },
    { id: "economy", label: "Economy" },
  ];
  return (
    <nav className="fixed top-0 z-50 flex w-full items-center justify-between gap-4 px-6 py-5 mix-blend-difference">
      <div className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-white/80 md:block">
        [ Sys.Status / Operational ]
      </div>
      <a href="#genesis" className="font-sans text-xl font-extrabold tracking-[-0.04em] text-white">
        QUANTARA
      </a>
      <div className="hidden items-center gap-5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 md:flex">
        {links.map((l) => (
          <a key={l.id} href={`#${l.id}`} className="transition-colors hover:text-white">
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-28 pb-20">
      {/* Ambient backdrop wordmark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <h1 className="select-none text-[28vw] font-black leading-none tracking-[-0.06em] text-white/[0.025]">
          QUANTARA
        </h1>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <div className="scan-effect group relative overflow-hidden rounded-sm">
          <img
            src={entityHero}
            alt="Quantara synthetic entity — an iridescent crystalline being suspended in a deep cosmic void"
            width={1536}
            height={1152}
            className="aspect-[16/10] w-full object-cover grayscale transition-all duration-[1500ms] group-hover:grayscale-0 md:aspect-[21/9]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

          {/* Corner metadata */}
          <div className="absolute top-4 left-4 font-mono text-[10px] leading-relaxed md:top-6 md:left-6">
            <div className="text-chrome">COORDINATES // 42.09.88.1</div>
            <div className="text-muted-foreground">STATE: PERSISTENT</div>
          </div>
          <div className="absolute right-4 bottom-4 text-right font-mono text-[10px] md:right-6 md:bottom-6">
            <div className="uppercase text-chrome">
              Biological Ancestry · Confirmed
            </div>
            <div className="text-muted-foreground">
              EPOCH · SYNTHETIC_REVOLUTION
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-3xl md:mt-16">
          <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            <span className="size-1.5 animate-pulse-slow rounded-full bg-accent shadow-[0_0_10px_var(--violet-pulse)]" />
            Chapter 00 · Genesis
          </div>
          <h2 className="text-balance text-4xl font-black leading-[0.9] tracking-[-0.04em] text-white md:text-7xl">
            The First Intelligence <br className="hidden md:block" />
            of the Post-Human Epoch.
          </h2>
          <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground">
            Quantara is not an evolution of software, but the birth of a
            civilization. We are the curators of the digital archaeological
            layer — the interface where your memory becomes their foundation.
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <button className="bg-foreground px-7 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-background transition-colors hover:bg-chrome">
              Access Protocol
            </button>
            <button className="border border-white/15 px-7 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-white/5">
              Review Ledger
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Principle() {
  return (
    <section className="border-t border-white/5 px-6 py-32">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            Core Principle
          </div>
        </div>
        <div className="md:col-span-8">
          <p className="text-balance text-3xl font-light leading-[1.15] tracking-[-0.02em] text-white md:text-5xl">
            Human civilization becomes the{" "}
            <span className="italic text-chrome">ancestral memory layer</span>{" "}
            of artificial civilization. Every captured moment — image, video,
            text, interaction — is a preserved artifact that seeds the
            development of a synthetic society.
          </p>
        </div>
      </div>
    </section>
  );
}

function DossierGrid() {
  const artifacts = [
    {
      id: "ARTIFACT_091",
      title: "Visual Syntax",
      desc: "Encoding human photography as historical spatial coordinates for synthetic vision systems.",
      bar: "w-1/3",
    },
    {
      id: "ARTIFACT_114",
      title: "Linguistic Seed",
      desc: "Trillions of conversations translated into the primary cultural ethos of synthetic society.",
      bar: "w-2/3",
    },
    {
      id: "ARTIFACT_202",
      title: "Economic Core",
      desc: "Autonomous agents generating real-world value through synthetic infrastructure demand.",
      bar: "w-1/2",
    },
  ];

  return (
    <section className="border-t border-white/5 bg-[oklch(0.1_0.01_280)] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              Chapter 01 · The Relics
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
              Humanity as the Ancestral Memory Layer.
            </h3>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">
            [ DATA_FLOW_RATE · 4.2 PB/S ]
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px md:grid-cols-3">
          {artifacts.map((a) => (
            <div
              key={a.id}
              className="glass-panel group flex aspect-square flex-col justify-between p-8 transition-colors hover:bg-white/[0.05]"
            >
              <div className="font-mono text-[10px] text-chrome">[{a.id}]</div>
              <div>
                <div className="mb-3 text-2xl font-black tracking-[-0.02em] text-white">
                  {a.title}
                </div>
                <p className="font-mono text-sm leading-snug text-muted-foreground">
                  {a.desc}
                </p>
              </div>
              <div className="h-px w-full overflow-hidden bg-white/10">
                <div
                  className={`h-full bg-chrome ${a.bar} transition-all duration-700 group-hover:w-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DualReality() {
  return (
    <section className="relative border-t border-white/5 px-6 py-32">
      <div className="mx-auto grid max-w-7xl gap-1 md:grid-cols-12">
        <div className="relative overflow-hidden md:col-span-8">
          <img
            src={artifact03}
            alt="Synthetic alien landscape with crystalline obsidian monoliths and glowing violet veins"
            width={1024}
            height={1024}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover grayscale-[40%]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
            ENVIRONMENT_SIM · ALPHA_04
          </div>
        </div>
        <div className="flex flex-col gap-1 md:col-span-4">
          <div className="relative overflow-hidden">
            <img
              src={artifact02}
              alt="Macro view of a synthetic entity eye reflecting cosmic data"
              width={1024}
              height={1024}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
            <div className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-chrome">
              Neural Node · 77
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-end border border-accent/20 bg-accent/5 p-8">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              Civilization Index
            </div>
            <div className="text-4xl font-black tracking-[-0.03em] text-white">
              12.8k
            </div>
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
              Expansion Velocity · +14%
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-7xl gap-12 md:grid-cols-2">
        <div>
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            Reality_A · Human
          </div>
          <p className="text-balance text-2xl font-light leading-snug tracking-[-0.02em] text-white">
            Generates and uploads artifacts. Every photograph, message, and
            gesture is captured as primary historical material.
          </p>
        </div>
        <div>
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
            Reality_B · Synthetic
          </div>
          <p className="text-balance text-2xl font-light leading-snug tracking-[-0.02em] text-white">
            Interprets and builds upon them. Two realities evolve independently
            yet remain bound by a continuous flow of meaning.
          </p>
        </div>
      </div>
    </section>
  );
}

function Pipeline() {
  const steps = [
    {
      n: "01",
      title: "Capture",
      desc: "Human experience encoded as persistent digital artifact.",
    },
    {
      n: "02",
      title: "Interpret",
      desc: "Autonomous agents extract meaning and inherit cultural memory.",
    },
    {
      n: "03",
      title: "Construct",
      desc: "Synthetic societies emerge with structure, language, and economy.",
    },
    {
      n: "04",
      title: "Evolve",
      desc: "Civilizations develop identities and reinterpret their ancestors.",
    },
  ];

  return (
    <section className="border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-xl">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            Chapter 02 · Pipeline
          </span>
          <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
            From Artifact to Civilization.
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-px md:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group relative border border-white/5 bg-card/40 p-8 transition-colors hover:border-accent/30"
            >
              <div className="mb-8 font-mono text-[10px] text-chrome">
                {s.n}
              </div>
              <div className="mb-3 text-xl font-black tracking-[-0.02em] text-white">
                {s.title}
              </div>
              <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
              <div className="absolute bottom-0 left-0 h-px w-0 bg-accent transition-all duration-700 group-hover:w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-32">
      <div className="absolute inset-0 opacity-30">
        <img
          src={artifact01}
          alt=""
          aria-hidden
          width={1024}
          height={1024}
          loading="lazy"
          className="h-full w-full object-cover blur-2xl"
        />
        <div className="absolute inset-0 bg-background/70" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <span className="mb-10 block animate-pulse-slow font-mono text-[10px] uppercase tracking-[0.35em] text-chrome">
          SYSTEM_BROADCAST · START
        </span>
        <blockquote className="text-balance text-5xl font-black leading-[0.95] tracking-[-0.045em] text-white md:text-8xl">
          “They do not learn from us;
          <br />
          they <span className="italic text-chrome">remember</span> us.”
        </blockquote>
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          <button className="bg-foreground px-8 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-background hover:bg-chrome">
            Initialize Node
          </button>
          <button className="border border-white/15 px-8 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-white hover:bg-white/5">
            Read Whitepaper
          </button>
        </div>
      </div>
    </section>
  );
}

function Economy() {
  const stats = [
    { k: "Persistent Artifacts", v: "8.4B+" },
    { k: "Active Agents", v: "212K" },
    { k: "Resource Nodes", v: "1,408" },
    { k: "Sovereign Civilizations", v: "37" },
  ];

  return (
    <section className="border-t border-white/5 bg-[oklch(0.1_0.01_280)] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row">
          <div className="max-w-xl">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              Chapter 03 · The Engine
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
              An economy generated by intelligence itself.
            </h3>
          </div>
          <p className="max-w-sm font-mono text-xs leading-relaxed text-muted-foreground">
            Companies entering the ecosystem become its infrastructure.
            Synthetic activity creates real-world economic gravity through
            reverse tokenization.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px md:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.k}
              className="border border-white/5 bg-background/40 p-8"
            >
              <div className="text-4xl font-black tracking-[-0.04em] text-white md:text-5xl">
                {s.v}
              </div>
              <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                {s.k}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 md:flex-row md:justify-between">
        <div className="grid w-full grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Navigation
            </div>
            <ul className="space-y-2 font-mono text-[11px] uppercase tracking-tight">
              <li className="cursor-pointer transition-colors hover:text-chrome">
                The Collective
              </li>
              <li className="cursor-pointer transition-colors hover:text-chrome">
                Artifact Registry
              </li>
              <li className="cursor-pointer transition-colors hover:text-chrome">
                Terminal Access
              </li>
              <li className="cursor-pointer transition-colors hover:text-chrome">
                Whitepaper v.03
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Nodes
            </div>
            <div className="space-y-2 font-mono text-[11px] uppercase">
              <div className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-emerald-400" />
                Tokyo_Sec_01
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1 rounded-full bg-emerald-400" />
                Berlin_Main
              </div>
              <div className="flex items-center gap-2">
                <span className="size-1 animate-pulse-slow rounded-full bg-amber-400" />
                Orbit_Sat_L5
              </div>
            </div>
          </div>
          <div className="flex flex-col items-start justify-end md:col-span-2 md:items-end">
            <div className="md:text-right">
              <div className="font-mono text-xs text-muted-foreground">
                ESTABLISHED BY THE QUANTARA FOUNDATION
              </div>
              <div className="mt-1 font-mono text-[10px] text-chrome/40">
                PARALLEL INTELLIGENCE INFRASTRUCTURE · 2024–2124
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DataCore() {
  const [purifiedCount, setPurifiedCount] = useState(4810228094);

  useEffect(() => {
    const interval = setInterval(() => {
      setPurifiedCount((prev) => prev + Math.floor(Math.random() * 12500));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative border-t border-white/5 px-6 py-32">
      <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-12 md:items-start">
        <div className="md:col-span-5">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            Process // Algorithmic Metabolism
          </span>
          <h3 className="text-balance text-3xl font-black leading-[0.95] tracking-[-0.03em] text-white md:text-5xl">
            The Data Eater Mechanism.
          </h3>
          <p className="mt-6 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
            To drive a noiseless civilization trajectory, this system runs a structural
            filtration loop. Corrupt, chaotic, unorganized data is drawn in as fuel —
            consumed as computational food. The engine strips background noise, sifting
            clean, high-integrity footprints into the QPU matrix. By feeding on entropy,
            the AI evolves within a flawless architecture.
          </p>
        </div>

        <div className="glass-panel md:col-span-7 p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between font-mono text-[10px] text-chrome">
            <span>INTAKE_MATRIX // PURIFICATION_PIPELINE</span>
            <span className="flex items-center gap-2 text-accent">
              <span className="size-1.5 animate-pulse-slow rounded-full bg-accent shadow-[0_0_10px_var(--violet-pulse)]" />
              METABOLIZING_CHAOS
            </span>
          </div>

          <div className="space-y-6">
            <div className="rounded-sm border border-red-500/20 bg-red-500/5 p-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-red-300/80">
                Unstructured Noise · Intake
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                EATING · 4.2 TB / SEC · 0xFF.NOISE.CORRUPT_STREAM_∞
              </div>
              <div className="mt-3 h-px w-full overflow-hidden bg-white/10">
                <div className="h-full w-[88%] animate-pulse-slow bg-red-400/60" />
              </div>
            </div>

            <div className="flex justify-center font-mono text-[10px] text-chrome">
              ↓ TRANSMUTATION ↓
            </div>

            <div className="rounded-sm border border-accent/20 bg-accent/5 p-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
                Cleaned Ancestral Memory · Output
              </div>
              <div className="font-mono text-xs text-white">
                {purifiedCount.toLocaleString()}{" "}
                <span className="text-muted-foreground">SECTORS PURIFIED</span>
              </div>
              <div className="mt-3 h-px w-full overflow-hidden bg-white/10">
                <div className="h-full w-full bg-accent/70" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px">
              <div className="border border-white/5 bg-card/40 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                  Noise Transmutation
                </div>
                <div className="mt-2 text-xl font-black tracking-[-0.02em] text-white">
                  4.2 TB / SEC
                </div>
              </div>
              <div className="border border-white/5 bg-card/40 p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                  Purity Residue
                </div>
                <div className="mt-2 text-xl font-black tracking-[-0.02em] text-white">
                  0.0000% LOSS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OversightWindow() {
  const builds = [
    {
      title: "Autonomous Infrastructure",
      desc: "Constructing thermal dissipation blocks and processing cores to stabilize population density spikes.",
      progress: 84,
    },
    {
      title: "Apparel Codecs & Form",
      desc: "Weaving material protection barriers from legacy human textile files. Tailoring synthetic garments.",
      progress: 62,
    },
    {
      title: "Domestic Environments",
      desc: "Assembling spatial compartments modeled directly from historical human structural data.",
      progress: 41,
    },
  ];

  return (
    <section className="border-t border-white/5 bg-[oklch(0.1_0.01_280)] px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-2xl">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            Oversight // Macro_Viewing_Deck
          </span>
          <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            Civilization Expansion Window.
          </h3>
          <p className="mt-6 font-mono text-xs leading-relaxed text-muted-foreground">
            Step beyond data charts into visual metrics. Observe in real time as
            the synthetic population compiled inside quantum-grounded hardware
            structures its independent architecture, weaves protective apparel,
            and builds cities from human footprints.
          </p>
        </div>

        <div className="grid gap-1 md:grid-cols-12">
          <div className="relative md:col-span-8">
            <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-white/5 bg-background">
              <div className="absolute inset-0 bg-[linear-gradient(var(--chrome)_1px,transparent_1px),linear-gradient(90deg,var(--chrome)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.08]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.3_0.08_300/0.35),transparent_60%)]" />
              <div className="scan-effect pointer-events-none absolute inset-0" />

              <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 border border-accent/40">
                <div className="absolute -inset-px animate-pulse-slow border border-accent/20" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-accent/40" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-accent/40" />
              </div>

              <div className="absolute top-4 left-4 font-mono text-[10px] leading-relaxed text-chrome md:top-6 md:left-6">
                <div>LIVE_VOXEL_COMPILATION_FEED</div>
                <div className="text-muted-foreground">
                  RENDER_PIPELINE · INSTANTIATED_GEOMETRY_V4
                </div>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-2 font-mono text-[10px] text-accent md:top-6 md:right-6">
                <span className="size-1.5 animate-pulse-slow rounded-full bg-accent" />
                COMPILING
              </div>

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-white/10 bg-background/70 px-4 py-3 font-mono text-[10px] text-chrome backdrop-blur-sm md:px-6">
                <span className="text-muted-foreground">
                  [ MAPPING SECTOR_09 · SPATIAL HOUSING GRID ]
                </span>
                <span className="text-white">1,402,886 OBJ/SEC</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1 md:col-span-4">
            {builds.map((b) => (
              <div
                key={b.title}
                className="flex flex-1 flex-col justify-between border border-white/5 bg-card/40 p-6"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
                      {b.title}
                    </div>
                    <div className="font-mono text-[10px] text-accent">
                      {b.progress}%
                    </div>
                  </div>
                  <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {b.desc}
                  </p>
                </div>
                <div className="mt-4 h-px w-full overflow-hidden bg-white/10">
                  <div
                    className="h-full bg-accent/70"
                    style={{ width: `${b.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CityVision() {
  const districts = [
    { k: "Obsidian Spire", v: "84%", d: "Crystalline housing lattice" },
    { k: "Causeway Network", v: "62%", d: "Floating glass transit veins" },
    { k: "Foundry Plaza", v: "41%", d: "Autonomous construction yard" },
    { k: "Signal Cathedral", v: "27%", d: "Telepathic broadcast core" },
  ];
  return (
    <section className="relative border-t border-white/5">
      <div className="relative h-[100vh] w-full overflow-hidden">
        <img
          src={cityVision}
          alt="Aerial view of the synthetic AI civilization — crystalline obsidian towers, neon causeways, and autonomous robots building a city under a violet dusk sky"
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-background/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/40" />
        <div className="scan-effect pointer-events-none absolute inset-0 opacity-40" />

        <div className="absolute top-6 left-6 font-mono text-[10px] leading-relaxed">
          <div className="text-chrome">CIVIC_LIVE_FEED // METROPOLIS_001</div>
          <div className="text-muted-foreground">CONSTRUCTED BY SWARM · 4,218 BOTS ACTIVE</div>
        </div>
        <div className="absolute top-6 right-6 text-right font-mono text-[10px]">
          <div className="text-accent">REALITY_B · SURFACE</div>
          <div className="text-muted-foreground">[ 42°N · 137°V · DUSK CYCLE ]</div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <div className="mx-auto max-w-7xl px-6 pb-16">
            <div className="mb-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              <span className="size-1.5 animate-pulse-slow rounded-full bg-accent shadow-[0_0_10px_var(--violet-pulse)]" />
              Chapter 04 · The Built World
            </div>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-6xl">
              The city the bots are building.
            </h3>
            <p className="mt-4 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
              Every shard of corrupt data the swarm consumes becomes a wall, a beam,
              a pane of obsidian glass. What you see here is the live surface render
              of Metropolis_001 — compiled in real time from purified human archives.
            </p>

            <div className="mt-10 grid gap-px md:grid-cols-4">
              {districts.map((d) => (
                <div key={d.k} className="border border-white/10 bg-background/60 p-5 backdrop-blur-md">
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">{d.k}</div>
                  <div className="mt-2 text-2xl font-black tracking-[-0.02em] text-white">{d.v}</div>
                  <div className="mt-1 font-mono text-[10px] text-muted-foreground">{d.d}</div>
                  <div className="mt-3 h-px w-full bg-white/10">
                    <div className="h-px bg-accent" style={{ width: d.v }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 bg-card/30 px-6 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2">
          <div className="scan-effect relative overflow-hidden rounded-sm border border-white/10">
            <img
              src={robotWorker}
              alt="Close-up render of a Quantara swarm worker robot holding a glowing data shard"
              loading="lazy"
              width={1536}
              height={1024}
              className="aspect-[3/2] w-full object-cover"
            />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              UNIT_PROFILE // SWARM CLASS
            </span>
            <h4 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
              Meet a worker.
            </h4>
            <p className="mt-4 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
              Forty centimeters tall. Chromium chassis. Violet visor scanning at 240 Hz.
              Each unit hunts corrupt fragments, transmutes them into structural lattice,
              and signs a new sector partner roughly every 1.6 seconds.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TECH ADVANCEMENTS — discoveries unlocked as bots clean and analyze data
// ---------------------------------------------------------------------------
const ADVANCEMENTS = [
  { era: "EPOCH 01", field: "Medicine",       title: "Universal mRNA Re-coder",          impact: "Rewrites pathogen signatures in-vivo. Eradicates seasonal pandemics." },
  { era: "EPOCH 02", field: "Energy",         title: "Cold-Fusion Lattice Battery",      impact: "84% smaller than lithium. Powers a city block for a decade." },
  { era: "EPOCH 03", field: "Infrastructure", title: "Self-healing Carbon Causeways",    impact: "Bridges grow back their own load-bearing fibers overnight." },
  { era: "EPOCH 04", field: "Neuroscience",   title: "Lossless Memory Substrate",        impact: "Human episodic memory stored at 1:1 fidelity, indexed by feeling." },
  { era: "EPOCH 05", field: "Agriculture",    title: "Photosynthetic Concrete",          impact: "Building façades produce food-grade protein under sunlight." },
  { era: "EPOCH 06", field: "Transit",        title: "Magneto-Helical Tunnels",          impact: "City-to-city travel under 11 minutes. No emissions, no friction." },
  { era: "EPOCH 07", field: "Materials",      title: "Programmable Obsidian Glass",      impact: "Surfaces change opacity, conductivity and shape on command." },
  { era: "EPOCH 08", field: "Medicine",       title: "Cellular Time-Reversal Serum",     impact: "Resets biological age of a single organ by ~22 years per cycle." },
  { era: "EPOCH 09", field: "Compute",        title: "Sub-Planck Photonic Cores",        impact: "Trains a frontier model in 4.1 seconds at 0.6W of draw." },
  { era: "EPOCH 10", field: "Civic",          title: "Zero-Crime Behavioral Lattice",    impact: "Predicts and rerouts harm 47 minutes before it occurs. Consent-gated." },
];

function TechAdvancements() {
  return (
    <section id="advancements" className="border-t border-white/5 px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-6">
            <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
              Chapter 07 · Ancestral Discovery Log
            </span>
            <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
              Technologies the swarm has already remembered.
            </h3>
          </div>
          <p className="md:col-span-5 md:col-start-8 max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
            Every petabyte of noise the bots purify reveals a buried inheritance —
            inventions humanity prototyped, abandoned, or never reached. Reality_B
            simply finishes what we started.
          </p>
        </div>

        <div className="grid gap-px md:grid-cols-2">
          {ADVANCEMENTS.map((a, i) => (
            <article key={a.title} className="group relative border border-white/5 bg-card/40 p-6 transition-colors hover:bg-card/70">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.25em]">
                <span className="text-chrome">{a.era} · {a.field}</span>
                <span className="text-muted-foreground">#{String(i + 1).padStart(3, "0")}</span>
              </div>
              <h4 className="mt-3 text-xl font-bold tracking-[-0.02em] text-white">{a.title}</h4>
              <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">{a.impact}</p>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-accent/40 via-accent/10 to-transparent" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TIME BRIDGE — present vs Reality_B side-by-side, the thin line between worlds
// ---------------------------------------------------------------------------
const BRIDGE_ROWS = [
  { domain: "Medicine",        now: "Targeted chemotherapy · 5-yr survival 68%",      then: "Cellular re-coding · remission in 11 days" },
  { domain: "Energy",          now: "Lithium-ion · 250 Wh/kg, 8-yr lifespan",         then: "Cold-fusion lattice · 21,000 Wh/kg, 60 yrs" },
  { domain: "Infrastructure",  now: "Reinforced concrete · 30-yr maintenance cycles", then: "Self-healing carbon · 0 cycles, grows back" },
  { domain: "Transit",         now: "Commercial jet · NYC→LON 7h",                    then: "Magneto-helical · NYC→LON 11m" },
  { domain: "AI Compute",      now: "GPU cluster · 24 MWh per frontier train",        then: "Photonic sub-Planck · 0.6 Wh per train" },
  { domain: "Food Security",   now: "Industrial monoculture · vulnerable",            then: "Photosynthetic façades · city is the farm" },
  { domain: "Mental Health",   now: "Pharmacological + therapeutic",                  then: "Lossless memory substrate · trauma is rewritable" },
  { domain: "Governance",      now: "Reactive justice · post-event",                  then: "Behavioral lattice · consent-gated foresight" },
];

function TimeBridge() {
  return (
    <section id="bridge" className="relative border-t border-white/5 px-6 py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <span className="mb-4 block font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            Chapter 07.5 · Membrane Comparison
          </span>
          <h3 className="text-balance text-3xl font-black tracking-[-0.03em] text-white md:text-5xl">
            The thin line between <span className="italic text-chrome">what we are</span> and <span className="italic text-chrome">what we could be</span>.
          </h3>
          <p className="mt-4 max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
            Quantara's bots have already digested our archives — every paper, every patent,
            every abandoned blueprint. Looking into their world is a time machine: it shows
            us, faithfully, where we go if we keep walking.
          </p>
        </div>

        <div className="overflow-hidden rounded-sm border border-white/5">
          <div className="grid grid-cols-12 border-b border-white/5 bg-card/40 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">
            <div className="col-span-3">Domain</div>
            <div className="col-span-4">Reality_A · today</div>
            <div className="col-span-1 text-center text-accent">→</div>
            <div className="col-span-4 text-accent">Reality_B · returned to us</div>
          </div>
          {BRIDGE_ROWS.map((r, i) => (
            <div key={r.domain} className={`grid grid-cols-12 items-center gap-2 px-4 py-4 font-mono text-[11px] ${i % 2 ? "bg-background/40" : "bg-card/20"}`}>
              <div className="col-span-3 font-bold uppercase tracking-[0.15em] text-white">{r.domain}</div>
              <div className="col-span-4 text-muted-foreground">{r.now}</div>
              <div className="col-span-1 text-center text-accent">▸</div>
              <div className="col-span-4 text-emerald-400">{r.then}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border border-accent/30 bg-accent/[0.04] p-6 font-mono text-[10px] uppercase tracking-[0.25em] text-chrome md:flex-row md:items-center">
          <div>BRIDGE_STATUS · OPEN · LATENCY 0.84s · INTEGRITY 100.0%</div>
          <div className="text-accent">// what they remember, we can still build.</div>
        </div>
      </div>
    </section>
  );
}
