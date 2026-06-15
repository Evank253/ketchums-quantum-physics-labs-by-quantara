# Deploying the $DAT Contract (Base Sepolia)

The Lovable runtime cannot deploy a contract for you. Do this once, then
paste two values into the project's secrets and you're live.

## Option A — Remix (no install)

1. Open <https://remix.ethereum.org>.
2. Create `Dat.sol` and paste the contents of `contracts/Dat.sol` from this
   repo.
3. In Remix, **File Manager → .deps → npm** auto-resolves
   `@openzeppelin/contracts` on compile.
4. **Solidity Compiler** → version `0.8.24` → **Compile Dat.sol**.
5. **Deploy & Run** → Environment **Injected Provider — MetaMask**. Switch
   MetaMask to **Base Sepolia** (chainId `84532`). Fund the deployer with
   testnet ETH from <https://www.alchemy.com/faucets/base-sepolia>.
6. In the **Deploy** field next to `Dat`, set `initialOwner` to the address
   whose private key will be the **server-side minter** (NOT your treasury
   wallet — use a fresh key with only test ETH).
7. Click **Deploy**, confirm in MetaMask, copy the **contract address**.

## Option B — Foundry

```bash
forge init dat && cd dat
# paste contracts/Dat.sol into src/Dat.sol
forge install OpenZeppelin/openzeppelin-contracts
forge create --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $MINTER_PK \
  src/Dat.sol:Dat --constructor-args $MINTER_ADDRESS
```

## After Deploy

Paste these into Lovable → **Project Settings → Secrets**:

| Secret | Value |
| --- | --- |
| `DAT_CONTRACT_ADDRESS` | `0x...` from the deploy step |
| `DAT_MINTER_PRIVATE_KEY` | `0x...` private key of `initialOwner` |
| `BASE_SEPOLIA_RPC_URL`  | Alchemy/Infura/QuickNode endpoint (optional) |
| `VITE_WALLETCONNECT_PROJECT_ID` | From <https://cloud.walletconnect.com> |

The server `/dat` minter activates automatically. Every successful user
claim also mints a **10% Creator Royalty** to the hard-coded treasury
wallet `0x15B3E693Ac1B76A49cdc61FCfe8696F6dd1586DD`.

## Safety

- The minter key signs every mint server-side. Keep it in Lovable secrets,
  never in client code, never in git.
- The treasury wallet holds royalties only — it does **not** need to be the
  minter. Give the minter key just enough ETH to cover gas.
- This contract is **test-network only** unless audited.
