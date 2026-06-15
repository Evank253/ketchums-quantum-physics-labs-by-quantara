// Creator Treasury — hard-coded wallet that receives the on-chain royalty
// for every $DAT mint. Owned by Evan Ketchum. Do not change without the
// Creator's written authorization.

export const TREASURY_WALLET = "0x15B3E693Ac1B76A49cdc61FCfe8696F6dd1586DD" as const;

export const TREASURY_LABEL = "Ketchum Creator Treasury";

// Default royalty: 10% of every successful claim is auto-minted to TREASURY_WALLET
// in a separate tx, recorded in dat_claims with reason "Creator royalty".
export const CREATOR_ROYALTY_BPS = 1_000; // 10.00%

export function basescanAddress(addr: string): string {
  return `https://sepolia.basescan.org/address/${addr}`;
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
