// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ScoutNFT} from "../src/ScoutNFT.sol";

/// Deploy ScoutNFT to Base Sepolia:
///   forge script script/DeployScoutNFT.s.sol \
///     --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY --broadcast
contract DeployScoutNFT is Script {
    function run() external {
        vm.startBroadcast();
        ScoutNFT scout = new ScoutNFT();
        console.log("ScoutNFT deployed at:", address(scout));
        vm.stopBroadcast();
    }
}
