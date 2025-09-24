interface VaultStatus {
  isRunning: boolean;
  account: string;
  vaultBalance: string;
  network: string;
  health: {
    status: string;
    uptime: string;
    totalStrategies: number;
    successRate: number;
    totalProfit: string;
    totalGasUsed: string;
    averageExecutionTime: string;
    circuitBreaker: string;
  };
  metrics: {
    totalStrategies: number;
    successfulStrategies: number;
    failedStrategies: number;
    totalProfit: string;
    totalGasUsed: string;
    averageExecutionTime: number;
    successRate: number;
  };
  strategy: {
    loanAmount: string;
    tickLower: number;
    tickUpper: number;
    expectedProfit: string;
    gasEstimate: string;
    isActive: boolean;
  };
}

export const fetchVaultStatus = async (): Promise<VaultStatus | null> => {
  try {
    const response = await fetch('http://localhost:8001/api/vault/status');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch vault status:', error);
    return null;
  }
};

export const fetchKeeperStatus = async (): Promise<VaultStatus | null> => {
  try {
    const response = await fetch('http://localhost:8001/api/keeper/status');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch keeper status:', error);
    return null;
  }
};
