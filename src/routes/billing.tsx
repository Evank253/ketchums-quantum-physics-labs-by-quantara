import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyCredits } from "@/lib/credits.functions";
import { SignInWithBaseButton } from "@/components/sign-in-with-base";
import { BasePayButton } from "@/components/base-pay-button";
import { supabase } from "@/integrations/supabase/client";
import { TREASURY_WALLET, shortAddr } from "@/lib/treasury";

export const Route = createFileRoute("/billing")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Billing · Quantara" },
      { name: "description", content: "Manage your Quantara plan, credits, and Base wallet." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BillingPage,
});

type Snapshot = Awaited<ReturnType<typeof getMyCredits>>;

const PLAN_OFFERS = [
  { id: "researcher_monthly", name: "Researcher", price: 99, credits: 100, period: "/mo" },
  { id: "professional_monthly", name: "Professional", price: 499, credits: 1000, period: "/mo" },
  { id: "institutional_monthly", name: "Institutional", price: 2500, credits: 10000, period: "/mo" },
];
const ADDONS = [
  { id: "credits_100", name: "+100 credits", price: 25 },
  { id: "credits_500", name: "+500 credits", price: 100 },
  { id: "qed_benchmark_pack_once", name: "QED Benchmark Pack", price: 299 },
  { id: "physics_dataset_pack_once", name: "Physics Dataset Pack", price: 499 },
];

function BillingPage() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const fetchSnap = useServerFn(getMyCredits);

  async function refresh() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setAuthed(false); return; }
    setAuthed(true);
    try { setSnap(await fetchSnap()); } catch { /* unauthenticated */ }
  }
  useEffect(() => { refresh(); }, []);

  if (authed === false) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-6 py-16">
        <h1 className="mb-4 text-2xl font-light text-cyan-100">Billing</h1>
        <p className="mb-6 text-sm text-white/65">Sign in to view your plan, credits, and Base wallet.</p>
        <SignInWithBaseButton />
        <p className="mt-4 text-center text-[11px] text-white/40">
          or <Link to="/auth" className="text-cyan-300 hover:underline">use email / password</Link>
        </p>
      </main>
    );
  }

  if (!snap) {
    return <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-white/55">Loading…</main>;
  }

  const usedPct = snap.creditsGranted > 0
    ? Math.min(100, Math.round(((snap.creditsGranted - snap.creditsRemaining) / snap.creditsGranted) * 100))
    : 0;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10 space-y-8">
      <header>
        <Link to="/" className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-300/70 hover:text-cyan-200">
          ← Ketchum's Quantum Physics Labs
        </Link>
        <h1 className="mt-3 text-3xl font-light text-cyan-100">Billing &amp; Credits</h1>
      </header>

      {/* Plan & credits */}
      <section className="rounded-sm border border-cyan-300/30 bg-black/40 p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-200/80">Current plan</div>
            <div className="mt-1 text-2xl font-light text-cyan-100 capitalize">{snap.plan}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-200/80">Credits</div>
            <div className="mt-1 text-2xl font-light text-cyan-100">{snap.creditsRemaining}<span className="text-sm text-white/40"> / {snap.creditsGranted}</span></div>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded bg-white/10">
          <div className="h-full bg-cyan-400/70" style={{ width: `${usedPct}%` }} />
        </div>
        {snap.periodEnd && (
          <p className="mt-2 text-[11px] text-white/50">Period ends {new Date(snap.periodEnd).toLocaleDateString()}.</p>
        )}
      </section>

      {/* Wallet */}
      <section className="rounded-sm border border-blue-400/30 bg-black/40 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <div className="font-mono text-[10px] uppercase tracking-widest text-blue-200/80">Base wallet</div>
          {snap.wallet && (
            <a href={`https://basescan.org/address/${snap.wallet}`} target="_blank" rel="noreferrer"
               className="font-mono text-[10px] text-blue-200 hover:underline">view on basescan ↗</a>
          )}
        </div>
        {snap.wallet ? (
          <div className="font-mono text-sm text-white/85">{shortAddr(snap.wallet)}</div>
        ) : (
          <>
            <p className="mb-3 text-[12px] text-white/65">
              Link a Base wallet to receive minted $DAT for your run contributions and pay in USDC.
            </p>
            <SignInWithBaseButton onSignedIn={() => refresh()} />
          </>
        )}
        <p className="mt-3 text-[10px] text-white/40">
          USDC payments are sent to the Creator Treasury at {shortAddr(TREASURY_WALLET)}.
        </p>
      </section>

      {/* Upgrade */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/55">Upgrade plan</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLAN_OFFERS.map((p) => (
            <div key={p.id} className="rounded-sm border border-white/15 bg-black/40 p-4">
              <div className="text-lg text-cyan-100">{p.name}</div>
              <div className="text-2xl font-light text-cyan-100">${p.price}<span className="text-xs text-white/50">{p.period}</span></div>
              <div className="mt-1 font-mono text-[10px] uppercase text-cyan-200/80">{p.credits} credits / mo</div>
              <div className="mt-3 space-y-2">
                <Link to="/pricing"
                      className="block rounded-sm border border-cyan-300/40 px-3 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/10">
                  Pay with card
                </Link>
                {snap.wallet && (
                  <BasePayButton amountUsd={p.price} plan={p.id} walletAddress={snap.wallet} onComplete={refresh} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-white/55">Top-ups &amp; add-ons</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ADDONS.map((a) => (
            <div key={a.id} className="rounded-sm border border-white/15 bg-black/40 p-3">
              <div className="text-sm text-cyan-100">{a.name}</div>
              <div className="text-xl font-light text-cyan-100">${a.price}</div>
              {snap.wallet ? (
                <div className="mt-2"><BasePayButton amountUsd={a.price} addon={a.id} walletAddress={snap.wallet} onComplete={refresh} /></div>
              ) : (
                <p className="mt-2 text-[10px] text-white/40">Link a wallet to purchase.</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
