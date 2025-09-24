
'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTheme } from 'next-themes';

import { wagmiConfig } from '@/lib/wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme } = useTheme();
  React.useEffect(() => setMounted(true), []);

  const rainbowKitTheme = React.useMemo(() => {
    if (!mounted) return undefined;
    return resolvedTheme === 'dark' ? darkTheme() : lightTheme();
  }, [mounted, resolvedTheme]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme}>
          {mounted && children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
