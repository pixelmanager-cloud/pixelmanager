// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// @title Scout NFTs — ownership raises a manager's scouting tier.
/// @notice ERC-1155 with six token ids. The game reads the wallet's balances and takes the
/// highest tier owned in each track:
///   Opposition scout: 1 = Bronze, 2 = Silver, 3 = Gold  (reveals more opponent intel)
///   Player scout:     4 = Bronze, 5 = Silver, 6 = Gold  (rarer trialists + more market stats)
/// Free testnet mint; token-priced genesis can wrap this later.
contract ScoutNFT is ERC1155 {
    constructor() ERC1155("") {}

    /// @notice Free testnet mint of one scout of the given id (1–6).
    function mint(uint256 id) external {
        require(id >= 1 && id <= 6, "bad scout id");
        _mint(msg.sender, id, 1, "");
    }

    function uri(uint256 id) public pure override returns (string memory) {
        require(id >= 1 && id <= 6, "bad scout id");
        string[3] memory tiers = ["Bronze", "Silver", "Gold"];
        string memory track = id <= 3 ? "Opposition" : "Player";
        string memory tier = tiers[(id - 1) % 3];
        string memory json = string(
            abi.encodePacked(
                '{"name":"',
                track,
                " Scout - ",
                tier,
                '","description":"A Pixel Manager scouting license. Owning it raises your ',
                track,
                ' scout tier in-game.","attributes":[{"trait_type":"Track","value":"',
                track,
                '"},{"trait_type":"Tier","value":"',
                tier,
                '"}]}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}
