'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAccount } from 'wagmi';
import {
  Menu,
  X,
  Shield,
  Zap,
  TrendingUp,
  DollarSign,

} from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { address } = useAccount();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Ammunition Vault
                </h1>
                <p className="text-xs text-muted-foreground">JIT Liquidity Protocol</p>
              </div>
            </Link>

            {/* Network Status */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <Badge variant="outline" className="text-xs">
                  Ethereum Mainnet
                </Badge>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/vault">
              <Button variant="ghost" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Vault</span>
              </Button>
            </Link>

            <Link href="/strategies">
              <Button variant="ghost" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <Zap className="h-4 w-4" />
                <span>Strategies</span>
              </Button>
            </Link>

            <Link href="/analytics">
              <Button variant="ghost" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Analytics</span>
              </Button>
            </Link>
            <ThemeToggle />
            <ConnectButton />
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              className="md:hidden text-muted-foreground hover:text-foreground"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <nav className="flex flex-col space-y-2 p-4">
              <Link href="/vault" onClick={toggleMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Vault
                </Button>
              </Link>

              <Link href="/strategies" onClick={toggleMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                  <Zap className="h-4 w-4 mr-2" />
                  Strategies
                </Button>
              </Link>

              <Link href="/analytics" onClick={toggleMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>

              <div className="flex items-center space-x-2 pt-2 border-t">
                <div className="flex-1" />
                <ConnectButton />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
