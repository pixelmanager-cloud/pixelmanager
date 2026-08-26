// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {LifecycleNFT} from "../src/LifecycleNFT.sol";

/// Deploy LifecycleNFT.
///   Local (Anvil):  forge script script/DeployLifecycleNFT.s.sol \
///     --rpc-url http://127.0.0.1:8545 --private-key $PK --broadcast
///   Base Sepolia:   forge script script/DeployLifecycleNFT.s.sol \
///     --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY --broadcast
/// SUPPLY_CAP overridable via env (default 10000, matching the off-chain fixed supply).
contract DeployLifecycleNFT is Script {
    function run() external {
        uint256 cap = vm.envOr("SUPPLY_CAP", uint256(10000));
        vm.startBroadcast();
        LifecycleNFT nft = new LifecycleNFT(cap);
        console.log("LifecycleNFT deployed at:", address(nft));
        console.log("supply cap:", cap);
        vm.stopBroadcast();
    }
}
