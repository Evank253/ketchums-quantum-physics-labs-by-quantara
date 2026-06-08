import { useEffect, useMemo, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { claimDat, getOnChainBalance, listClaims } from "@/lib/dat-mint.functions";

// Base Sepolia testnet config
const BASE_SEPOLIA = {
  chainIdHex: "0x14a34", // 84532
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

type ClaimRow = {
  id: string;
  amount: number | string;
  reason: string;
  reason_key: string | null;
  status: "pending" | "sent" | "confirmed" | "failed";
  tx_hash: string | null;
  block_number: number | null;
  error: string | null;
  created_at: string;
};

type PresetId = "small" | "medium" | "large" | "genesis";

const PRESETS: Array<{ id: PresetId; amount: number; label: string; tone: string }> = [
  { id: "small", amount: 5, label: "Clean batch", tone: "cyan" },
  { id: "medium", amount: 25, label: "Verified set", tone: "fuchsia" },
  { id: "large", amount: 100, label: "Sovereign archive", tone: "amber" },
  { id: "genesis", amount: 500, label: "Genesis (1×)", tone: "emerald" },
];

declare global {
  interface Window { ethereum?: any }
}

function formatUnits(raw: string, decimals: number): string {
  if (!raw || raw === "0") return "0";
  const s = raw.padStart(decimals + 1, "0");
  const i = s.length - decimals;
  const whole = s.slice(0, i).replace(/^0+(?=\d)/, "");
  const frac = s.slice(i).replace(/0+$/, "");
  return frac ? `${whole}.${frac.slice(0, 4)}` : whole;
}

export function DatWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [chainBalance, setChainBalance] = useState<string>("0");
  const [chainDecimals, setChainDecimals] = useState<number>(18);
  const [chainConfigured, setChainConfigured] = useState<boolean | null>(null);
  const [chainMissing, setChainMissing] = useState<string[]>([]);
  const [contractAddr, setContractAddr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  const callClaim = useServerFn(claimDat);
  const callBalance = useServerFn(getOnChainBalance);
  const callList = useServerFn(listClaims);

  // Client-only mount flag to avoid SSR/CSR mismatch
  useEffect(() => {
    setHasWallet(typeof window !== "undefined" && !!window.ethereum);
  }, []);

  const refreshAccounts = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const accts: string[] = await window.ethereum.request({ method: "eth_accounts" });
      const cid: string = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(cid);
      setAddress(accts?.[0] ?? null);
    } catch (e: any) { setErr(e?.message ?? String(e)); }
  }, []);

  useEffect(() => {
    if (!hasWallet) return;
    refreshAccounts();
    const onAcc = (accts: string[]) => setAddress(accts?.[0] ?? null);
    const onChain = (cid: string) => setChainId(cid);
    window.ethereum.on?.("accountsChanged", onAcc);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", onAcc);
      window.ethereum?.removeListener?.("chainChanged", onChain);
    };
  }, [hasWallet, refreshAccounts]);

  const loadServerState = useCallback(async (addr: string) => {
    try {
      const [bal, list] = await Promise.all([
        callBalance({ data: { wallet: addr } }),
        callList({ data: { wallet: addr, limit: 50 } }),
      ]);
      setChainConfigured(bal.configured);
      setChainMissing("missing" in bal && bal.missing ? bal.missing : []);
      setChainBalance(bal.balance ?? "0");
      if ("decimals" in bal && bal.decimals) setChainDecimals(bal.decimals);
      if ("contract" in bal && bal.contract) setContractAddr(bal.contract);
      setClaims((list.claims ?? []) as ClaimRow[]);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    }
  }, [callBalance, callList]);

  useEffect(() => {
    if (address) loadServerState(address);
    else { setClaims([]); setChainBalance("0"); }
  }, [address, loadServerState]);

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

  const disconnect = () => setAddress(null);

  const onBaseSepolia = chainId?.toLowerCase() === BASE_SEPOLIA.chainIdHex.toLowerCase();

  const doClaim = async (preset: PresetId) => {
    if (!address) return;
    setErr(null); setInfo(null);
    try {
      setBusy(`claim:${preset}`);
      const res = await callClaim({ data: { wallet: address, preset } });
      setInfo(`Minted! tx ${res.txHash.slice(0, 10)}… block ${res.blockNumber}`);
      await loadServerState(address);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      // Refresh list anyway — failed/pending rows still show up
      if (address) await loadServerState(address);
    } finally { setBusy(null); }
  };

  const short = useMemo(
    () => (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ""),
    [address],
  );
  const balanceDisplay = useMemo(
    () => formatUnits(chainBalance, chainDecimals),
    [chainBalance, chainDecimals],
  );

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
            Server-side minter signs every mint. Double-claims blocked by DB unique index +
            cooldown. Full audit log written for every attempt (success or failure).
            {contractAddr && (
              <>
                {" "}
                Contract:{" "}
                <a
                  href={`${BASE_SEPOLIA.blockExplorerUrls[0]}/address/${contractAddr}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-300 hover:underline"
                >
                  {contractAddr.slice(0, 8)}…{contractAddr.slice(-6)}
                </a>
              </>
            )}
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

      {chainConfigured === false && (
        <div className="mb-4 rounded-sm border border-amber-300/30 bg-amber-500/5 p-3 text-[11px] text-amber-200/90">
          <div className="font-mono uppercase tracking-[0.2em] text-amber-100">
            On-chain minter not configured
          </div>
          <div className="mt-1 text-amber-200/80">
            Missing secrets: <span className="font-mono">{chainMissing.join(", ")}</span>. Deploy an
            ERC-20 with an owner-only <code>mint(address,uint256)</code> on Base Sepolia, then add
            <span className="font-mono"> DAT_CONTRACT_ADDRESS</span> and
            <span className="font-mono"> DAT_MINTER_PRIVATE_KEY</span> as Lovable Cloud secrets.
            Claims will still be recorded in the ledger but won't hit the chain yet.
          </div>
        </div>
      )}

      {hasWallet === false && (
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
      {info && (
        <div className="mb-4 rounded-sm border border-emerald-400/40 bg-emerald-500/5 p-3 text-[11px] text-emerald-200">
          {info}
        </div>
      )}

      {address && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Balance + actions */}
          <div className="rounded-sm border border-cyan-300/25 bg-black/50 p-4 md:col-span-1">
            <div className="font-mono text-[9px] uppercase tracking-widest text-cyan-300/70">
              On-chain balance
            </div>
            <div className="mt-1 font-mono text-3xl text-cyan-100">
              {balanceDisplay}
              <span className="ml-2 text-xs text-cyan-300/70">$DAT</span>
            </div>
            <div className="mt-2 text-[10px] text-white/45">
              Network: {onBaseSepolia ? "Base Sepolia ✓" : (chainId ?? "—")}
              {chainConfigured === false && " · simulated"}
            </div>

            <div className="mt-4 space-y-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => doClaim(p.id)}
                  disabled={!onBaseSepolia || busy?.startsWith("claim")}
                  className={`w-full rounded-sm border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] disabled:opacity-40 ${
                    p.tone === "cyan"
                      ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25"
                      : p.tone === "fuchsia"
                      ? "border-fuchsia-300/50 bg-fuchsia-400/15 text-fuchsia-100 hover:bg-fuchsia-400/25"
                      : p.tone === "amber"
                      ? "border-amber-300/50 bg-amber-400/15 text-amber-100 hover:bg-amber-400/25"
                      : "border-emerald-300/50 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25"
                  }`}
                >
                  {busy === `claim:${p.id}` ? "…" : `Claim ${p.amount} · ${p.label}`}
                </button>
              ))}
              <button
                onClick={() => address && loadServerState(address)}
                className="w-full rounded-sm border border-white/15 bg-black/40 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-white/55 hover:bg-white/10"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Claim history */}
          <div className="rounded-sm border border-white/10 bg-black/40 p-4 md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-widest text-white/60">
                Claim history · {claims.length}
              </div>
              <div className="font-mono text-[9px] text-white/40">{short}</div>
            </div>
            {claims.length === 0 ? (
              <div className="py-10 text-center font-mono text-[11px] text-white/40">
                No claims yet. Switch to Base Sepolia and submit one above.
              </div>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-auto pr-1">
                {claims.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-sm border border-white/5 bg-black/40 px-3 py-2 font-mono text-[11px] text-white/80"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{c.reason}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] text-white/40">
                        <span>{new Date(c.created_at).toLocaleString()}</span>
                        <span
                          className={
                            c.status === "confirmed"
                              ? "text-emerald-300"
                              : c.status === "failed"
                              ? "text-red-300"
                              : "text-amber-300"
                          }
                        >
                          · {c.status}
                        </span>
                        {c.tx_hash && (
                          <a
                            href={`${BASE_SEPOLIA.blockExplorerUrls[0]}/tx/${c.tx_hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-300 hover:underline"
                          >
                            · tx {c.tx_hash.slice(0, 8)}…
                          </a>
                        )}
                        {c.block_number && <span>· block {c.block_number}</span>}
                        {c.error && <span className="text-red-300/80">· {c.error}</span>}
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
