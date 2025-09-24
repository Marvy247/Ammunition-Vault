# Ammunition Vault

A decentralized finance (DeFi) project featuring Reactive smart contracts for flash lending and vault management, built on Ethereum-compatible networks.

## Features

- **Flash Lending**: Secure and efficient flash loan functionality
- **Vault Management**:Marvy247/Ammunition-Vault AmmunitionVault for asset storage and management
- **Mock ERC20 Token**: For testing and development purposes
- **Keeper Service**: Automated monitoring and maintenance scripts
- **Web Frontend**: User-friendly interface built with Next.js

## Project Structure

```
/
├── contract/           # Solidity smart contracts (Foundry)
├── frontend/           # Next.js web application
├── keeper/             # TypeScript keeper service
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## Setup and Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Foundry (for smart contracts)

### Smart Contracts (contract/)

1. Navigate to the contract directory:
   ```bash
   cd contract
   ```

2. Install dependencies:
   ```bash
   forge install
   ```

3. Build the contracts:
   ```bash
   forge build
   ```

4. Run tests:
   ```bash
   forge test
   ```

### Frontend (frontend/)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Keeper Service (keeper/)

1. Navigate to the keeper directory:
   ```bash
   cd keeper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (create `.env` file if needed)

4. Run the keeper service:
   ```bash
   npm start
   ```

## Usage

### Deployed Contracts

- **MockERC20 (asset)**: `0x941187A0A47CEeC2fCE06AF8f19A44335339E989`
- **FlashLender**: `0x8670a8390c8d58883CFD009AaaD928faFfa18e33`
- **AmmunitionVault**: `0xa965aFC08A95038aC92e5eC6590d3508CE1b6ACD`

### Development

1. Make sure all components are set up as described above
2. Use the frontend to interact with the contracts
3. Monitor the keeper service logs for automated operations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please open an issue in the repository.
