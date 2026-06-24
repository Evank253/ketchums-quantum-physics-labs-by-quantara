// Mobile wallet helper — no WalletConnect SDK (incompatible with Worker SSR bundling).
// We use MetaMask's universal deep-link instead: on a phone it opens MetaMask Mobile
// directly into our dApp's in-app browser, where window.ethereum is injected.

export function walletConnectProjectId(): string | null {
  // Kept for backward compat with existing UI checks; always null now that the
  // WalletConnect SDK is removed. The mobile button uses a deep-link instead.
  return null;
}

export const DEFAULT_METAMASK_DEEP_LINK = "https://metamask.app.link/dapp/ketchumsquantumphysicslab.live";

export function metamaskMobileDeepLink(): string {
  if (typeof window === "undefined") {
    return DEFAULT_METAMASK_DEEP_LINK;
  }
  const host = window.location.host + window.location.pathname;
  return `https://metamask.app.link/dapp/${host}`;
}

export async function connectWalletConnect(): Promise<never> {
  throw new Error(
    "WalletConnect SDK removed. Use the 'Open in MetaMask Mobile' link, or install a desktop wallet (MetaMask / Rabby / Coinbase).",
  );
}
