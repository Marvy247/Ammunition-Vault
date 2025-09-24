'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type Attribute } from 'next-themes';

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  attribute?: Attribute | Attribute[];
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
