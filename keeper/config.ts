import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface KeeperConfig {
  // Network Configuration
  network: {
    rpcUrl: string;
    chainId: number;
    privateKey: string;
  };

  // Contract Addresses
  contracts: {
    ammunitionVault: string;
    flashLender: string;
    mockUSDC: string;
    weth: string;
  };

  // Strategy Configuration
  strategy: {
    minSwapSize: string; // Minimum swap size to trigger strategy (in USDC)
    maxSlippage: number; // Maximum allowed slippage (basis points)
    profitThreshold: string; // Minimum profit threshold (in USDC)
    maxGasPrice: string; // Maximum gas price in gwei
    gasLimit: number; // Gas limit for transactions
  };

  // Risk Management
  risk: {
    maxLoanAmount: string; // Maximum loan amount per strategy
    minLiquidityRatio: number; // Minimum liquidity ratio to execute
    maxPositionDuration: number; // Maximum position duration in blocks
    circuitBreakerThreshold: number; // Number of failures before circuit breaker
  };

  // Monitoring
  monitoring: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    metricsInterval: number; // seconds
    healthCheckInterval: number; // seconds
  };

  // Demo Mode
  demo: {
    enabled: boolean;
    simulatedProfit: string; // Simulated profit for demo (USDC)
    successRate: number; // Success rate for demo (0-100)
    eventInterval: number; // Seconds between simulated events
  };
}

const config: KeeperConfig = {
  network: {
    rpcUrl: process.env.RPC_URL || "http://127.0.0.1:8545",
    chainId: parseInt(process.env.CHAIN_ID || "1"),
    privateKey: process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bac478cbed5237047088bb6d172970b"
  },

  contracts: {
    ammunitionVault: process.env.AMMUNITION_VAULT_ADDRESS || "",
    flashLender: process.env.FLASH_LENDER_ADDRESS || "",
    mockUSDC: process.env.MOCK_USDC_ADDRESS || "",
    weth: process.env.WETH_ADDRESS || ""
  },

  strategy: {
    minSwapSize: process.env.MIN_SWAP_SIZE || "1000000", // 1M USDC
    maxSlippage: parseInt(process.env.MAX_SLIPPAGE || "100"), // 1%
    profitThreshold: process.env.PROFIT_THRESHOLD || "100", // 100 USDC
    maxGasPrice: process.env.MAX_GAS_PRICE || "50", // 50 gwei
    gasLimit: parseInt(process.env.GAS_LIMIT || "500000")
  },

  risk: {
    maxLoanAmount: process.env.MAX_LOAN_AMOUNT || "10000000000000000000", // 10 WETH
    minLiquidityRatio: parseFloat(process.env.MIN_LIQUIDITY_RATIO || "0.1"), // 10%
    maxPositionDuration: parseInt(process.env.MAX_POSITION_DURATION || "100"), // 100 blocks
    circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || "5")
  },

  monitoring: {
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsInterval: parseInt(process.env.METRICS_INTERVAL || "60"),
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || "30")
  },

  demo: {
    enabled: process.env.DEMO_MODE === 'true',
    simulatedProfit: process.env.SIMULATED_PROFIT || "1000000", // 1M USDC
    successRate: parseFloat(process.env.SUCCESS_RATE || "65"), // 65% (more realistic for arbitrage)
    eventInterval: parseInt(process.env.EVENT_INTERVAL || "30") // 30 seconds
  }
};

export default config;
