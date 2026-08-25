# Pixel Manager contracts (Foundry)

Web3 Step 3+: `PlayerNFT` (ERC-721) — star players whose immutable base stats the
game server reads to build squads. Chain: Base Sepolia (testnet first).

## Setup
```
curl -L https://foundry.paradigm.xyz | bash && foundryup   # once
forge install OpenZeppelin/openzeppelin-contracts --no-git  # deps (lib/ is gitignored)
forge test
```

## Deploy (Base Sepolia)
```
export PRIVATE_KEY=0x<deployer key with Base Sepolia ETH>   # never commit this
forge script script/DeployPlayerNFT.s.sol --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY --broadcast
```
Then set `NFT_ADDRESS` (server) and `VITE_NFT_ADDRESS` (client) to the printed address.
