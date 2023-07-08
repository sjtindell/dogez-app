#!/bin/bash

# Configuration
rpc_url="$1"
private_key="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
nft_metadata_url="http://localhost:3000/json/" # todo

# Create TreatzToken contract
output=$(forge create TreatzToken --rpc-url=$rpc_url --private-key=$private_key)
treatz_address=$(echo "$output" | awk '/Deployed to:/ { print $3 }' | sed 's/\r//')

echo "TreatzToken address: $treatz_address"

# Create DogezNFT contract
output=$(forge create DogezNFT --rpc-url=$rpc_url --private-key=$private_key --constructor-args Dogez DOGEZ "http://localhost:3000/nft/" $treatz_address)
dogez_address=$(echo "$output" | awk '/Deployed to:/ { print $3 }' | sed 's/\r//')

echo "DogezNFT address: $dogez_address"

# Create DogezStaker contract
output=$(forge create DogezStaker --rpc-url=$rpc_url --private-key=$private_key --constructor-args $dogez_address $treatz_address)
staker_address=$(echo "$output" | awk '/Deployed to:/ { print $3 }' | sed 's/\r//')

echo "DogezStaker address: $staker_address"

# Send 10000 Treatz to the DogezStaker contract
cast send --private-key $private_key --rpc-url $rpc_url --value 0 --gas-price 1000000000 --gas-limit 30000000 $treatz_address "transfer(address,uint256)" $staker_address 10000000000000000000000
