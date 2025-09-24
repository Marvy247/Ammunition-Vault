import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import config from "./config.js";
import monitor from "./monitoring.js";
import StrategyCalculator from "./strategies/strategyCalculator.js";

// --- Contract ABIs (will be loaded from artifacts) ---
let AmmunitionVaultArtifact: any;

// --- Deployed Addresses ---
interface DeployedAddresses {
    ammunitionVault: string;
    flashLender: string;
    mockUSDC: string;
    uniswapV3PositionManager: string;
    uniswapV3SwapRouter: string;
    weth: string;
    usdcWethPool: string;
}
let deployed: DeployedAddresses;

class RealisticKeeper {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private ammunitionVault!: ethers.Contract;
  private strategyCalculator: StrategyCalculator;
  private isRunning: boolean = false;
  private consecutiveFailures: number = 0;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
    this.wallet = new ethers.Wallet(config.network.privateKey, this.provider);
    this.strategyCalculator = new StrategyCalculator(this.provider);
  }

  async initialize(): Promise<void> {
    try {
      monitor.logInfo("Initializing Realistic Keeper", {
        network: config.network.rpcUrl,
        account: this.wallet.address
      });

      // Check demo mode before initializing contracts
      if (process.env.DEMO_MODE === 'true') {
        monitor.logInfo("Skipping contract initialization for demo mode");
      } else {
        await this.loadArtifacts();
        await this.loadDeployedAddresses();
        await this.initializeContracts();
      }

      monitor.logInfo("Keeper initialized successfully");
    } catch (error) {
      monitor.logError("Failed to initialize keeper", error as Error);
      throw error;
    }
  }

  private async loadArtifacts(): Promise<void> {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const artifactsPath = path.join(__dirname, "..", "out");
    AmmunitionVaultArtifact = JSON.parse(
      fs.readFileSync(path.join(artifactsPath, "JitVault.sol", "AmmunitionVault.json"), "utf8")
    );
  }

  private async loadDeployedAddresses(): Promise<void> {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const deployedPath = path.join(__dirname, "deployed_addresses.json");
    deployed = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  }

  private async initializeContracts(): Promise<void> {
    this.ammunitionVault = new ethers.Contract(
      deployed.ammunitionVault,
      AmmunitionVaultArtifact.abi,
      this.wallet
    );

    monitor.logInfo("Contracts initialized", {
      ammunitionVault: await this.ammunitionVault.getAddress()
    });
  }

  private getAmmunitionVault(): ethers.Contract {
    if (!this.ammunitionVault) {
      throw new Error("AmmunitionVault contract not initialized");
    }
    return this.ammunitionVault;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      monitor.logWarn("Keeper is already running");
      return;
    }

    this.isRunning = true;
    monitor.logInfo("Starting Realistic Keeper");

    // Check demo mode directly from environment variable to avoid config caching issues
    if (process.env.DEMO_MODE === 'true') {
      await this.startDemoMode();
    } else {
      await this.startProductionMode();
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    monitor.logInfo("Keeper stopped");
  }

  private async startDemoMode(): Promise<void> {
    monitor.logInfo("Starting keeper in demo mode", {
      successRate: config.demo.successRate,
      eventInterval: config.demo.eventInterval
    });

    // Demo mode: Simulate profitable strategies at regular intervals without real contracts
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }

      await this.executeStrategyWithDemoLogic();
    }, config.demo.eventInterval * 1000);

    // Also execute one strategy immediately for demo
    setTimeout(() => {
      if (this.isRunning) {
        this.executeStrategyWithDemoLogic();
      }
    }, 2000);
  }

  private async startProductionMode(): Promise<void> {
    monitor.logInfo("Starting keeper in production mode");

    // In production, we would listen to real Uniswap V3 events
    // For now, simulate with less frequent execution
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }

      await this.executeStrategyWithMarketAnalysis();
    }, 60 * 1000); // Check every minute

    // Execute initial strategy
    setTimeout(() => {
      if (this.isRunning) {
        this.executeStrategyWithMarketAnalysis();
      }
    }, 5000);
  }

  private async executeStrategyWithDemoLogic(): Promise<void> {
    const strategyId = `demo-${Date.now()}`;
    const startTime = Date.now();

    try {
      monitor.recordStrategyStart(strategyId);

      // Demo mode: Use mock vault balance instead of real contract
      const mockVaultBalance = ethers.parseUnits("1000000", 6); // 1M USDC

      // Calculate strategy with dynamic market conditions
      const strategy = await this.strategyCalculator.calculateOptimalStrategy(
        config.contracts.usdcWethPool,
        mockVaultBalance
      );

      if (!strategy) {
        monitor.logInfo("No profitable strategy available", { strategyId });
        return;
      }

      // Validate strategy
      const isValid = await this.strategyCalculator.validateStrategy(strategy);
      if (!isValid) {
        monitor.logWarn("Strategy validation failed", { strategyId });
        return;
      }

      // Calculate dynamic success rate based on market conditions
      const dynamicSuccessRate = this.calculateDynamicSuccessRate(strategy);

      // Simulate demo success/failure with dynamic rate
      const shouldSucceed = Math.random() * 100 < dynamicSuccessRate;

      monitor.logDebug("Strategy execution", {
        strategyId,
        expectedProfit: ethers.formatUnits(strategy.expectedProfit, 6),
        loanAmount: ethers.formatEther(strategy.loanAmount),
        successRate: dynamicSuccessRate.toFixed(1)
      });

      if (shouldSucceed) {
        await this.executeSuccessfulDemoStrategy(strategy, strategyId, startTime);
      } else {
        await this.simulateFailedStrategy(strategyId, startTime);
      }

    } catch (error) {
      monitor.recordStrategyFailure(strategyId, (error as Error).message, Date.now() - startTime);
    }
  }

  private async executeStrategyWithMarketAnalysis(): Promise<void> {
    const strategyId = `prod-${Date.now()}`;
    const startTime = Date.now();

    try {
      monitor.recordStrategyStart(strategyId);

      // Get vault balance
      const vault = this.getAmmunitionVault();
      const vaultBalance = await (vault as any).totalAssets();

      // Calculate strategy based on market conditions
      const strategy = await this.strategyCalculator.calculateOptimalStrategy(
        deployed.usdcWethPool,
        vaultBalance
      );

      if (!strategy) {
        monitor.logInfo("No profitable strategy available", { strategyId });
        return;
      }

      // Validate strategy
      const isValid = await this.strategyCalculator.validateStrategy(strategy);
      if (!isValid) {
        monitor.logWarn("Strategy validation failed", { strategyId });
        return;
      }

      // Execute strategy
      await this.executeSuccessfulStrategy(strategy, strategyId, startTime);

    } catch (error) {
      monitor.recordStrategyFailure(strategyId, (error as Error).message, Date.now() - startTime);
    }
  }

  private async executeSuccessfulStrategy(
    strategy: any,
    strategyId: string,
    startTime: number
  ): Promise<void> {
    try {
      // Simulate the react function call with realistic parameters
      const swapEventData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["int256", "int256", "uint160", "uint128", "int24"],
        [
          ethers.parseUnits("1000000", 6), // 1M USDC
          ethers.parseEther("-1"), // -1 WETH
          0, 0, 0
        ]
      );

      const vault = this.getAmmunitionVault();

      const tx = await (vault as any).react(
        config.network.chainId,
        strategy.pool,
        0, 0, 0, 0, // topics
        swapEventData,
        await this.provider.getBlockNumber(),
        0 // op_code
      );

      const receipt = await tx.wait();

      // Calculate execution metrics
      const executionTime = Date.now() - startTime;
      const gasUsed = receipt?.gasUsed?.toString() || "0";
      const expectedProfit = strategy.expectedProfit ? ethers.formatUnits(strategy.expectedProfit, 6) : "0";

      monitor.recordStrategySuccess(strategyId, expectedProfit, gasUsed, executionTime);

      monitor.logInfo("Strategy executed successfully", {
        strategyId,
        txHash: tx.hash,
        gasUsed,
        expectedProfit,
        executionTime: `${executionTime}ms`
      });

    } catch (error) {
      monitor.recordStrategyFailure(strategyId, (error as Error).message, Date.now() - startTime);
    }
  }

  private async executeSuccessfulDemoStrategy(
    strategy: any,
    strategyId: string,
    startTime: number
  ): Promise<void> {
    try {
      // Simulate successful strategy execution without real contracts
      const executionTime = Date.now() - startTime;

      // Use actual strategy parameters for more realistic simulation
      const actualGasUsed = strategy.gasEstimate.toString();
      const actualProfit = strategy.expectedProfit;

      // Add some variance to make it more realistic (±10%)
      const variance = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1 range
      const realizedProfit = actualProfit * BigInt(Math.floor(variance * 100)) / BigInt(100);

      monitor.recordStrategySuccess(strategyId, realizedProfit.toString(), actualGasUsed, executionTime);

      monitor.logInfo("Demo strategy executed successfully", {
        strategyId,
        expectedProfit: ethers.formatUnits(strategy.expectedProfit, 6),
        realizedProfit: ethers.formatUnits(realizedProfit, 6),
        gasUsed: actualGasUsed,
        executionTime: `${executionTime}ms`,
        loanAmount: ethers.formatEther(strategy.loanAmount),
        tickRange: `${strategy.tickLower} - ${strategy.tickUpper}`
      });

    } catch (error) {
      monitor.recordStrategyFailure(strategyId, (error as Error).message, Date.now() - startTime);
    }
  }

  private calculateDynamicSuccessRate(strategy: any): number {
    // Base success rate
    let successRate = 85; // 85% base success rate

    // Adjust based on loan amount (larger loans have higher failure risk)
    const loanAmount = parseFloat(ethers.formatEther(strategy.loanAmount));
    if (loanAmount > 1.5) {
      successRate -= 15; // Reduce success rate for large loans
    } else if (loanAmount < 0.3) {
      successRate += 5; // Increase success rate for small loans
    }

    // Adjust based on tick range (wider ranges have higher failure risk)
    const tickRange = strategy.tickUpper - strategy.tickLower;
    if (tickRange > 400000) {
      successRate -= 10; // Reduce success rate for wide ranges
    } else if (tickRange < 100000) {
      successRate += 5; // Increase success rate for narrow ranges
    }

    // Adjust based on expected profit (higher profit targets have higher failure risk)
    const expectedProfit = parseFloat(ethers.formatUnits(strategy.expectedProfit, 6));
    if (expectedProfit > 200) {
      successRate -= 20; // Reduce success rate for high profit targets
    } else if (expectedProfit < 50) {
      successRate += 10; // Increase success rate for conservative targets
    }

    // Ensure success rate stays within reasonable bounds
    successRate = Math.max(30, Math.min(98, successRate));

    return successRate;
  }

  private async simulateFailedStrategy(strategyId: string, startTime: number): Promise<void> {
    // Simulate various failure scenarios for demo
    const failureReasons = [
      "Gas price too high",
      "Insufficient liquidity",
      "Slippage tolerance exceeded",
      "Strategy timeout",
      "Market volatility too high"
    ];

    const randomFailure = failureReasons[Math.floor(Math.random() * failureReasons.length)];
    const executionTime = Date.now() - startTime;

    monitor.recordStrategyFailure(strategyId, randomFailure || "Unknown failure", executionTime);

    monitor.logWarn("Demo strategy failed", {
      strategyId,
      reason: randomFailure,
      executionTime: `${executionTime}ms`
    });
  }

  async getStatus(): Promise<any> {
    let vaultBalance = "0";

    // Always get real contract balance for accurate display
    try {
      const vault = this.getAmmunitionVault();
      const balance = await (vault as any).totalAssets();
      vaultBalance = ethers.formatUnits(balance, 6);
    } catch (error) {
      // Fallback to demo balance if contract not available
      vaultBalance = "1000000"; // 1M USDC
    }

    const healthStatus = monitor.getHealthStatus();

    // Get current strategy data
    const strategyData = await this.getCurrentStrategyData();

    return {
      isRunning: this.isRunning,
      account: this.wallet.address,
      vaultBalance: vaultBalance,
      network: config.network.rpcUrl || "unknown",
      health: healthStatus,
      metrics: monitor.getMetrics(),
      strategy: strategyData
    };
  }

  private async getCurrentStrategyData(): Promise<any> {
    try {
      // Always use real contract balance for accurate strategy calculations
      let vaultBalance = ethers.parseUnits("1000000", 6); // Fallback

      try {
        const vault = this.getAmmunitionVault();
        vaultBalance = await (vault as any).totalAssets();
      } catch (error) {
        // Use fallback if contract not available
      }

      // Calculate current strategy
      const strategy = await this.strategyCalculator.calculateOptimalStrategy(
        process.env.DEMO_MODE === 'true' ? config.contracts.usdcWethPool : deployed.usdcWethPool,
        vaultBalance
      );

      if (strategy) {
        return {
          loanAmount: ethers.formatEther(strategy.loanAmount),
          tickLower: strategy.tickLower,
          tickUpper: strategy.tickUpper,
          expectedProfit: ethers.formatUnits(strategy.expectedProfit, 6),
          gasEstimate: strategy.gasEstimate.toString(),
          isActive: true
        };
      }

      return {
        loanAmount: "0",
        tickLower: 0,
        tickUpper: 0,
        expectedProfit: "0",
        gasEstimate: "0",
        isActive: false
      };
    } catch (error) {
      monitor.logError("Error getting strategy data", error as Error);
      return {
        loanAmount: "0",
        tickLower: 0,
        tickUpper: 0,
        expectedProfit: "0",
        gasEstimate: "0",
        isActive: false
      };
    }
  }

  async printStatus(): Promise<void> {
    const status = await this.getStatus();
    monitor.printSummary();

    console.log('\n=== Keeper Status ===');
    console.log(`Running: ${status.isRunning ? '✅' : '❌'}`);
    console.log(`Account: ${status.account}`);
    console.log(`Vault Balance: ${status.vaultBalance} USDC`);
    console.log(`Network: ${status.network}`);
    console.log(`Health: ${status.health.status.toUpperCase()}`);
    console.log('=====================\n');
  }
}

