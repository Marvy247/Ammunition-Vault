import { createPublicClient, http, getContract, PublicClient, WalletClient, getAddress } from 'viem';
import { defineChain } from 'viem/utils';
import deployedAddresses from '../src/abis/deployed_addresses.json';

// Import contract ABIs
import AmmunitionVaultAbi from '../src/abis/AmmunitionVault.json';
import FlashLenderAbi from '../src/abis/FlashLender.json';
import MockERC20Abi from '../src/abis/MockERC20.json';

export const reactive = defineChain({
  id: 1597,
  name: 'REACTIVE Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'React',
    symbol: 'REACT',
  },
  rpcUrls: {
    default: { http: ['https://mainnet-rpc.rnk.dev/'] },
  },
  blockExplorers: {
    default: { name: 'Reactscan', url: 'https://reactscan.net' },
  },
});

export const publicClient = createPublicClient({
  chain: reactive,
  transport: http(),
});

export const getAmmunitionVaultContract = (client: PublicClient | WalletClient) => {
  return getContract({
    address: getAddress(deployedAddresses.ammunitionVault),
    abi: AmmunitionVaultAbi.abi,
    client,
  });
};

export const getFlashLenderContract = (client: PublicClient | WalletClient) => {
  return getContract({
    address: getAddress(deployedAddresses.flashLender),
    abi: FlashLenderAbi.abi,
    client,
  });
};

export const getMockUSDCContract = (client: PublicClient | WalletClient) => {
  return getContract({
    address: getAddress(deployedAddresses.mockUSDC),
    abi: MockERC20Abi.abi,
    client,
  });
};

export const getWETHAddress = () => deployedAddresses.weth;
export const getUSDCWETHPoolAddress = () => deployedAddresses.usdcWethPool;

export const getDeployedAddresses = () => deployedAddresses;
