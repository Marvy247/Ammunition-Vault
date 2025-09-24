'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient, useWatchContractEvent } from 'wagmi';
import { parseUnits, formatUnits, decodeEventLog } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { getAmmunitionVaultContract, getMockUSDCContract, getDeployedAddresses } from '@/lib/contracts';
import { fetchVaultStatus } from '@/lib/keeper-api';
import { toast } from 'react-hot-toast';
import { TrendingUp, Shield, Zap, DollarSign, Activity, Users, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActivityLogEntry {
  timestamp: string;
  message: string;
}

interface KeeperData {
  vaultBalance?: string;
  metrics?: {
    totalStrategies?: number;
    successRate?: number;
    totalProfit?: string;
  };
  strategy?: {
    isActive?: boolean;
    loanAmount?: string;
    tickLower?: number;
    tickUpper?: number;
    expectedProfit?: string;
    gasEstimate?: string;
  };
  isRunning?: boolean;
  health?: {
    status?: string;
  };
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [keeperData, setKeeperData] = useState<KeeperData | null>(null);
  const [isLoadingKeeper, setIsLoadingKeeper] = useState(true);

  const deployedAddresses = useMemo(() => getDeployedAddresses(), []);

  // Memoize contract instances with the publicClient
  const ammunitionVaultContract = useMemo(() => publicClient ? getAmmunitionVaultContract(publicClient) : undefined, [publicClient]);
  const mockUSDCContract = useMemo(() => publicClient ? getMockUSDCContract(publicClient) : undefined, [publicClient]);

  // Read Vault Data
  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: ammunitionVaultContract?.address,
    abi: ammunitionVaultContract?.abi,
    functionName: 'totalAssets',
    query: {
      enabled: !!ammunitionVaultContract,
    },
  });

  const { data: totalShares, refetch: refetchTotalShares } = useReadContract({
    address: ammunitionVaultContract?.address,
    abi: ammunitionVaultContract?.abi,
    functionName: 'totalShares',
    query: {
      enabled: !!ammunitionVaultContract,
    },
  });

  const { data: userShares, refetch: refetchUserShares } = useReadContract({
    address: ammunitionVaultContract?.address,
    abi: ammunitionVaultContract?.abi,
    functionName: 'shares',
    args: [address!],
    query: {
      enabled: isConnected && !!address && !!ammunitionVaultContract,
    },
  });

  // Deposit Functionality
  const { writeContractAsync: approveWrite } = useWriteContract();
  const { writeContractAsync: depositWrite } = useWriteContract();

  const handleDeposit = async () => {
    if (!address || !depositAmount || !mockUSDCContract || !ammunitionVaultContract) return;
    const amount = parseUnits(depositAmount, 6); // USDC has 6 decimals

    try {
      toast.loading('Approving USDC...');
      const approveHash = await approveWrite({
        address: mockUSDCContract.address,
        abi: mockUSDCContract.abi,
        functionName: 'approve',
        args: [ammunitionVaultContract.address, amount],
      });
      if (!publicClient) {
        throw new Error("Public client not available.");
      }
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      toast.dismiss();
      toast.success('USDC Approved!');

      toast.loading('Depositing into Vault...');
      const depositHash = await depositWrite({
        address: ammunitionVaultContract.address,
        abi: ammunitionVaultContract.abi,
        functionName: 'deposit',
        args: [amount],
      });
      if (!publicClient) {
        throw new Error("Public client not available.");
      }
      await publicClient.waitForTransactionReceipt({ hash: depositHash });
      toast.dismiss();
      toast.success('Deposit successful!');
      setDepositAmount('');
      refetchTotalAssets();
      refetchUserShares();
      logActivity(`Deposited ${depositAmount} USDC.`);
    } catch (error: unknown) {
      toast.dismiss();
      toast.error(`Deposit failed: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Deposit error:", error);
    }
  };

  // Withdraw Functionality
  const { writeContractAsync: withdrawWrite } = useWriteContract();

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount || !ammunitionVaultContract) return;
    const amount = parseUnits(withdrawAmount, 6); // Shares are in USDC decimals

    try {
      toast.loading('Withdrawing from Vault...');
      const withdrawHash = await withdrawWrite({
        address: ammunitionVaultContract.address,
        abi: ammunitionVaultContract.abi,
        functionName: 'withdraw',
        args: [amount],
      });
      if (!publicClient) {
        throw new Error("Public client not available.");
      }
      await publicClient.waitForTransactionReceipt({ hash: withdrawHash });
      toast.dismiss();
      toast.success('Withdrawal successful!');
      setWithdrawAmount('');
      refetchTotalAssets();
      refetchUserShares();
      logActivity(`Withdrew ${withdrawAmount} USDC.`);
    } catch (error: unknown) {
      toast.dismiss();
      toast.error(`Withdrawal failed: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Withdrawal error:", error);
    }
  };



  // Fetch keeper data
  useEffect(() => {
    const fetchKeeperData = async () => {
      setIsLoadingKeeper(true);
      try {
        const data = await fetchVaultStatus();
        setKeeperData(data);
      } catch (error) {
        console.error('Failed to fetch keeper data:', error);
      } finally {
        setIsLoadingKeeper(false);
      }
    };

    fetchKeeperData();

    // Set up polling every 15 seconds for more realistic updates
    const interval = setInterval(fetchKeeperData, 15000);

    return () => clearInterval(interval);
  }, []);

  // Activity Logging
  const logActivity = (message: string) => {
    setActivityLog((prev) => [
      { timestamp: new Date().toLocaleTimeString(), message },
      ...prev,
    ]);
  };

  // Listen for JitStrategyExecuted events
  useWatchContractEvent({
    address: ammunitionVaultContract?.address,
    abi: ammunitionVaultContract?.abi,
    eventName: 'JitStrategyExecuted',
    onLogs: (logs) => {
      logs.forEach((log) => {
        try {
          if (!ammunitionVaultContract) return;
          const decodedLog = decodeEventLog({
            abi: ammunitionVaultContract.abi,
            data: log.data,
            topics: log.topics,
          });
          if (decodedLog.eventName === 'JitStrategyExecuted' && decodedLog.args && 'profit' in decodedLog.args) {
            const profit = formatUnits(decodedLog.args.profit as bigint, 6);
            logActivity(`🎯 JIT Strategy Executed! Vault earned ${profit} USDC.`);
            refetchTotalAssets();
            refetchUserShares();
          }
        } catch (error: unknown) {
          console.error("Error decoding log:", error);
        }
      });
    },
    enabled: !!ammunitionVaultContract,
  });

  // Helper to format numbers for display
  const formatNumber = (value: bigint | undefined, decimals: number = 6) => {
    if (value === undefined) return '0';
    return Number(formatUnits(value, decimals)).toLocaleString();
  };

  // Helper to format string numbers with commas
  const formatNumberWithCommas = (value: string | undefined) => {
    if (!value || value === '0') return '0';
    const num = parseFloat(value);
    return num.toLocaleString();
  };

  // Calculate user's share percentage
  const userSharePercentage = useMemo(() => {
    if (userShares === undefined || totalShares === undefined || totalShares === 0n) return 0;
    const userSharesBigInt = typeof userShares === 'bigint' ? userShares : 0n;
    const totalSharesBigInt = typeof totalShares === 'bigint' ? totalShares : 0n;

    if (totalSharesBigInt === 0n) return 0; // Re-check after ensuring they are bigints

    return (Number(formatUnits(userSharesBigInt, 6)) / Number(formatUnits(totalSharesBigInt, 6))) * 100;
  }, [userShares, totalShares]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Ammunition Vault</h1>
          <p className="text-xl">
            Just-In-Time Liquidity Provision Protocol
          </p>
          <div className="mt-4">
          </div>
        </div>

        {!isConnected ? (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Connect Wallet</CardTitle>
              <CardDescription>Please connect your wallet to interact with the vault.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Overview */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${isLoadingKeeper ? 'Loading...' : formatNumberWithCommas(keeperData?.vaultBalance)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Strategies</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingKeeper ? 'Loading...' : keeperData?.metrics?.totalStrategies || '0'}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingKeeper ? 'Loading...' : `${keeperData?.metrics?.successRate?.toFixed(1) || '0'}%`}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Profit</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingKeeper ? 'Loading...' : formatNumberWithCommas(keeperData?.metrics?.totalProfit)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Loan Amount</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingKeeper ? 'Loading...' : keeperData?.strategy?.isActive ? `${keeperData?.strategy?.loanAmount} ETH` : '0 ETH'}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tick Range</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoadingKeeper ? 'Loading...' : keeperData?.strategy?.isActive ? `${keeperData?.strategy?.tickLower} - ${keeperData?.strategy?.tickUpper}` : '0 - 0'}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            {/* Main Content */}
            <div className="md:col-span-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Manage Funds
                  </CardTitle>
                  <CardDescription>Deposit or withdraw USDC from the vault.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="deposit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted">
                      <TabsTrigger value="deposit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Deposit</TabsTrigger>
                      <TabsTrigger value="withdraw" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Withdraw</TabsTrigger>
                    </TabsList>
                    <TabsContent value="deposit" className="space-y-4 p-2">
                      <Label htmlFor="deposit-amount">Amount (USDC)</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="1000"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                      />
                      <Button
                        onClick={handleDeposit}
                        disabled={!depositAmount || !isConnected}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-primary-foreground"
                      >
                        Deposit USDC
                      </Button>
                    </TabsContent>
                    <TabsContent value="withdraw" className="space-y-4 p-2">
                      <Label htmlFor="withdraw-amount">Amount (USDC)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="1000"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                      <Button
                        onClick={handleWithdraw}
                        disabled={!withdrawAmount || !isConnected}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-primary-foreground"
                      >
                        Withdraw USDC
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>

              </Card>

              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-foreground">Vault Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asset Token:</span>
                    <Badge variant="outline" className="text-primary border-primary">
                      USDC
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vault Balance:</span>
                    <span className="text-foreground font-mono">
                      {isLoadingKeeper ? 'Loading...' : formatNumberWithCommas(keeperData?.vaultBalance)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Keeper Status:</span>
                    <Badge className={keeperData?.isRunning ? "bg-green-600 text-primary-foreground" : "bg-red-600 text-primary-foreground"}>
                      {keeperData?.isRunning ? 'Running' : 'Stopped'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Health Status:</span>
                    <Badge className={keeperData?.health?.status === 'HEALTHY' ? "bg-green-600 text-primary-foreground" : "bg-yellow-600 text-primary-foreground"}>
                      {keeperData?.health?.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Profit:</span>
                    <span className="text-foreground font-mono">
                      {isLoadingKeeper ? 'Loading...' : formatNumberWithCommas(keeperData?.metrics?.totalProfit)} USDC
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loan Amount:</span>
                    <span className="text-foreground font-mono">
                      {isLoadingKeeper ? 'Loading...' : keeperData?.strategy?.isActive ? `${keeperData?.strategy?.loanAmount} ETH` : '0 ETH'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tick Range:</span>
                    <span className="text-foreground font-mono">
                      {isLoadingKeeper ? 'Loading...' : keeperData?.strategy?.isActive ? `${keeperData?.strategy?.tickLower} - ${keeperData?.strategy?.tickUpper}` : '0 - 0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Profit:</span>
                    <span className="text-foreground font-mono">
                      {isLoadingKeeper ? 'Loading...' : keeperData?.strategy?.isActive ? `${keeperData?.strategy?.expectedProfit} USDC` : '0 USDC'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gas Estimate:</span>
                    <span className="text-foreground font-mono">
                      {isLoadingKeeper ? 'Loading...' : keeperData?.strategy?.isActive ? `${keeperData?.strategy?.gasEstimate}` : '0'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-muted-foreground">Strategy Status:</span>
                    <Badge className={keeperData?.strategy?.isActive ? "bg-green-600 text-primary-foreground" : "bg-yellow-600 text-primary-foreground"}>
                      {keeperData?.strategy?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle className="text-foreground">Active Strategies</CardTitle>
                <CardDescription>Current arbitrage strategies and their parameters.</CardDescription>
              </CardHeader>
              <CardContent>
                {keeperData?.strategy?.isActive ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pool:</span>
                        <span className="text-foreground font-mono">USDC-WETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loan Token:</span>
                        <span className="text-foreground font-mono">WETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loan Amount:</span>
                        <span className="text-foreground font-mono">{keeperData?.strategy?.loanAmount} ETH</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tick Range:</span>
                        <span className="text-foreground font-mono">{keeperData?.strategy?.tickLower} - {keeperData?.strategy?.tickUpper}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Profit:</span>
                        <span className="text-foreground font-mono text-green-400">{keeperData?.strategy?.expectedProfit} USDC</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gas Estimate:</span>
                        <span className="text-foreground font-mono">{keeperData?.strategy?.gasEstimate}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No active strategies. The system will automatically calculate optimal strategies based on market conditions.</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle className="text-foreground">Activity Log</CardTitle>
                <CardDescription>Recent vault activities.</CardDescription>
              </CardHeader>
              <CardContent>
                <div >
                  {activityLog.length === 0 ? (
                    <p className="text-muted-foreground">No activity yet.</p>
                  ) : (
                    activityLog.map((entry, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        <span className="font-mono text-gray-500">[{entry.timestamp}]</span> {entry.message}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
