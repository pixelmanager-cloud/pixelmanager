// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ScoutNFT} from "../src/ScoutNFT.sol";

contract ScoutNFTTest is Test {
    ScoutNFT scout;
    address alice = address(0xA11CE);

    function setUp() public {
        scout = new ScoutNFT();
    }

    function testMintAndOwn() public {
        vm.prank(alice);
        scout.mint(3); // opp gold
        assertEq(scout.balanceOf(alice, 3), 1);
        assertEq(scout.balanceOf(alice, 1), 0);
    }

    function testBothTracks() public {
        vm.startPrank(alice);
        scout.mint(2); // opp silver
        scout.mint(6); // player gold
        vm.stopPrank();
        assertEq(scout.balanceOf(alice, 2), 1);
        assertEq(scout.balanceOf(alice, 6), 1);
    }

    function testRejectsBadId() public {
        vm.prank(alice);
        vm.expectRevert(bytes("bad scout id"));
        scout.mint(7);
    }

    function testUriIsJson() public view {
        string memory u = scout.uri(3);
        assertEq(_startsWith(u, "data:application/json;base64,"), true);
    }

    function _startsWith(string memory s, string memory p) internal pure returns (bool) {
        bytes memory sb = bytes(s);
        bytes memory pb = bytes(p);
        if (sb.length < pb.length) return false;
        for (uint256 i = 0; i < pb.length; i++) if (sb[i] != pb[i]) return false;
        return true;
    }
}
