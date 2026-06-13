// On-page instructions panel. Walks the visitor through every interactive
// surface on the home page in the order they appear.
const STEPS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Watch the auto-demo",
    body: "CERN-in-a-Pocket fires a 5-run presentation as soon as the page loads. The beam line lights up, the cartography grid fills 5 cells, and the residual is auto-logged to Solved Theories. No action needed.",
  },
  {
    n: "02",
    title: "Run the full 50-collision sweep",
    body: "Scroll to CERN-in-a-Pocket. Tune Particle / Energy / Field B in the right panel, then click Cartography ×50 (top-right of the canvas) or Run 50-Collision Cartography. Click any heat cell to inspect that run's α, a_e and residual.",
  },
  {
    n: "03",
    title: "Forge the field — Instruments",
    body: "Wave Function Tamer: drag to collapse the wave. Entangled Gate Smith: tap gates to build a circuit and watch Bell-state probabilities live.",
  },
  {
    n: "04",
    title: "Grow the skyline — Growth",
    body: "Aurora Apex, Meridian Skyline and Horizon Dawn each have a Grow button. Each press evolves the canvas; reset returns to baseline.",
  },
  {
    n: "05",
    title: "Talk to the Machine — Math Testing Hub",
    body: "Default tab is the QED computer: paste any equation, hit Solve, and the solve is auto-archived to Solved Theories with abstract, math and full transcript.",
  },
  {
    n: "06",
    title: "Review what's been solved",
    body: "Every solve — auto or manual — appears in Solved Theories at the top of the page. Expand any card to see the equation, transcript and source.",
  },
  {
    n: "07",
    title: "Ancestral branch",
    body: "The /ancestral route is locked behind a paid key sealed in Lovable secrets. Visit only if you have access.",
  },
];

export function HowToUse() {
  return (
    <section id="how-to-use" className="border-t border-white/5 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-chrome">
            ◉ How to use this page
          </span>
          <h3 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white md:text-4xl">
            Seven steps. Top to bottom.
          </h3>
        </div>
        <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-md border border-white/10 bg-card/40 p-4"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                Step {s.n}
              </div>
              <div className="mt-2 text-sm font-bold tracking-[-0.01em] text-white">
                {s.title}
              </div>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
