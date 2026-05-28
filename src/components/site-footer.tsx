import { Link, useRouterState } from "@tanstack/react-router";

const LINKS: { to: string; label: string }[] = [
  { to: "/legal/terms", label: "Terms" },
  { to: "/legal/research-license", label: "Research License" },
  { to: "/legal/commercial-license", label: "Commercial License" },
  { to: "/legal/creator-policy", label: "Creator Policy" },
  { to: "/legal/collaborators", label: "Collaborators" },
  { to: "/legal/blueprint", label: "Blueprint" },
];

export function SiteFooter() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  // Don't render over the fullscreen 3D canvas routes.
  if (path.startsWith("/world")) return null;

  return (
    <footer className="border-t border-white/10 bg-black/60 px-6 py-10 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="font-mono">
          <div className="text-white">QUANTARA — Multiversal QED Ecosystem</div>
          <div className="mt-1">© 2026 Evan Ketchum. All rights reserved.</div>
          <div className="mt-1">
            <a className="hover:text-white" href="mailto:Evan.ketchum2026@outlook.com">
              Evan.ketchum2026@outlook.com
            </a>
          </div>
          <div className="mt-2 max-w-md text-[10px] text-amber-300/80">
            Simulation content is not a closed-form or experimentally verified physics result.
            See Creator Policy for the simulation vs external-research distinction.
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.2em]">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
