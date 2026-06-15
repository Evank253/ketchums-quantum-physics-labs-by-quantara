// WalletConnect v2 helper — lets MetaMask Mobile, Rabby Mobile, Trust Wallet,
// Rainbow, Coinbase Wallet (mobile), and any WC-compatible wallet connect to
// the dApp by scanning a QR code. Falls back gracefully if no project id is
// configured (button is hidden by the UI).

type EthereumProviderType = Awaited<
  ReturnType<typeof import("@walletconnect/ethereum-provider").EthereumProvider.init>
>;

const BASE_SEPOLIA_ID = 84_532;

export function walletConnectProjectId(): string | null {
  const id = (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID;
  return typeof id === "string" && id.length > 0 ? id : null;
}

let cached: EthereumProviderType | null = null;

export async function getWalletConnectProvider(): Promise<EthereumProviderType> {
  if (cached) return cached;
  const projectId = walletConnectProjectId();
  if (!projectId) {
    throw new Error(
      "WalletConnect not configured. Add VITE_WALLETCONNECT_PROJECT_ID (free at cloud.walletconnect.com).",
    );
  }
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  cached = await EthereumProvider.init({
    projectId,
    chains: [BASE_SEPOLIA_ID],
    showQrModal: true,
    metadata: {
      name: "Ketchum's Quantum Physics Labs",
      description: "Quantara · $DAT minting on Base Sepolia",
      url:
        typeof window !== "undefined"
          ? window.location.origin
          : "https://ketchumsquantumphysicslab.live",
      icons: ["https://ketchumsquantumphysicslab.live/favicon.ico"],
    },
  });
  return cached;
}

export async function connectWalletConnect(): Promise<{
  provider: EthereumProviderType;
  address: string;
  chainIdHex: string;
}> {
  const provider = await getWalletConnectProvider();
  await provider.connect();
  const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
  const chainId = (await provider.request({ method: "eth_chainId" })) as string;
  return { provider, address: accounts[0], chainIdHex: chainId };
}
