import { Link, useRouterState } from "@tanstack/react-router";
import { TREASURY_WALLET, basescanAddress, shortAddr } from "@/lib/treasury";

const LINKS: { to: string; label: string }[] = [
  { to: "/legal/license", label: "License (All Rights Reserved)" },
  { to: "/legal/terms", label: "Terms" },
  { to: "/legal/research-license", label: "Research License" },
  { to: "/legal/commercial-license", label: "Commercial License" },
  { to: "/legal/creator-policy", label: "Creator Policy" },
  { to: "/legal/collaborators", label: "Collaborators" },
  { to: "/legal/blueprint", label: "Blueprint" },
];

export function SiteFooter() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path.startsWith("/world")) return null;

  return (
    <footer className="border-t border-white/10 bg-black/60 px-6 py-10 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="font-mono">
          <div className="text-white">
            Ketchum's Quantum Physics Labs™ · Powered by Quantara™
          </div>
          <div className="mt-1">© 2026 Evan Ketchum. All Rights Reserved.</div>
          <div className="mt-1 max-w-md text-[10px] text-white/55">
            Ketchum's QED Engine™, QCD Engine™, KVE Engine™, CERN-in-a-Pocket
            Engine™, Wave Tamer Engine™, Gate Smith Engine™, World Engine™,
            Atlas Engine™, Self-Healing Swarm™ (AHM/PCL), and $DAT™ are
            trademarks of Evan Ketchum. Unauthorized copying, redistribution,
            derivative works, or AI/ML training is prohibited — see{" "}
            <Link to="/legal/license" className="text-amber-300 hover:text-white underline">
              License
            </Link>
            .
          </div>
          <div className="mt-2">
            <a className="hover:text-white" href="mailto:Evan.ketchum2026@outlook.com">
              Evan.ketchum2026@outlook.com
            </a>
          </div>
          <div className="mt-2 text-[10px] text-white/40">
            Creator Treasury ($DAT royalties):{" "}
            <a
              href={basescanAddress(TREASURY_WALLET)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-cyan-300 hover:text-white"
            >
              {shortAddr(TREASURY_WALLET)}
            </a>
          </div>
          <div className="mt-2 max-w-md text-[10px] text-amber-300/80">
            Simulation content is not a closed-form or experimentally verified
            physics result. See Creator Policy for the simulation vs
            external-research distinction.
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
