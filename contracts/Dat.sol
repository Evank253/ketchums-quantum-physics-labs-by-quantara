// SPDX-License-Identifier: SEE-LICENSE-IN-/legal/license
// Ketchum's $DAT — ERC-20 with owner-only mint, intended for Base Sepolia testnet.
// © 2026 Evan Ketchum. All Rights Reserved.
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Dat is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("Ketchum Data Access Token", "DAT")
        Ownable(initialOwner)
    {}

    /// @notice Mint new $DAT. Only the owner (the Lovable server minter key) can call.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
