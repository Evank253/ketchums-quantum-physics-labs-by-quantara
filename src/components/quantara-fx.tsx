/**
 * Quantara visual FX atoms — pure CSS/SVG, no deps.
 * Mount any of these as an absolutely-positioned sibling behind content.
 * All respect prefers-reduced-motion via styles.css.
 */

export function AuroraBlobs({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div className="absolute -top-32 -left-32 h-[42rem] w-[42rem] rounded-full opacity-40 blur-3xl animate-aurora-1"
        style={{ background: "radial-gradient(closest-side, oklch(0.7 0.18 295 / 0.45), transparent 70%)" }} />
      <div className="absolute top-1/3 -right-40 h-[36rem] w-[36rem] rounded-full opacity-35 blur-3xl animate-aurora-2"
        style={{ background: "radial-gradient(closest-side, oklch(0.78 0.18 210 / 0.45), transparent 70%)" }} />
      <div className="absolute -bottom-40 left-1/3 h-[40rem] w-[40rem] rounded-full opacity-30 blur-3xl animate-aurora-3"
        style={{ background: "radial-gradient(closest-side, oklch(0.78 0.18 160 / 0.4), transparent 70%)" }} />
    </div>
  );
}

export function StarField({ density = 120, className = "" }: { density?: number; className?: string }) {
  // Deterministic seeded star positions so SSR == client.
  const stars = Array.from({ length: density }).map((_, i) => {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 43758.5453) % 1;
    const fx = (x - Math.floor(x) + 1) % 1;
    const fy = (y - Math.floor(y) + 1) % 1;
    const size = ((i * 37) % 3) + 1;
    const delay = (i % 7) * 0.4;
    return { fx, fy, size, delay };
  });
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white/70 animate-twinkle"
          style={{
            left: `${s.fx * 100}%`,
            top: `${s.fy * 100}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function GridHorizon({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] opacity-30"
        style={{
          background:
            "linear-gradient(to top, oklch(0.7 0.18 295 / 0.18), transparent 80%), " +
            "repeating-linear-gradient(to right, oklch(0.7 0.18 295 / 0.35) 0 1px, transparent 1px 60px), " +
            "repeating-linear-gradient(to bottom, oklch(0.7 0.18 295 / 0.35) 0 1px, transparent 1px 60px)",
          maskImage:
            "linear-gradient(to top, black 0%, transparent 90%)",
          transform: "perspective(600px) rotateX(60deg)",
          transformOrigin: "bottom",
        }}
      />
      <div className="absolute inset-x-0 bottom-[60%] h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
    </div>
  );
}

export function NoiseOverlay({ opacity = 0.05, className = "" }: { opacity?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 mix-blend-overlay ${className}`}
      style={{
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
