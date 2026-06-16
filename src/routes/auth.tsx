import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SignInWithBaseButton } from "@/components/sign-in-with-base";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · Ketchum's Quantum Physics Labs" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/institution" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/institution` },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/institution" });
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-6">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/70 hover:text-cyan-200">
          ← Ketchum's Quantum Physics Labs
        </Link>
      </div>
      <h1 className="mb-1 text-2xl font-light text-cyan-100">
        Sign in to Quantara
      </h1>
      <p className="mb-6 text-xs text-white/55">
        Wallet-first authentication. Your Base wallet is your research identity, receives minted $DAT, and pays in USDC.
      </p>

      <SignInWithBaseButton />

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">or</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {!showEmail ? (
        <button onClick={() => setShowEmail(true)}
          className="w-full rounded-sm border border-white/20 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/65 hover:bg-white/5">
          Use email &amp; password
        </button>
      ) : (
      <>
      <h2 className="mb-3 text-xs font-mono uppercase tracking-widest text-white/55">
        {mode === "signup" ? "Create email account" : "Email sign-in"}
      </h2>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-sm border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-300/60"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-sm border border-white/15 bg-black/50 px-3 py-2 font-mono text-sm text-white outline-none focus:border-cyan-300/60"
        />
        {err && (
          <div className="rounded-sm border border-red-400/40 bg-red-500/5 p-2 text-[11px] text-red-200">
            {err}
          </div>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
        >
          {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <button
        onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
        className="mt-4 text-xs text-white/55 underline-offset-2 hover:text-white hover:underline"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
      </>
      )}
    </main>
  );
}
