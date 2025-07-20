// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {TreatzToken} from "../src/TreatzToken.sol";
import {DogezNFT} from "../src/DogezNFT.sol";

/**
 * @title Deploy
 * @notice Deployment script for Dogez contracts
 * @dev Run with: forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast
 */
contract Deploy is Script {
    /*//////////////////////////////////////////////////////////////
                            CONFIGURATION
    //////////////////////////////////////////////////////////////*/

    // Default configuration (can be overridden with environment variables)
    uint256 public constant DEFAULT_INITIAL_TREATZ_SUPPLY = 100_000_000e18; // 100M tokens
    uint256 public constant DEFAULT_MAX_NFT_SUPPLY = 1_000_000; // 1M NFTs
    string public constant DEFAULT_NFT_NAME = "Dogez";
    string public constant DEFAULT_NFT_SYMBOL = "DOGEZ";
    string public constant DEFAULT_BASE_URI = "https://api.dogez.app/metadata/";

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT
    //////////////////////////////////////////////////////////////*/

    function run() external {
        // Get deployment parameters from environment or use defaults
        address owner = getOwnerAddress();
        uint256 initialTreatzSupply = getInitialTreatzSupply();
        uint256 maxNftSupply = getMaxNftSupply();
        string memory nftName = getNftName();
        string memory nftSymbol = getNftSymbol();
        string memory baseUri = getBaseUri();

        console.log("=== Dogez Deployment Script ===");
        console.log("Network:", getChainName());
        console.log("Deployer:", msg.sender);
        console.log("Owner:", owner);
        console.log("Initial Treatz Supply:", initialTreatzSupply);
        console.log("Max NFT Supply:", maxNftSupply);
        console.log("");

        vm.startBroadcast();

        // Deploy TreatzToken
        console.log("Deploying TreatzToken...");
        TreatzToken treatzToken = new TreatzToken(owner, initialTreatzSupply);
        console.log("TreatzToken deployed at:", address(treatzToken));

        // Deploy DogezNFT
        console.log("Deploying DogezNFT...");
        DogezNFT dogezNft = new DogezNFT(nftName, nftSymbol, baseUri, owner, maxNftSupply);
        console.log("DogezNFT deployed at:", address(dogezNft));

        vm.stopBroadcast();

        // Log deployment summary
        console.log("");
        console.log("=== Deployment Summary ===");
        console.log("TreatzToken:");
        console.log("  Address:", address(treatzToken));
        console.log("  Name:", treatzToken.name());
        console.log("  Symbol:", treatzToken.symbol());
        console.log("  Total Supply:", treatzToken.totalSupply());
        console.log("  Owner:", treatzToken.owner());
        console.log("");
        console.log("DogezNFT:");
        console.log("  Address:", address(dogezNft));
        console.log("  Name:", dogezNft.name());
        console.log("  Symbol:", dogezNft.symbol());
        console.log("  Max Supply:", dogezNft.maxSupply());
        console.log("  Owner:", dogezNft.owner());
        console.log("");

        // Save addresses to a file for easy reference
        saveDeploymentAddresses(address(treatzToken), address(dogezNft));

        console.log("Deployment completed successfully!");
        console.log("Contract addresses saved to deployments.json");
    }

    /*//////////////////////////////////////////////////////////////
                            CONFIGURATION HELPERS
    //////////////////////////////////////////////////////////////*/

    function getOwnerAddress() internal view returns (address) {
        // Try to get owner from environment variable, otherwise use deployer
        try vm.envAddress("DEPLOYMENT_OWNER") returns (address owner) {
            return owner;
        } catch {
            return msg.sender;
        }
    }

    function getInitialTreatzSupply() internal view returns (uint256) {
        try vm.envUint("INITIAL_TREATZ_SUPPLY") returns (uint256 supply) {
            return supply;
        } catch {
            return DEFAULT_INITIAL_TREATZ_SUPPLY;
        }
    }

    function getMaxNftSupply() internal view returns (uint256) {
        try vm.envUint("MAX_NFT_SUPPLY") returns (uint256 supply) {
            return supply;
        } catch {
            return DEFAULT_MAX_NFT_SUPPLY;
        }
    }

    function getNftName() internal view returns (string memory) {
        try vm.envString("NFT_NAME") returns (string memory name) {
            return name;
        } catch {
            return DEFAULT_NFT_NAME;
        }
    }

    function getNftSymbol() internal view returns (string memory) {
        try vm.envString("NFT_SYMBOL") returns (string memory symbol) {
            return symbol;
        } catch {
            return DEFAULT_NFT_SYMBOL;
        }
    }

    function getBaseUri() internal view returns (string memory) {
        try vm.envString("NFT_BASE_URI") returns (string memory uri) {
            return uri;
        } catch {
            return DEFAULT_BASE_URI;
        }
    }

    function getChainName() internal view returns (string memory) {
        uint256 chainId = block.chainid;
        if (chainId == 1) return "Mainnet";
        if (chainId == 11155111) return "Sepolia";
        if (chainId == 31337) return "Anvil";
        if (chainId == 137) return "Polygon";
        if (chainId == 42161) return "Arbitrum";
        return "Unknown";
    }

    /*//////////////////////////////////////////////////////////////
                            UTILITY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function saveDeploymentAddresses(address treatzToken, address dogezNft) internal {
        string memory json = string(
            abi.encodePacked(
                '{\n',
                '  "network": "', getChainName(), '",\n',
                '  "chainId": ', vm.toString(block.chainid), ',\n',
                '  "timestamp": ', vm.toString(block.timestamp), ',\n',
                '  "deployer": "', vm.toString(msg.sender), '",\n',
                '  "contracts": {\n',
                '    "TreatzToken": {\n',
                '      "address": "', vm.toString(treatzToken), '",\n',
                '      "name": "Treatz",\n',
                '      "symbol": "TREATZ"\n',
                '    },\n',
                '    "DogezNFT": {\n',
                '      "address": "', vm.toString(dogezNft), '",\n',
                '      "name": "', DEFAULT_NFT_NAME, '",\n',
                '      "symbol": "', DEFAULT_NFT_SYMBOL, '"\n',
                '    }\n',
                '  }\n',
                '}'
            )
        );

        string memory filename = string(
            abi.encodePacked("deployments-", vm.toString(block.chainid), ".json")
        );
        
        vm.writeFile(filename, json);
    }
} 