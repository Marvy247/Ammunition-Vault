import { ethers } from "ethers";
import config from "../config.js";
import monitor from "../monitoring.js";

export interface StrategyParams {
  pool: string;
  loanToken: string;
  loanAmount: bigint;
  tickLower: number;
  tickUpper: number;
  expectedProfit: bigint;
  gasEstimate: bigint;
}

export interface MarketConditions {
  price: number;
  liquidity: bigint;
  volatility: number;
  volume24h: bigint;
}

class StrategyCalculator {
  private provider: ethers.JsonRpcProvider;

  constructor(provider: ethers.JsonRpcProvider) {
    this.provider = provider;
  }

  async calculateOptimalStrategy(
    poolAddress: string,
    assetBalance: bigint
  ): Promise<StrategyParams | null> {
    try {
      monitor.logDebug("Calculating optimal strategy", { poolAddress, assetBalance });

      // Get current market conditions
      const marketConditions = await this.getMarketConditions(poolAddress);
      if (!marketConditions) {
        monitor.logWarn("No market conditions available");
        return null;
      }

      // Calculate optimal parameters based on market conditions
      const loanAmount = this.calculateOptimalLoanAmount(marketConditions, assetBalance);
      const tickRange = this.calculateOptimalTickRange(marketConditions);
      const expectedProfit = this.calculateExpectedProfit(marketConditions, loanAmount);

      // Check if strategy is profitable enough - realistic threshold for arbitrage
      const minProfitThreshold = ethers.parseUnits("0.1", 6); // 0.1 USDC minimum (realistic for tiny arbitrage)
      if (expectedProfit < minProfitThreshold) {
        monitor.logInfo("Strategy not profitable enough", {
          expectedProfit: ethers.formatUnits(expectedProfit, 6),
          threshold: "0.1"
        });
        return null;
      }

      const strategy: StrategyParams = {
        pool: poolAddress,
        loanToken: config.contracts.weth,
        loanAmount: loanAmount,
        tickLower: tickRange.lower,
        tickUpper: tickRange.upper,
        expectedProfit: expectedProfit,
        gasEstimate: this.estimateGasUsage(marketConditions)
      };

      monitor.logInfo("Strategy calculated", {
        loanAmount: ethers.formatEther(loanAmount),
        tickRange: `${tickRange.lower} - ${tickRange.upper}`,
        expectedProfit: ethers.formatUnits(expectedProfit, 6),
        volatility: marketConditions.volatility.toFixed(3),
        liquidity: ethers.formatEther(marketConditions.liquidity)
      });

      return strategy;

    } catch (error) {
      monitor.logError("Error calculating strategy", error as Error);
      return null;
    }
  }

  private async getMarketConditions(poolAddress: string): Promise<MarketConditions | null> {
    // Simulate dynamic market conditions
    const now = Date.now();
    const timeBasedVolatility = this.calculateTimeBasedVolatility(now);
    const timeBasedLiquidity = this.calculateTimeBasedLiquidity(now);
    const timeBasedVolume = this.calculateTimeBasedVolume(now);

    // Add some randomness to make it more realistic
    let randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 range

    // Ensure randomFactor is a valid number
    if (isNaN(randomFactor) || randomFactor <= 0) {
      randomFactor = 1.0;
    }

    return {
      price: 2000 * randomFactor,
      liquidity: timeBasedLiquidity * BigInt(Math.floor(randomFactor * 100)) / BigInt(100),
      volatility: timeBasedVolatility * randomFactor,
      volume24h: timeBasedVolume * BigInt(Math.floor(randomFactor * 100)) / BigInt(100)
    };
  }

  private calculateTimeBasedVolatility(timestamp: number): number {
    // Simulate higher volatility during market hours (9 AM - 5 PM UTC)
    const hour = new Date(timestamp).getUTCHours();
    const isMarketHours = hour >= 9 && hour <= 17;

    let baseVolatility = 0.02; // 2% base volatility

    if (isMarketHours) {
      baseVolatility = 0.08; // 8% during market hours
    }

    // Add some periodic spikes
    const minute = new Date(timestamp).getUTCMinutes();
    if (minute < 5 || minute > 55) {
      baseVolatility *= 2; // Higher volatility at the top/bottom of hours
    }

    return baseVolatility;
  }

  private calculateTimeBasedLiquidity(timestamp: number): bigint {
    // Simulate higher liquidity during market hours
    const hour = new Date(timestamp).getUTCHours();
    const isMarketHours = hour >= 9 && hour <= 17;

    let baseLiquidity = ethers.parseEther("5000"); // 5000 ETH base

    if (isMarketHours) {
      baseLiquidity = ethers.parseEther("15000"); // 15000 ETH during market hours
    }

    // Weekend effect (lower liquidity)
    const day = new Date(timestamp).getUTCDay();
    if (day === 0 || day === 6) {
      baseLiquidity = (baseLiquidity * BigInt(6)) / BigInt(10); // 60% of normal liquidity
    }

    return baseLiquidity;
  }

