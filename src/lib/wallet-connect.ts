// WalletConnect v2 helper — browser-only. Lets MetaMask Mobile, Rabby Mobile,
// Trust Wallet, Rainbow, and Coinbase Wallet (mobile) connect via QR code.
//
// The `@walletconnect/ethereum-provider` package is heavyweight and not
// Worker-SSR safe, so we keep it OUT of any static type or value import path
// and only load it via dynamic `import()` at click time in the browser.

type WCProvider = {
  connect: () => Promise<void>;
  disconnect?: () => Promise<void>;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, cb: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, cb: (...args: unknown[]) => void) => void;
};

const BASE_SEPOLIA_ID = 84_532;

export function walletConnectProjectId(): string | null {
  const id = (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_WALLETCONNECT_PROJECT_ID;
  return typeof id === "string" && id.length > 0 ? id : null;
}

let cached: WCProvider | null = null;

export async function getWalletConnectProvider(): Promise<WCProvider> {
  if (typeof window === "undefined") {
    throw new Error("WalletConnect is browser-only.");
  }
  if (cached) return cached;
  const projectId = walletConnectProjectId();
  if (!projectId) {
    throw new Error(
      "WalletConnect not configured. Add VITE_WALLETCONNECT_PROJECT_ID (free at cloud.walletconnect.com).",
    );
  }
  const mod = (await import(
    /* @vite-ignore */ "@walletconnect/ethereum-provider"
  )) as { EthereumProvider: { init: (opts: unknown) => Promise<WCProvider> } };
  cached = await mod.EthereumProvider.init({
    projectId,
    chains: [BASE_SEPOLIA_ID],
    showQrModal: true,
    metadata: {
      name: "Ketchum's Quantum Physics Labs",
      description: "Quantara · $DAT minting on Base Sepolia",
      url: window.location.origin,
      icons: ["https://ketchumsquantumphysicslab.live/favicon.ico"],
    },
  });
  return cached!;
}

export async function connectWalletConnect(): Promise<{
  provider: WCProvider;
  address: string;
  chainIdHex: string;
}> {
  const provider = await getWalletConnectProvider();
  await provider.connect();
  const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
  const chainId = (await provider.request({ method: "eth_chainId" })) as string;
  return { provider, address: accounts[0], chainIdHex: chainId };
}
