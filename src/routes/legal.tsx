import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

export const Route = createFileRoute("/legal")({
  component: LegalLayout,
  head: () => ({
    meta: [
      { title: "Legal — Quantara Platform" },
      { name: "description", content: "Terms, licenses, creator policy, and architectural blueprint for the Quantara Multiversal QED Ecosystem." },
      { property: "og:title", content: "Quantara — Legal" },
      { property: "og:description", content: "Terms, licenses, and creator policy for Quantara by Evan Ketchum." },
    ],
  }),
});

const DOCS = [
  { to: "/legal/terms", title: "Terms of Use", blurb: "Ownership, scope of use, no-physics-guarantee, breakthrough classes." },
  { to: "/legal/research-license", title: "Research License (Non-Commercial)", blurb: "Free academic and personal use with attribution." },
  { to: "/legal/commercial-license", title: "Commercial & Institutional License", blurb: "Companies, national labs, universities — fees and revenue share." },
  { to: "/legal/creator-policy", title: "Creator & Breakthrough Logging Policy", blurb: "Simulation vs external_research; how creator credit is recorded." },
  { to: "/legal/collaborators", title: "For Collaborators", blurb: "How research teams integrate their codes with Quantara." },
  { to: "/legal/blueprint", title: "Architectural Blueprint", blurb: "3D World ↔ Core ↔ 4D Atlas system overview and breakthrough registry." },
];

function LegalLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path !== "/legal") return <Outlet />;

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground">
          ← Home
        </Link>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.02em] md:text-5xl">Legal & Policy</h1>
        <p className="mt-3 max-w-2xl font-mono text-xs text-muted-foreground">
          Quantara Platform — Created by Evan Ketchum. All content protected. Contact
          <a className="ml-1 text-accent hover:underline" href="mailto:Evan.ketchum2026@outlook.com">
            Evan.ketchum2026@outlook.com
          </a>
          .
        </p>

        <div className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
          {DOCS.map((d) => (
            <Link
              key={d.to}
              to={d.to}
              className="group block border border-white/10 bg-card/30 p-5 transition-colors hover:border-accent/50 hover:bg-card/60"
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-chrome">Document</div>
              <div className="mt-2 text-lg font-bold text-white group-hover:text-accent">{d.title}</div>
              <p className="mt-2 text-xs text-muted-foreground">{d.blurb}</p>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Read →</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
