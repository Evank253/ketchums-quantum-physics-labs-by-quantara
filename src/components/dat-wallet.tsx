import { useEffect, useMemo, useState, useCallback } from "react";

// Base Sepolia testnet config
const BASE_SEPOLIA = {
  chainIdHex: "0x14a34", // 84532
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

type Claim = {
  id: string;
  amount: number;
  reason: string;
  ts: number;
  txHash?: string; // present once a real on-chain mint lands
};

type Ledger = {
  address: string;
  balance: number;
  claims: Claim[];
};

const LEDGER_KEY = (addr: string) => `quantara.dat.ledger.${addr.toLowerCase()}`;

function loadLedger(addr: string): Ledger {
  if (typeof window === "undefined") return { address: addr, balance: 0, claims: [] };
  try {
    const raw = localStorage.getItem(LEDGER_KEY(addr));
    if (raw) return JSON.parse(raw) as Ledger;
  } catch {}
  return { address: addr, balance: 0, claims: [] };
}
function saveLedger(l: Ledger) {
  try { localStorage.setItem(LEDGER_KEY(l.address), JSON.stringify(l)); } catch {}
}

declare global {
  interface Window { ethereum?: any }
}

export function DatWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const hasWallet = typeof window !== "undefined" && !!window.ethereum;

  const refreshAccounts = useCallback(async () => {
    if (!hasWallet) return;
    try {
      const accts: string[] = await window.ethereum.request({ method: "eth_accounts" });
      const cid: string = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(cid);
      if (accts && accts[0]) {
        setAddress(accts[0]);
        setLedger(loadLedger(accts[0]));
      } else {
        setAddress(null);
        setLedger(null);
      }
    } catch (e: any) { setErr(e?.message ?? String(e)); }
  }, [hasWallet]);

  useEffect(() => {
    if (!hasWallet) return;
    refreshAccounts();
    const onAcc = (accts: string[]) => {
      if (accts[0]) { setAddress(accts[0]); setLedger(loadLedger(accts[0])); }
      else { setAddress(null); setLedger(null); }
    };
    const onChain = (cid: string) => setChainId(cid);
    window.ethereum.on?.("accountsChanged", onAcc);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAcc);
      window.ethereum?.removeListener?.("chainChanged", onChain);
    };
  }, [hasWallet, refreshAccounts]);

  const connect = async () => {
    setErr(null);
    if (!hasWallet) {
      setErr("No browser wallet detected. Install MetaMask or another EIP-1193 wallet.");
      return;
    }
    try {
      setBusy("connect");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await refreshAccounts();
    } catch (e: any) { setErr(e?.message ?? String(e)); }
    finally { setBusy(null); }
  };

  const switchToBaseSepolia = async () => {
    setErr(null);
    if (!hasWallet) return;
    try {
      setBusy("switch");
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: BASE_SEPOLIA.chainIdHex }],
        });
      } catch (switchErr: any) {
        if (switchErr?.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BASE_SEPOLIA],
          });
        } else { throw switchErr; }
      }
      await refreshAccounts();
    } catch (e: any) { setErr(e?.message ?? String(e)); }
    finally { setBusy(null); }
  };

  const disconnect = () => {
    setAddress(null);
    setLedger(null);
  };

  const onBaseSepolia = chainId?.toLowerCase() === BASE_SEPOLIA.chainIdHex.toLowerCase();

  const claim = async (amount: number, reason: string) => {
    if (!address) return;
    setErr(null);
    try {
      setBusy("claim");
      // Off-chain ledger entry. When a real ERC-20 contract is deployed,
      // we'll replace this with a writeContract({ ..., functionName: "mint" }) call
      // and store the resulting txHash. The ledger shape already supports it.
      const claim: Claim = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        amount, reason, ts: Date.now(),
      };
      const next: Ledger = {
        address,
        balance: (ledger?.balance ?? 0) + amount,
        claims: [claim, ...(ledger?.claims ?? [])].slice(0, 200),
      };
      saveLedger(next);
      setLedger(next);
    } catch (e: any) { setErr(e?.message ?? String(e)); }
    finally { setBusy(null); }
  };

  const resetLedger = () => {
    if (!address) return;
    if (!confirm("Reset $DAT ledger for this wallet?")) return;
    const next: Ledger = { address, balance: 0, claims: [] };
    saveLedger(next);
    setLedger(next);
  };

  const short = useMemo(() => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "", [address]);

  return (
    <section
      id="dat-wallet"
      className="relative mx-auto my-12 max-w-6xl rounded-lg border border-cyan-400/20 bg-black/55 p-5 backdrop-blur"
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/80">
            Sovereign Architect · $DAT Wallet
          </div>
          <h2 className="mt-1 text-xl font-light tracking-tight text-cyan-100">
            On-chain Rewards (Base Sepolia testnet)
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-white/55">
            Connect a browser wallet, switch to Base Sepolia, and claim $DAT for cleaning bad data.
            The claim ledger is keyed to your wallet address. Live ERC-20 minting wires in once you
            deploy a token contract — the claim shape already carries a <code>txHash</code> field.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!address ? (
            <button
              onClick={connect}
              disabled={busy === "connect"}
              className="rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-50"
            >
              {busy === "connect" ? "…" : "Connect wallet"}
            </button>
          ) : (
            <>
              <span className="rounded-sm border border-white/15 bg-black/60 px-2 py-1 font-mono text-[11px] text-cyan-100">
                {short}
              </span>
              <button
                onClick={disconnect}
                className="rounded-sm border border-white/15 bg-black/40 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 hover:bg-white/10"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </header>

      {!hasWallet && (
        <div className="rounded-sm border border-amber-300/30 bg-amber-500/5 p-3 text-[11px] text-amber-200/90">
          No EIP-1193 wallet found. Install MetaMask, Rabby, or any Base-compatible wallet, then reload.
        </div>
      )}

      {address && !onBaseSepolia && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-amber-300/30 bg-amber-500/5 p-3 text-[11px] text-amber-200/90">
          <span>Connected to chain {chainId ?? "?"} — switch to Base Sepolia to claim.</span>
          <button
            onClick={switchToBaseSepolia}
            disabled={busy === "switch"}
            className="rounded-sm border border-amber-300/50 bg-amber-400/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-100 hover:bg-amber-400/25 disabled:opacity-50"
          >
            {busy === "switch" ? "…" : "Switch network"}
          </button>
        </div>
      )}

      {err && (
        <div className="mb-4 rounded-sm border border-red-400/40 bg-red-500/5 p-3 text-[11px] text-red-200">
          {err}
        </div>
      )}

      {address && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Balance + actions */}
          <div className="rounded-sm border border-cyan-300/25 bg-black/50 p-4 md:col-span-1">
            <div className="font-mono text-[9px] uppercase tracking-widest text-cyan-300/70">Balance</div>
            <div className="mt-1 font-mono text-3xl text-cyan-100">
              {(ledger?.balance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
              <span className="ml-2 text-xs text-cyan-300/70">$DAT</span>
            </div>
            <div className="mt-2 text-[10px] text-white/45">
              Network: {onBaseSepolia ? "Base Sepolia ✓" : (chainId ?? "—")}
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => claim(5, "Cleaned bad data · small batch")}
                disabled={!onBaseSepolia || busy === "claim"}
                className="w-full rounded-sm border border-cyan-300/50 bg-cyan-400/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100 hover:bg-cyan-400/25 disabled:opacity-40"
              >
                Claim 5 $DAT
              </button>
              <button
                onClick={() => claim(25, "Verified dataset · medium batch")}
                disabled={!onBaseSepolia || busy === "claim"}
                className="w-full rounded-sm border border-fuchsia-300/50 bg-fuchsia-400/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-fuchsia-100 hover:bg-fuchsia-400/25 disabled:opacity-40"
              >
                Claim 25 $DAT
              </button>
              <button
                onClick={() => claim(100, "Sovereign archive · large batch")}
                disabled={!onBaseSepolia || busy === "claim"}
                className="w-full rounded-sm border border-amber-300/50 bg-amber-400/15 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-100 hover:bg-amber-400/25 disabled:opacity-40"
              >
                Claim 100 $DAT
              </button>
              <button
                onClick={resetLedger}
                className="w-full rounded-sm border border-white/15 bg-black/40 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/55 hover:bg-white/10"
              >
                Reset ledger
              </button>
            </div>
          </div>

          {/* Claim history */}
          <div className="rounded-sm border border-white/10 bg-black/40 p-4 md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/60">
                Claim history · {ledger?.claims.length ?? 0}
              </div>
              <div className="font-mono text-[9px] text-white/40">{short}</div>
            </div>
            {(!ledger || ledger.claims.length === 0) ? (
              <div className="py-10 text-center font-mono text-[11px] text-white/40">
                No claims yet. Switch to Base Sepolia and submit one above.
              </div>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-auto pr-1">
                {ledger.claims.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-sm border border-white/5 bg-black/40 px-3 py-2 font-mono text-[11px] text-white/80"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{c.reason}</div>
                      <div className="text-[9px] text-white/40">
                        {new Date(c.ts).toLocaleString()}
                        {c.txHash && (
                          <>
                            {" · "}
                            <a
                              href={`${BASE_SEPOLIA.blockExplorerUrls[0]}/tx/${c.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-300 hover:underline"
                            >
                              tx
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 font-mono text-cyan-200">+{c.amount}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default DatWallet;