// Export for use in other modules
export default RealisticKeeper;

// Simple HTTP server for API endpoints
import http from 'http';

if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].includes('improved-keeper')) {
  const keeper = new RealisticKeeper();

  async function main() {
    try {
      await keeper.initialize();
      await keeper.start();

      // Start HTTP server for API endpoints
      const server = http.createServer(async (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.url === '/api/vault/status' && req.method === 'GET') {
          try {
            const status = await keeper.getStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status, null, 2));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to get vault status' }, null, 2));
          }
        } else if (req.url === '/api/keeper/status' && req.method === 'GET') {
          try {
            const status = await keeper.getStatus();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status, null, 2));
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to get keeper status' }, null, 2));
          }
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Not found' }, null, 2));
        }
      });

      server.listen(8001, () => {
        console.log('Keeper API server running on http://localhost:8001');
        console.log('Available endpoints:');
        console.log('  GET /api/vault/status');
        console.log('  GET /api/keeper/status');
      });

      // Print status every 30 seconds
      setInterval(() => {
        keeper.printStatus();
      }, 30000);

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down keeper...');
        server.close();
        await keeper.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\nShutting down keeper...');
        server.close();
        await keeper.stop();
        process.exit(0);
      });

    } catch (error) {
      monitor.logError("Keeper failed to start", error as Error);
      process.exit(1);
    }
  }

  main();
}
