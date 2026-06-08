// Server-only helpers for $DAT minting.
// Not imported by client modules. Reads secrets at call time, never at module scope.
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  isAddress,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

export const DAT_DECIMALS = 18;

export const ERC20_ABI = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export type MintConfig = {
  rpcUrl: string;
  contractAddress: `0x${string}`;
  minterKey: Hex;
};

export function loadMintConfig(): { ok: true; cfg: MintConfig } | { ok: false; missing: string[] } {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
  const contractAddress = process.env.DAT_CONTRACT_ADDRESS;
  const minterKey = process.env.DAT_MINTER_PRIVATE_KEY;

  const missing: string[] = [];
  if (!contractAddress) missing.push("DAT_CONTRACT_ADDRESS");
  if (!minterKey) missing.push("DAT_MINTER_PRIVATE_KEY");
  if (missing.length) return { ok: false, missing };
  if (!isAddress(contractAddress!)) {
    return { ok: false, missing: ["DAT_CONTRACT_ADDRESS (invalid address)"] };
  }
  const key = (minterKey!.startsWith("0x") ? minterKey! : `0x${minterKey!}`) as Hex;
  return {
    ok: true,
    cfg: { rpcUrl, contractAddress: contractAddress as `0x${string}`, minterKey: key },
  };
}

export function getPublicClient(cfg: MintConfig) {
  return createPublicClient({ chain: baseSepolia, transport: http(cfg.rpcUrl) });
}

export function getWalletClient(cfg: MintConfig) {
  const account = privateKeyToAccount(cfg.minterKey);
  return createWalletClient({ account, chain: baseSepolia, transport: http(cfg.rpcUrl) });
}

export async function readBalance(cfg: MintConfig, wallet: `0x${string}`): Promise<bigint> {
  const pub = getPublicClient(cfg);
  return (await pub.readContract({
    address: cfg.contractAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [wallet],
  })) as bigint;
}

export async function mintOnChain(
  cfg: MintConfig,
  to: `0x${string}`,
  amount: number,
): Promise<{ txHash: Hex; blockNumber: bigint }> {
  const wallet = getWalletClient(cfg);
  const pub = getPublicClient(cfg);
  const value = parseUnits(amount.toString(), DAT_DECIMALS);

  const { request } = await pub.simulateContract({
    account: wallet.account,
    address: cfg.contractAddress,
    abi: ERC20_ABI,
    functionName: "mint",
    args: [to, value],
  });
  const txHash = await wallet.writeContract(request);
  const receipt = await pub.waitForTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") {
    throw new Error(`Mint reverted at block ${receipt.blockNumber}`);
  }
  return { txHash, blockNumber: receipt.blockNumber };
}

export function normalizeAddress(addr: string): `0x${string}` | null {
  if (!isAddress(addr)) return null;
  return addr.toLowerCase() as `0x${string}`;
}
