
type KeeperData = {
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
};

type ResponseData = KeeperData & {
  totalAssets?: bigint;
  userShares?: bigint;
  totalShares?: bigint;
};

export const promptSuggestions = [
  'What is the current vault balance?',
  'Summarize the latest strategy performance.',
  'How much profit has the vault generated?',
  'Explain the keeper status.',
];

export const responses = {
  greetings: [
    "Hello! I'm your AI Analytics Assistant for the Ammunition Vault. I can help you analyze vault performance, strategies, and provide insights. What would you like to know?",
    "Hi there! Your go-to AI for all things Ammunition Vault. Ask me anything about performance, strategies, or profits.",
    "Welcome! I'm here to provide real-time analytics and insights into the Ammunition Vault. How can I assist you today?",
  ],
  fallback: [
    "That's an interesting question. Let me analyze the current vault data... The metrics look solid with steady performance.",
    "Based on the latest data, everything appears to be operating within optimal parameters. Is there a specific aspect you'd like me to dive deeper into?",
    "I don't have specific information on that, but I can tell you about vault assets, strategies, or profits. What would you like to know?",
    "Great question! From what I can see, the vault is performing well with active monitoring for arbitrage opportunities.",
    "I'm still learning about more complex queries. For now, I can provide details on vault performance, strategies, and overall profit. How can I help with those?",
  ],
  topics: {
    vault: {
      keywords: ['vault', 'balance', 'assets', 'liquidity'],
      getResponse: (data: ResponseData) => {
        const balance = data?.vaultBalance || '0';
        const assets = data?.totalAssets ? Number(data.totalAssets) / 1e6 : 0;
        const userShare = (data?.userShares && data?.totalShares && data.totalShares > 0n) ? ((Number(data.userShares) / Number(data.totalShares)) * 100).toFixed(2) : '0';

        return [
          `The vault currently holds approximately $${balance} in total assets. This represents a healthy liquidity pool for our JIT (Just-in-Time) strategies.`,
          `Your current share of the vault is ${userShare}%.`,
          `With ${assets.toFixed(2)} USDC in assets, the vault is well-positioned to capitalize on market movements.`,
        ].join(' ');
      },
    },
    strategy: {
      keywords: ['strategy', 'strategies', 'tick', 'loan'],
      getResponse: (data: ResponseData) => {
        const totalStrategies = data?.metrics?.totalStrategies || 0;
        const successRate = data?.metrics?.successRate || 0;
        const isActive = data?.strategy?.isActive;

        if (isActive) {
          return `We've executed ${totalStrategies} strategies with a ${successRate.toFixed(1)}% success rate. Currently, there's an active strategy with a loan of ${data?.strategy?.loanAmount} ETH in the tick range ${data?.strategy?.tickLower} - ${data?.strategy?.tickUpper}, expecting a profit of ${data?.strategy?.expectedProfit} USDC.`;
        }
        return `We've executed ${totalStrategies} strategies with a ${successRate.toFixed(1)}% success rate. No active strategy at the moment, but the system is continuously monitoring for optimal opportunities.`;
      },
    },
    profit: {
      keywords: ['profit', 'earnings', 'performance', 'revenue'],
      getResponse: (data: ResponseData) => {
        const totalProfit = data?.metrics?.totalProfit || '0';
        return `The vault has generated a total profit of $${totalProfit} USDC across all strategies. This strong performance indicates effective arbitrage opportunities in the USDC-WETH pool. Recent JIT executions have been particularly profitable.`;
      },
    },
    depositWithdraw: {
      keywords: ['deposit', 'withdraw', 'funds'],
      getResponse: () => {
        return `You can deposit or withdraw USDC directly from the vault interface above. Deposits increase your share of the vault's profits, while withdrawals are processed instantly. Make sure your wallet is connected for seamless transactions.`;
      },
    },
    keeper: {
      keywords: ['keeper', 'status', 'health', 'monitoring'],
      getResponse: (data: ResponseData) => {
        const isRunning = data?.isRunning;
        const health = data?.health?.status;
        return `The keeper service is currently ${isRunning ? 'running' : 'stopped'} with a health status of '${health || 'unknown'}'. It's continuously monitoring market conditions to execute profitable JIT strategies. A status of 'healthy' means it's operating as expected.`;
      },
    },
    help: {
      keywords: ['help', 'what can you do', 'support', 'assistance'],
      getResponse: () => {
        return `I can provide real-time analytics on:
- Vault Performance (balance, assets, liquidity)
- Strategy Execution (active strategies, success rates)
- Profit Tracking (total profit, performance metrics)
- Keeper Status (health, activity)
- General guidance on depositing/withdrawing funds.

Feel free to ask me anything about these topics!`;
      },
    },
  },
};
