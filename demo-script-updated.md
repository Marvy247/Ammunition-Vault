# Ammunition Vault - Demo Script

**Goal:** Impress the "Buidl with React" hackathon judges by showcasing the power and elegance of JIT liquidity powered by reactive contracts.

**Total Time:** Under 5 minutes

---

## Part 1: The Problem with DeFi Liquidity (45 seconds)

| What to Say | What to Do - "Hello everyone. Today, I want to talk about a fundamental problem in DeFi: providing liquidity to AMMs like Uniswap is a high-risk, low-reward game. LPs expose their capital 24/7, suffering from impermanent loss, while only earning significant fees during brief moments of high trading volume. For most of the time, their capital is just sitting there, under-utilized and at risk." | - Start with a slide or a simple diagram illustrating impermanent loss.
| - "This is what we call 'passive liquidity' - and it's incredibly inefficient. It's like leaving your entire net worth in a public place, hoping someone will drop a few coins in your pocket." . - Transition to the Ammunition Vault UI, showing a simple dashboard. - Point to the "Total Value Locked" or a similar metric, which is currently stable. -

---

## Part 2: Introducing Ammunition Vaults (1 minute)

| What to Say - "But what if we could flip this model on its head? What if, instead of being passive, we could be *reactive*? This is the core idea behind Amunition Vault." - "With Ammunition Vault, your capital is kept as 'dry powder' - or ammunition - in the vault. It's not exposed to the market 24/7. Instead, it's deployed with surgical precision *only for the instant* a large, fee-generating trade is about to occur." - "How do we do this? Through the magic of **reactive smart contracts**." - Show the Ammunition Vault UI.
- Click on a "Deposit" button and show a modal where a user can deposit a single asset (e.g., USDC).
- Show a section in the UI that says "Subscribed to: Large Swaps on WETH/USDC Pool".
- Briefly hover over a tooltip that explains what a "reactive contract" is.

---

## Part 3: The "JIT Liquidity" Magic (2 minutes)

| What to Say - "Now for the magic. Let's simulate a large swap on the WETH/USDC pool and see what our Ammunition Vault does. I have a script that will trigger a large swap. Keep your eyes on the 'Recent Activity' panel." - "The swap is detected... and our vault springs into action! In a single, atomic transaction, the vault performed a complex series of operations:" - "First, it borrowed WETH using a flash loan." - "Then, it minted a hyper-concentrated liquidity position right in the path of the incoming swap." - "The swap executed, and our vault collected a significant fee." - "Finally, it burned the liquidity position and repaid the flash loan, all in the same transaction." - "The result? Pure profit for the vault, which is then distributed to all liquidity providers. As you can see, the value of our shares has increased." - Run the script to trigger the large swap.
- The UI should have a "Recent Activity" or "Transaction History" panel that updates in real-time.
- Animate or highlight each step of the JIT liquidity process as you explain it. Use icons and clear labels.
- Show a "Profit" notification or a clear visual indication of the fees earned.
- Point to the updated share value or TVL, showing the increase.

---

## Part 4: The "Reactive" Code (30 seconds)

| What to Say - "This entire complex sequence is orchestrated by a single `react` function in our smart contract. This is the power of the reactive contract architecture. It allows us to build incredibly powerful and efficient DeFi protocols." - "Our frontend is built with Next.js, Wagmi, and Viem, providing a seamless and responsive user experience." - Briefly switch to your code editor and show the `react()` function in `AmmunitionVault.sol`.
- Highlight the key lines of code that perform the flash loan, add liquidity, and remove liquidity.
- Switch back to the UI.

---

## Part 5: Conclusion & Future Vision (45 seconds)

| What to Say - "In summary, Ammunition Vault represents a new paradigm for DeFi liquidity. By using reactive contracts, we achieve:" - "**High Capital Efficiency:** Your money is working for you only when it matters most." - "**Reduced Risk:** No more 24/7 exposure to impermanent loss." - "**Democratized MEV:** We're using MEV for good, bringing the profits back to the users." - "Our vision is to expand Ammunition Vault to other AMMs, introduce even more sophisticated strategies, and eventually hand over governance to a DAO." - "Thank you for your time. We believe Ammunition Vault is the future of DeFi liquidity, and we're excited to be building it with React." - Show a final slide summarizing the key benefits.
- End with a shot of the Amunition Vault logo and the project's contact information.

---