import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'viem/chains';

export const wagmiConfig = getDefaultConfig({
  appName: 'Ammunition Vaults',
  projectId: 'YOUR_PROJECT_ID', // Replace with your actual WalletConnect Project ID
  chains: [mainnet, sepolia],
  ssr: true,
});
