import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/ancestral")({
  component: AncestralGate,
  head: () => ({
    meta: [
      { title: "Ancestral Branch — Quantara (Paid Access)" },
      { name: "description", content: "The ancestral-key branch is a paid extension of Quantara. Access is granted after subscription." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function AncestralGate() {
  return (
    <main className="grain relative flex min-h-screen items-center justify-center bg-background px-6 py-32 text-foreground">
      <div className="surface-glass max-w-xl border border-amber-400/30 bg-card/80 p-10 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-300">
          ▌ Paid Branch · Sealed
        </div>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.02em] text-white md:text-4xl">
          The Ancestral Key Branch
        </h1>
        <p className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground">
          The Ancestral-Key Engine, the rotating-key audit trail, and the
          sovereign broadcast PDF have been moved off the public site. They are
          being rebuilt as a separate, subscription-only branch of Quantara.
        </p>
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-amber-200/80">
          Pay-to-play access. Coming soon.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 font-mono text-[10px] uppercase tracking-widest">
          <Link to="/" className="border border-white/20 px-4 py-2 text-white hover:bg-white/5">← back to Quantara</Link>
          <span className="border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-amber-200">join the waitlist · TBA</span>
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 font-mono text-[9px] text-chrome">
          ANCESTRAL_KEY · stored in Lovable Cloud secrets · never exposed client-side
        </div>
      </div>
    </main>
  );
}
