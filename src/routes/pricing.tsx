import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · Ketchum's Quantum Physics Labs" },
      { name: "description", content: "Reproducible computational physics benchmarking — trial, Starter, Pro, Institution." },
    ],
  }),
  component: PricingPage,
});

type TierId = "explorer" | "researcher" | "professional" | "institutional" | "enterprise";
const TIERS: Array<{
  id: TierId; price: string; period: string; runs: string; features: string[]; priceId?: string; planKey?: string; usdc?: number; highlight?: boolean; contact?: boolean;
}> = [
  { id: "explorer", price: "Free", period: "5 runs", runs: "5 benchmark evaluations",
    features: ["CODATA + literature comparison", "Sigma deviation report", "Immutable run cards", "Public dashboard"] },
  { id: "researcher", price: "$99", period: "/month", runs: "100 runs / month", priceId: "researcher_monthly", planKey: "researcher_monthly", usdc: 99,
    features: ["Everything in Explorer", "Run history + JSON export", "Run-card provenance", "Email support"] },
  { id: "professional", price: "$499", period: "/month", runs: "1,000 runs / month", priceId: "professional_monthly", planKey: "professional_monthly", usdc: 499, highlight: true,
    features: ["Everything in Researcher", "Team seats", "Priority compute queue", "Dataset exports"] },
  { id: "institutional", price: "$2,500", period: "/month", runs: "10,000 runs / month", priceId: "institutional_monthly", planKey: "institutional_monthly", usdc: 2500,
    features: ["Everything in Professional", "SSO + audit logs", "Dedicated support", "Compliance modules"] },
  { id: "enterprise", price: "Contact", period: "us", runs: "Custom volume + SLAs", contact: true,
    features: ["Private deployment", "Custom research contract", "On-prem option", "Government & defense ready"] },
];

function PricingPage() {
  const [checkoutPrice, setCheckoutPrice] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>();
  const navigate = useNavigate();

  const openCheckout = async (priceId: string | undefined) => {
    if (!priceId) { navigate({ to: "/auth" }); return; }
    const { data } = await supabase.auth.getUser();
    if (!data.user) { navigate({ to: "/auth" }); return; }
    setEmail(data.user.email ?? undefined);
    setCheckoutPrice(priceId);
  };

  return (
    <>
      <PaymentTestModeBanner />
      <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
        <header className="mb-10">
          <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-300/70 hover:text-cyan-200">
            ← Ketchum's Quantum Physics Labs
          </Link>
          <h1 className="mt-3 text-3xl font-light text-cyan-100">Pricing</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Reproducible benchmarking infrastructure. Every run produces CODATA + literature comparison,
            sigma deviation, and an immutable run card.
          </p>
        </header>

        {checkoutPrice ? (
          <div className="rounded-sm border border-cyan-300/40 bg-black/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-200">Checkout · {checkoutPrice}</div>
              <button
                className="font-mono text-[10px] uppercase tracking-widest text-white/60 hover:text-white"
                onClick={() => setCheckoutPrice(null)}
              >
                ← back
              </button>
            </div>
            <StripeEmbeddedCheckout
              priceId={checkoutPrice}
              customerEmail={email}
              returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/institution?checkout=success`}
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((t) => (
              <div key={t.id}
                className={`flex flex-col rounded-sm border p-5 ${
                  t.highlight ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/15 bg-black/40"
                }`}>
                <div className="font-mono text-[9px] uppercase tracking-widest text-white/55">{t.id}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-light text-cyan-100">{t.price}</span>
                  <span className="text-xs text-white/50">{t.period}</span>
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-cyan-200/80">{t.runs}</div>
                <ul className="mt-4 space-y-1.5 text-[12px] text-white/75">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2"><span className="text-cyan-300/60">·</span><span>{f}</span></li>
                  ))}
                </ul>
                <button
                  onClick={() => t.priceId ? openCheckout(t.priceId) : navigate({ to: "/auth" })}
                  className="mt-5 rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25"
                >
                  {t.priceId ? "Subscribe" : "Start trial"}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
