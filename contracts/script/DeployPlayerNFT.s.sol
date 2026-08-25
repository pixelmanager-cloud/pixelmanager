// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PlayerNFT} from "../src/PlayerNFT.sol";

/// Deploy PlayerNFT to Base Sepolia:
///   forge script script/DeployPlayerNFT.s.sol \
///     --rpc-url https://sepolia.base.org --private-key $PRIVATE_KEY --broadcast
contract DeployPlayerNFT is Script {
    function run() external {
        vm.startBroadcast();
        PlayerNFT nft = new PlayerNFT();
        console.log("PlayerNFT deployed at:", address(nft));
        vm.stopBroadcast();
    }
}