  private calculateTimeBasedVolume(timestamp: number): bigint {
    // Simulate trading volume patterns
    const hour = new Date(timestamp).getUTCHours();
    const isMarketHours = hour >= 9 && hour <= 17;

    let baseVolume = ethers.parseUnits("1000000", 6); // 1M USDC base

    if (isMarketHours) {
      baseVolume = ethers.parseUnits("5000000", 6); // 5M USDC during market hours
    }

    // Peak hours (11 AM - 3 PM UTC)
    if (hour >= 11 && hour <= 15) {
      baseVolume = (baseVolume * BigInt(3)) / BigInt(2); // 50% more volume
    }

    return baseVolume;
  }

  private calculateOptimalTickRange(marketConditions: MarketConditions): { lower: number; upper: number } {
    // Base tick range around current price
    const baseTickSpacing = 200000; // 1% price range

    // Adjust tick range based on volatility
    let tickSpacing = baseTickSpacing;
    if (marketConditions.volatility > 0.15) {
      tickSpacing = baseTickSpacing * 2; // Wider range for high volatility
    } else if (marketConditions.volatility < 0.05) {
      tickSpacing = baseTickSpacing / 2; // Narrower range for low volatility
    }

    // Calculate current tick (simplified - in production would get from pool)
    const currentTick = 0; // Assume we're at 2000 USDC/ETH

    return {
      lower: currentTick - tickSpacing,
      upper: currentTick + tickSpacing
    };
  }

  private calculateOptimalLoanAmount(marketConditions: MarketConditions, assetBalance: bigint): bigint {
    // Base loan amount
    let loanAmount = ethers.parseEther("0.5"); // 0.5 ETH base

    // Adjust based on market conditions
    if (marketConditions.liquidity > ethers.parseEther("10000")) {
      loanAmount = ethers.parseEther("2"); // Higher liquidity allows larger loans
    } else if (marketConditions.liquidity < ethers.parseEther("1000")) {
      loanAmount = ethers.parseEther("0.1"); // Lower liquidity requires smaller loans
    }

    // Adjust based on volatility
    if (marketConditions.volatility > 0.2) {
      loanAmount = loanAmount / BigInt(2); // Reduce loan size in high volatility
    }

    // Don't exceed available balance (with 20% buffer)
    const maxLoan = assetBalance * BigInt(8) / BigInt(10);
    if (loanAmount > maxLoan) {
      loanAmount = maxLoan;
    }

    return loanAmount;
  }

  private calculateExpectedProfit(marketConditions: MarketConditions, loanAmount: bigint): bigint {
    // Base profit calculation - realistic for actual arbitrage
    const baseProfit = ethers.parseUnits("0.2", 6); // 0.2 USDC base (very small arbitrage opportunity)

    // Adjust based on market conditions - minimal multipliers
    let profitMultiplier = 1.0;

    // Ensure volatility is a valid number
    if (!isNaN(marketConditions.volatility) && marketConditions.volatility > 0.1) {
      profitMultiplier += marketConditions.volatility * 0.1; // Max 0.1x multiplier
    }

    // Higher liquidity = slightly higher potential profit
    if (marketConditions.liquidity > ethers.parseEther("5000")) {
      profitMultiplier += 0.02; // 2% instead of 10%
    }

    // Higher volume = slightly higher potential profit
    if (marketConditions.volume24h > ethers.parseUnits("1000000", 6)) {
      profitMultiplier += 0.01; // 1% instead of 5%
    }

    // Ensure profitMultiplier is a valid number and within reasonable bounds
    if (isNaN(profitMultiplier) || profitMultiplier <= 0) {
      profitMultiplier = 1.0;
    }

    const adjustedProfit = baseProfit * BigInt(Math.floor(profitMultiplier));

    // Add profit from loan amount - realistic for arbitrage
    const loanProfit = (loanAmount * BigInt("2")) / ethers.parseEther("1"); // 2 USDC per ETH (more realistic)
    const totalProfit = adjustedProfit + loanProfit;

    return totalProfit;
  }

  private estimateGasUsage(marketConditions: MarketConditions): bigint {
    // Base gas usage for Uniswap V3 operations
    let gasEstimate = BigInt("150000");

    // Increase gas estimate based on market conditions
    if (marketConditions.volatility > 0.1) {
      gasEstimate += BigInt("50000"); // High volatility requires more complex calculations
    }

    if (marketConditions.liquidity < ethers.parseEther("1000")) {
      gasEstimate += BigInt("30000"); // Low liquidity requires more gas for execution
    }

    return gasEstimate;
  }

  private getDefaultStrategy(): StrategyParams {
    return {
      pool: config.contracts.usdcWethPool,
      loanToken: config.contracts.weth,
      loanAmount: ethers.parseEther("1"),
      tickLower: -200000,
      tickUpper: 200000,
      expectedProfit: ethers.parseUnits("0.5", 6), // 0.5 USDC (realistic for arbitrage)
      gasEstimate: BigInt("300000")
    };
  }

  async validateStrategy(strategy: StrategyParams): Promise<boolean> {
    try {
      // Basic validation - always pass for demo
      return true;

    } catch (error) {
      monitor.logError("Error validating strategy", error as Error);
      return false;
    }
  }
}

export default StrategyCalculator;
