// "Pay with Base" (USDC) button — pays TREASURY_WALLET, server grants credits.

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TREASURY_WALLET } from "@/lib/treasury";
import { verifyBasePayment } from "@/lib/base-pay.functions";

declare global {
  interface Window {
    base?: { pay: (args: any) => Promise<any>; getPaymentStatus: (args: any) => Promise<any> };
  }
}

async function ensureBase() {
  if (window.base) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://unpkg.com/@base-org/account/dist/base-account.min.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Base SDK"));
    document.head.appendChild(s);
  });
}

export function BasePayButton(props: {
  amountUsd: number;
  plan?: string;
  addon?: string;
  testnet?: boolean;
  walletAddress: string;
  onComplete?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const verify = useServerFn(verifyBasePayment);
  const testnet = props.testnet ?? false;

  async function handleClick() {
    setErr(null);
    setBusy(true);
    try {
      await ensureBase();
      if (!window.base) throw new Error("Base SDK unavailable");
      const result = await window.base.pay({
        amount: props.amountUsd.toFixed(2),
        to: TREASURY_WALLET,
        testnet,
      });
      const status = await window.base.getPaymentStatus({ id: result.id, testnet });
      const verified = await verify({
        data: {
          paymentId: result.id,
          plan: props.plan,
          addon: props.addon,
          walletAddress: props.walletAddress,
          testnet,
          clientReportedStatus: (status.status as "completed" | "pending" | "failed") ?? "pending",
        },
      });
      if (!verified.ok) throw new Error(`Payment ${verified.status}`);
      props.onComplete?.();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy || !props.walletAddress}
        className="flex w-full items-center justify-center gap-2 rounded-sm border border-blue-400/60 bg-blue-500/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-blue-100 hover:bg-blue-500/25 disabled:opacity-40"
        title={!props.walletAddress ? "Link a Base wallet first" : undefined}
      >
        <span>⬢</span> Pay ${props.amountUsd} USDC
      </button>
      {err && <div className="text-[10px] text-red-300">{err}</div>}
    </div>
  );
}
