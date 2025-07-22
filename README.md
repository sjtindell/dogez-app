# Dogez

Pokemon-Go for NFTs. An AR game with unique animals to catch from different collections on a real-world map.

Players open a map on their device, find Dogez, and collect them. The Dogez are unique NFTs on an EVM blockchain. These NFTs can be collected, traded, staked, or used in mini-games within the app.

## Stack

- **Frontend**: Next.js / React, Leaflet.js (map), wagmi / WalletConnect
- **Contracts**: Solidity / Foundry (TreatzToken ERC-20, DogezNFT ERC-721, staking)
- **Storage**: IPFS (NFT metadata/images), SQLite (point locations)
- **Infrastructure**: Docker, Nginx, EC2, Terraform

## Project Structure

```
dogez/
├── contracts/          # Solidity smart contracts (Foundry)
│   ├── src/            # TreatzToken.sol, DogezNFT.sol
│   ├── test/           # Foundry tests
│   └── script/         # Deployment scripts
├── dogez-app/          # Next.js frontend
│   ├── src/pages/      # Map, Collect, Stake, Play, FAQ
│   ├── src/components/ # Map, Navbar
│   └── src/contracts/  # Contract ABIs and helpers
└── deploy/             # Infrastructure (Terraform, Docker, Nginx)
```

## Routes

```
/               landing
/map            map
/stake          staking
/play           dogepark
/collection     dogehouse, collection, cosmetics
/marketplace    buy new dogehouse, upgrade your doge with cosmetics
```

## Local Development

```bash
# Install dependencies
cd dogez-app && npm install
cd contracts && forge install

# Set up environment
cp dogez-app/.env.example dogez-app/.env.local

# Start local blockchain
anvil --prune-history --steps-tracing --host 0.0.0.0

# Deploy contracts
./deploy/contracts.sh http://localhost:8545

# Start IPFS
ipfs daemon --offline

# Start the app
cd dogez-app && npm run dev
```

## Game Mechanics

Dogez are caught by spending a crypto token, Treatz. Spending Treatz gives you a percent chance to catch a Doge.

Treatz are acquired by buying them from a liquidity pool, staking Dogez, or by playing mini-games and earning them.

Players can also find cosmetics and combine them with their Dogez to build new and unique NFTs.

## NFT Rarity Tiers

- Basic Dogez - Common
- Job Dogez - Uncommon (cashier, construction, doctor, mechanic, etc.)
- City Park / Beach / Mountain Dogez - Uncommon
- National/State Park Dogez - Rare
- Crypto Dogez - Epic
- Trader Dogez - Epic
- Hacker Dogez - Legendary
- Golden Dogez - Gold

## Tokenomics

Token: Treatz (TRTZ), ERC-20, 1 billion supply

**In-Game Costs** (Common, Uncommon, Rare, Epic, Legendary):
- Catch doge: [100, 200, 300, 400, 500]
- Reveal cosmetic: [50, 100, 150, 200, 250]
- Mint doge: 500

**Staking Payouts** (trt/24hr):
- Base Doge: 2
- Base Doge + Common cosmetics: 4-8
- Base Doge + Uncommon cosmetics: 6-10
- Base Doge + Rare cosmetics: 8-12
- Base Doge + Epic cosmetics: 12-16
- Base Doge + Legendary cosmetics: 14-18

**Token Allocation**:
- 25% Staking Rewards
- 25% Play to Earn
- 20% Operations
- 10% ICO Public Sale
- 10% Team & Advisors
- 5% Early Backers & Seed Investors
- 5% Marketing & Partnerships

## Themed Drops

- Cartel themed dogez in Sinaloa
- Antarctic dogez
- Bay Area Mac Dre themed dogez
- New York finance dogez
- Miami tech/Cuban dogez
- Austin tech dogez
- Colorado mountain dogez
- Dogitas - family themed dogez

## TODO

- [ ] Rewrite the app as a mobile app: Map, Collect, NFT with Royalties
- [ ] Create a landing page with waitlist
- [ ] Review contracts for security
- [ ] Add Foundry tests, deployment scripts, Github workflows
- [ ] Add a marketplace to buy/sell Dogez and cosmetics
- [ ] Add batch stake/withdraw for many dogez
- [ ] Generate new Dogez map every N hours
- [ ] Populate dogez on mostly land, integrate OSM tile types
- [ ] Convert to TypeScript, add ESLint
