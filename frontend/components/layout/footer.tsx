'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Github,
  Twitter,
  MessageCircle,
  ExternalLink,
  Shield,
  FileText,
  Mail,
  Zap,
  DollarSign
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-slate-900/95 backdrop-blur border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Ammunition Vault
                </h3>
                <p className="text-xs text-slate-400">JIT Liquidity Protocol</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 max-w-xs">
              Revolutionary DeFi liquidity provision powered by flash loans and reactive smart contracts.
              Earn yield through automated JIT strategies.
            </p>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                v1.0.0
              </Badge>
              <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                Live on Mainnet
              </Badge>
            </div>
          </div>

          {/* Vault Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Vault</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/vault">
                <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Deposit & Withdraw
                </Button>
              </Link>
              <Link href="/strategies">
                <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white">
                  <Zap className="h-4 w-4 mr-2" />
                  JIT Strategies
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white">
                  Analytics
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white">
                  Transaction History
                </Button>
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Resources</h4>
            <nav className="flex flex-col space-y-2">
              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white" asChild>
                <a href="https://docs.ammunitionvault.xyz" target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentation
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>

              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white" asChild>
                <a href="https://github.com/ammunition-vault" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>

              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white" asChild>
                <a href="https://ammunitionvault.xyz/api" target="_blank" rel="noopener noreferrer">
                  API Reference
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>

              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white" asChild>
                <a href="mailto:support@ammunitionvault.xyz">
                  <Mail className="h-4 w-4 mr-2" />
                  Support
                </a>
              </Button>
            </nav>
          </div>

          {/* Community & Network */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Community</h4>
            <nav className="flex flex-col space-y-2">
              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white" asChild>
                <a href="https://twitter.com/ammunitionvault" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>

              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white" asChild>
                <a href="https://discord.gg/ammunitionvault" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Discord
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>

              <Button variant="ghost" size="sm" className="h-auto p-0 justify-start text-slate-400 hover:text-white" asChild>
                <a href="https://t.me/ammunitionvault" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Telegram
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </nav>

            <div className="pt-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Shield className="h-4 w-4" />
                <span>Deployed on Reactive Mainnet</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-800" asChild>
                  <a href="https://etherscan.io/address/YOUR_VAULT_ADDRESS" target="_blank" rel="noopener noreferrer">
                    View Contracts
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-slate-800" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-slate-400">
            <p>© {currentYear} Ammunition Vault. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <Link href="/privacy">
                <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-400 hover:text-white">
                  Privacy Policy
                </Button>
              </Link>
              <Link href="/terms">
                <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-400 hover:text-white">
                  Terms of Service
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-slate-400">
            <span>Built with</span>
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>for DeFi Innovation</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
