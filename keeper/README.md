# Realistic Keeper Simulation

A sophisticated keeper bot simulation for the Ammunition Vault DeFi protocol, featuring realistic strategy execution, comprehensive monitoring, and demo capabilities.

## Features

- **Realistic Strategy Simulation**: Simulates profitable DeFi strategies with configurable success rates
- **Comprehensive Monitoring**: Built-in logging, metrics tracking, and health monitoring
- **Dynamic Strategy Calculation**: Calculates optimal parameters based on market conditions
- **Demo Mode**: Pre-configured scenarios for testing and demonstration
- **Error Handling**: Robust error handling with retry logic and graceful degradation
- **Configuration Management**: Environment-based configuration with sensible defaults

## Quick Start

### Prerequisites

- Node.js 18+
- Running Anvil instance (for local testing)
- Deployed Ammunition Vault contracts

### Installation

```bash
cd contract/keeper
npm install
```

### Demo Mode

Run the keeper in demo mode to see simulated profitable strategies:

```bash
npm run demo
```

This will:
- Start the keeper with simulated market conditions
- Execute strategies with realistic profit scenarios
- Display comprehensive logging and metrics
- Show vault balance changes and strategy performance

### Production Mode

For production use with real contracts:

```bash
npm run keeper
```

## Configuration

The keeper supports configuration via environment variables:

- `KEEPER_MODE`: `demo` or `production` (default: `demo`)
- `KEEPER_LOG_LEVEL`: `error`, `warn`, `info`, `debug` (default: `info`)
- `KEEPER_STRATEGY_INTERVAL`: Strategy execution interval in seconds (default: `30`)
- `KEEPER_DEMO_SUCCESS_RATE`: Success rate for demo strategies (default: `0.8`)

## Architecture

### Core Components

- **RealisticKeeper**: Main keeper class with strategy execution and lifecycle management
- **StrategyCalculator**: Calculates optimal strategy parameters based on market conditions
- **KeeperMonitor**: Handles logging, metrics, and health monitoring
- **Config**: Configuration management with environment variable support

### Strategy Types

1. **JIT Liquidity**: Just-in-time liquidity provision with flash loans
2. **Arbitrage**: Cross-DEX arbitrage opportunities
3. **Yield Farming**: Automated yield farming strategies

## Monitoring

The keeper provides comprehensive monitoring:

- **Strategy Performance**: Success rates, profit/loss tracking
- **Health Metrics**: System health, error rates, response times
- **Market Conditions**: Price feeds, liquidity, volatility
- **Contract State**: Vault balances, positions, utilization

## Development

### Project Structure

```
contract/keeper/
├── config.ts              # Configuration management
├── monitoring.ts          # Monitoring and logging
├── improved-keeper.ts     # Main keeper implementation
├── demo.ts               # Demo script
├── strategies/
│   └── strategyCalculator.ts # Strategy calculation logic
└── README.md             # This file
```

### Adding New Strategies

1. Implement the strategy logic in `StrategyCalculator`
2. Add configuration options in `config.ts`
3. Update monitoring to track new metrics
4. Add demo scenarios for testing

### Testing

Run the TypeScript compiler to check for errors:

```bash
npx tsc --noEmit
```

## Troubleshooting

### Common Issues

1. **Contract Not Found**: Ensure contracts are deployed and addresses are correct
2. **Insufficient Balance**: Check vault has sufficient assets for strategies
3. **Network Issues**: Verify Anvil is running and accessible
4. **TypeScript Errors**: Run `npx tsc --noEmit` to identify issues

### Logs

Logs are written to console and can be configured via `KEEPER_LOG_LEVEL`. In demo mode, detailed execution logs are shown for transparency.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## License

ISC License - see package.json for details.
