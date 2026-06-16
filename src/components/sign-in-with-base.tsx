// "Sign in with Base" button — uses Base Account SDK with SIWE.
// Server fn verifies signature + nonce, returns magic link to log user in.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSiweNonce, verifySiweAndLink } from "@/lib/base-auth.functions";

declare global {
  interface Window {
    createBaseAccountSDK?: (cfg: { appName: string; appLogoUrl?: string }) => { getProvider: () => any };
    base?: { pay: (args: any) => Promise<any>; getPaymentStatus: (args: any) => Promise<any> };
  }
}

let providerCache: any = null;
async function ensureProvider() {
  if (providerCache) return providerCache;
  if (!window.createBaseAccountSDK) {
    // Lazy-load the SDK script (CDN fallback if npm import fails)
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/@base-org/account/dist/base-account.min.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Base Account SDK"));
      document.head.appendChild(s);
    });
  }
  providerCache = window.createBaseAccountSDK!({
    appName: "Quantara — Ketchum's Quantum Physics Labs",
    appLogoUrl: "/logo.png",
  }).getProvider();
  return providerCache;
}

export function SignInWithBaseButton({ onSignedIn }: { onSignedIn?: (wallet: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const getNonce = useServerFn(getSiweNonce);
  const verify = useServerFn(verifySiweAndLink);

  async function handleClick() {
    setErr(null);
    setBusy(true);
    try {
      const provider = await ensureProvider();
      const { nonce } = await getNonce();
      const { accounts } = await provider.request({
        method: "wallet_connect",
        params: [{
          version: "1",
          capabilities: {
            signInWithEthereum: { nonce, chainId: "0x2105" /* Base Mainnet — 8453 */ },
          },
        }],
      });
      const account = accounts?.[0];
      if (!account) throw new Error("No account returned");
      const { address } = account;
      const { message, signature } = account.capabilities.signInWithEthereum;

      const result = await verify({ data: { address, message, signature } });
      if (!result.ok) throw new Error(result.error);
      if ("actionLink" in result && result.actionLink) {
        // Use Supabase-generated magic link to establish session
        window.location.href = result.actionLink;
      } else if ("linked" in result) {
        onSignedIn?.(result.wallet);
      }
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-sm border border-blue-400/60 bg-blue-500/15 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-blue-100 hover:bg-blue-500/25 disabled:opacity-50"
      >
        <span className="text-sm">⬢</span>
        {busy ? "Connecting…" : "Sign in with Base"}
      </button>
      {err && (
        <div className="rounded-sm border border-red-400/40 bg-red-500/5 p-2 text-[11px] text-red-200">{err}</div>
      )}
    </div>
  );
}
