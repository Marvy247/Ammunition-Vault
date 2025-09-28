import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { reactive } from './contracts';

export const wagmiConfig = getDefaultConfig({
  appName: 'Ammunition Vaults',
  projectId: 'YOUR_PROJECT_ID', // Replace with your actual WalletConnect Project ID
  chains: [reactive],
  ssr: true,
});
