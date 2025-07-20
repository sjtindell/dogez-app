# Dogez Smart Contracts

Modern, secure smart contracts for the Dogez blockchain game built with Foundry.

## Overview

The Dogez ecosystem consists of two core contracts:

- **TreatzToken (TREATZ)**: ERC-20 game currency with minting controls
- **DogezNFT (DOGEZ)**: ERC-721 collectible dogs with game integration

## Contracts

### TreatzToken

A modern ERC-20 token with additional features:
- **Permit functionality** for gasless approvals
- **Burnable** for deflationary mechanics  
- **Minter controls** for game contract integration
- **Supply cap** at 1 billion tokens
- **Owner controls** for adding/removing authorized minters

### DogezNFT

An ERC-721 NFT contract with game-specific features:
- **ERC-721 Enumerable** for easy querying
- **URI storage** for metadata
- **Batch minting** for efficiency
- **Point tracking** to prevent duplicate mints
- **Minter controls** for game integration
- **Pausable minting** for emergency controls

## Installation

```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Clone and install dependencies
git clone <repository>
cd contracts
forge install
```

## Building

```bash
forge build
```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific test file
forge test --match-path test/TreatzToken.t.sol

# Run with verbosity
forge test -vvv
```

## Deployment

### Local Testing (Anvil)

```bash
# Start local blockchain
anvil

# Deploy to local network
forge script script/Deploy.s.sol:Deploy --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY --broadcast
```

### Testnet Deployment

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export RPC_URL=https://sepolia.infura.io/v3/your_project_id

# Deploy to Sepolia testnet
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

### Production Deployment

```bash
# Set environment variables for production
export PRIVATE_KEY=your_private_key
export RPC_URL=https://mainnet.infura.io/v3/your_project_id
export ETHERSCAN_API_KEY=your_etherscan_key

# Deploy to mainnet
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
```

## Configuration

The deployment script supports environment variable configuration:

```bash
# Contract ownership
export DEPLOYMENT_OWNER=0x...          # Owner address (defaults to deployer)

# Token configuration  
export INITIAL_TREATZ_SUPPLY=100000000  # Initial TREATZ supply (defaults to 100M)

# NFT configuration
export MAX_NFT_SUPPLY=1000000           # Max NFT supply (defaults to 1M)
export NFT_NAME="Dogez"                 # NFT collection name
export NFT_SYMBOL="DOGEZ"               # NFT symbol
export NFT_BASE_URI="https://api.dogez.app/metadata/"  # Base URI for metadata
```

## Contract Addresses

After deployment, contract addresses will be saved to `deployments-{chainId}.json`:

```json
{
  "network": "Sepolia",
  "chainId": 11155111,
  "timestamp": 1234567890,
  "deployer": "0x...",
  "contracts": {
    "TreatzToken": {
      "address": "0x...",
      "name": "Treatz",
      "symbol": "TREATZ"
    },
    "DogezNFT": {
      "address": "0x...",
      "name": "Dogez", 
      "symbol": "DOGEZ"
    }
  }
}
```

## Usage Examples

### Setting up game integration

```solidity
// Add game contract as minter for tokens
treatzToken.addMinter(gameContractAddress);

// Add game contract as minter for NFTs  
dogezNft.addMinter(gameContractAddress);
```

### Minting from game contracts

```solidity
// Mint tokens for player rewards
treatzToken.mint(playerAddress, 1000e18);

// Mint NFT for caught Dogez
dogezNft.mint(playerAddress, pointId, "metadata.json");
```

### Batch operations

```solidity
// Batch mint multiple NFTs
uint256[] memory pointIds = [1, 2, 3];
string[] memory uris = ["meta1.json", "meta2.json", "meta3.json"];
dogezNft.batchMint(playerAddress, pointIds, uris);
```

## Security Features

- **ReentrancyGuard** on sensitive functions
- **Access controls** for minting operations
- **Supply caps** to prevent inflation
- **Pausable contracts** for emergency stops
- **Comprehensive test coverage** (54 tests)

## Development

### Code Style

- Uses Solidity 0.8.23
- Follows modern best practices
- Comprehensive NatSpec documentation
- Custom errors for gas efficiency
- Events for all major state changes

### Testing

- Comprehensive unit tests
- Fuzz testing for edge cases
- Gas optimization testing
- Integration tests

## Gas Optimizations

- Custom errors instead of require strings
- Efficient storage patterns
- Batch operations where possible
- Optimized for common game operations

## Verification

Contracts can be verified on Etherscan automatically during deployment:

```bash
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
```

## License

MIT License - see LICENSE file for details. 