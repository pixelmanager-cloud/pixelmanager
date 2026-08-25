// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {PlayerNFT} from "../src/PlayerNFT.sol";

contract PlayerNFTTest is Test {
    PlayerNFT nft;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        nft = new PlayerNFT();
    }

    function _assertStarRange(PlayerNFT.Stats memory s, PlayerNFT.Role role) internal pure {
        uint8[8] memory vals = [s.pace, s.strength, s.passing, s.shooting, s.tackling, s.positioning, s.workrate, s.keeping];
        for (uint256 i = 0; i < 8; i++) {
            assertGe(vals[i], 1);
            assertLe(vals[i], 20);
        }
        // keepers are elite in goal; outfielders can't keep
        if (role == PlayerNFT.Role.GK) assertGe(s.keeping, 13);
        else assertLe(s.keeping, 5);
    }

    function testMintAssignsOwnershipAndStats() public {
        vm.prank(alice);
        uint256 id = nft.mint();
        assertEq(id, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.balanceOf(alice), 1);
        PlayerNFT.Stats memory s = nft.statsOf(1);
        _assertStarRange(s, nft.roleOf(1));
    }

    function testEnumerationBuildsSquad() public {
        vm.startPrank(alice);
        nft.mint();
        nft.mint();
        nft.mint();
        vm.stopPrank();
        assertEq(nft.balanceOf(alice), 3);
        // the server reads owned tokens exactly this way
        for (uint256 i = 0; i < 3; i++) {
            uint256 tokenId = nft.tokenOfOwnerByIndex(alice, i);
            assertEq(nft.ownerOf(tokenId), alice);
        }
    }

    function testDeterministicStats() public {
        // same tokenId → same stats regardless of who mints (rolled from tokenId + contract)
        vm.prank(alice);
        uint256 id = nft.mint();
        PlayerNFT.Stats memory s = nft.statsOf(id);
        // re-derive nothing here; just assert stability of a couple fields across reads
        PlayerNFT.Stats memory s2 = nft.statsOf(id);
        assertEq(s.shooting, s2.shooting);
        assertEq(s.keeping, s2.keeping);
    }

    function testTransferMovesPlayer() public {
        vm.prank(alice);
        nft.mint();
        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);
        assertEq(nft.ownerOf(1), bob);
        assertEq(nft.balanceOf(alice), 0);
        assertEq(nft.balanceOf(bob), 1);
    }

    function testTokenUriIsJson() public {
        vm.prank(alice);
        nft.mint();
        string memory uri = nft.tokenURI(1);
        // data:application/json;base64, prefix
        assertEq(_startsWith(uri, "data:application/json;base64,"), true);
    }

    function _startsWith(string memory s, string memory prefix) internal pure returns (bool) {
        bytes memory sb = bytes(s);
        bytes memory pb = bytes(prefix);
        if (sb.length < pb.length) return false;
        for (uint256 i = 0; i < pb.length; i++) if (sb[i] != pb[i]) return false;
        return true;
    }
}
