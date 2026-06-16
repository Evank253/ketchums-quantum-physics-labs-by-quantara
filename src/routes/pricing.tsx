import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · Ketchum's Quantum Physics Labs" },
      { name: "description", content: "Reproducible computational physics benchmarking — trial, Starter, Pro, Institution." },
    ],
  }),
  component: PricingPage,
});

const TIERS = [
  {
    id: "trial", price: "Free", period: "7 days",
    runs: "5 benchmark evaluations",
    features: ["CODATA + literature comparison", "Sigma deviation report", "Immutable run cards", "Dashboard access"],
    cta: "Start trial", to: "/auth",
  },
  {
    id: "starter", price: "$29", period: "/month",
    runs: "100 runs / month",
    features: ["Everything in trial", "Run history", "Export run cards (JSON)", "Email support"],
    cta: "Subscribe", to: "/auth",
  },
  {
    id: "pro", price: "$99", period: "/month", highlight: true,
    runs: "2,000 runs / month",
    features: ["Everything in Starter", "Batch jobs", "Priority compute", "Slack/email support"],
    cta: "Subscribe", to: "/auth",
  },
  {
    id: "institution", price: "$499", period: "/month",
    runs: "Unlimited runs",
    features: ["Everything in Pro", "API keys + key rotation", "HPC export", "Cluster integration", "Private deployments"],
    cta: "Contact / Subscribe", to: "/auth",
  },
];

function PricingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <header className="mb-10">
        <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-300/70 hover:text-cyan-200">
          ← Ketchum's Quantum Physics Labs
        </Link>
        <h1 className="mt-3 text-3xl font-light text-cyan-100">Pricing</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/65">
          Reproducible benchmarking infrastructure for QED / QCD / SMEFT computations.
          Every run produces CODATA + literature comparison, sigma deviation, and an immutable run card.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => (
          <div
            key={t.id}
            className={`flex flex-col rounded-sm border p-5 ${
              t.highlight
                ? "border-cyan-300/60 bg-cyan-400/10"
                : "border-white/15 bg-black/40"
            }`}
          >
            <div className="font-mono text-[9px] uppercase tracking-widest text-white/55">{t.id}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-light text-cyan-100">{t.price}</span>
              <span className="text-xs text-white/50">{t.period}</span>
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-cyan-200/80">{t.runs}</div>
            <ul className="mt-4 space-y-1.5 text-[12px] text-white/75">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-cyan-300/60">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to={t.to}
              className="mt-5 rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25"
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-sm border border-white/10 bg-black/40 p-6">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-200/80">What you actually get</h2>
        <p className="mt-2 text-xs text-white/65">
          This is not a usage allotment for casual exploration. Each evaluation is a paper-grade
          reproducible computation: engine output, CODATA 2022 reference, published literature
          benchmark, combined uncertainty in quadrature, and a SHA-256-hashed run card you can cite.
        </p>
      </section>
    </main>
  );
}
