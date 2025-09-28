# Ammunition Vaults: Just-In-Time Liquidity for Maximum Capital Efficiency

**A submission for the [Buidl with React](https://dorahacks.io/hackathon/buidl-with-react/detail) hackathon, leveraging reactive smart contracts.**

---

## The Problem

In modern Automated Market Makers (AMMs) like Uniswap V3, providing concentrated liquidity is the key to high returns. However, it's a high-risk, high-maintenance strategy. Liquidity providers (LPs) expose their capital 24/7 but only earn significant fees during brief moments of high trading volume. For most of the time, their capital is under-utilized and exposed to impermanent loss.

## Our Solution: Ammunition Vaults

Ammunition Vaults flip this model on its head. Instead of passively providing liquidity, our vaults keep capital as "dry powder" (ammunition) and deploy it with surgical precision *only for the instant* a large, fee-generating trade is about to occur.

By leveraging MEV (Maximal Extractable Value) concepts for good, our protocol provides Just-In-Time (JIT) liquidity, capturing significant trading fees without the constant risk of exposure.

### How It Works

1.  **Deposit:** Users deposit a single asset (e.g., USDC) into the Ammunition Vault.
2.  **Subscribe:** The Ammunition Vault (a reactive contract) subscribes to an on-chain event service, specifying criteria for large Uniswap V3 swaps it wants to monitor.
3.  **React:** When the on-chain event service detects a swap matching the criteria, it calls the `react()` function on our vault, triggering the JIT strategy.
4.  **JIT Liquidity (The Magic):** In a single, atomic transaction, the vault:
    a. Borrows the other asset of the pair (e.g., WETH) via a flash loan.
    b. Mints a hyper-concentrated liquidity position in the direct path of the incoming swap.
    c. Immediately collects the fees generated from that swap.
    d. Burns the liquidity position.
    e. Repays the flash loan.
5.  **Profit:** The captured fee, minus the flash loan fee, is pure profit for the vault, increasing the value of all users' shares.

## Current Status

*   **Smart Contracts (Solidity):** The core `AmmunitionVault` contract, `FlashLender`, and `MockERC20` are fully implemented and tested. They adhere to the reactive contract pattern and successfully demonstrate the JIT liquidity strategy in a simulated environment.
*   **Keeper Bot (Node.js/TypeScript):** The setup for the keeper bot is complete, including deployment scripts and a basic trigger for the `react()` function. The logic for dynamic event detection is to be implemented.
*   **Frontend (Next.js/React):** The project is scaffolded with Next.js, RainbowKit, Wagmi, Viem, and Shadcn UI. The basic structure for displaying vault data and managing deposits/withdrawals is in place. UI integration with contract data and event listening is in progress.

## Tech Stack

*   **Smart Contracts:** Solidity, Foundry
*   **Frontend:** Next.js, React, TypeScript, Wagmi, Viem, RainbowKit, Shadcn UI
*   **Keeper Bot:** Node.js, TypeScript, Ethers.js
*   **Protocol Integration:** Uniswap V3, Reactive Contracts Framework

## Local Development

### Dependencies

*   [Foundry](https://getfoundry.sh/)
*   Node.js (v18+)
*   npm

### Running the Smart Contract Tests

The core logic of the smart contracts can be verified through the included Foundry test.

**Important:** The test runs on a mainnet fork and requires a Mainnet RPC URL.

1.  Set your RPC URL in your environment:
    ```shell
    export MAINNET_RPC_URL=<your_rpc_url>
    ```

2.  Run the test:
    ```shell
    forge test --match-contract AmmunitionVaultReactiveTest -vv
    ```
```   
MockERC20 (asset) deployed at: 0x0073263715A90f0ea00787486AF23171CF62e9a2
MockWETH deployed at: 0x67E7DD7C3AA753C73385F518285690adba59920E           
FlashLender deployed at: 0xECE7C60E46e587c434DD1A22431B4816051A007C        
MockPositionManager deployed at: 0xC29E9984fE5a8213f5a6964b0C74554c3089Def4
AmmunitionVault deployed at: 0x1Bdb8941215b26C0c25c2985C71b3E7C9010C6De
```