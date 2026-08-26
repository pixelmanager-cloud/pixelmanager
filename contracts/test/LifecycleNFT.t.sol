// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {LifecycleNFT} from "../src/LifecycleNFT.sol";

contract LifecycleNFTTest is Test {
    LifecycleNFT nft;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    function setUp() public {
        nft = new LifecycleNFT(3); // small cap for cap testing
    }

    function testMintOwnershipAndLineage() public {
        vm.prank(alice);
        uint256 id = nft.mint();
        assertEq(id, 1);
        assertEq(nft.ownerOf(id), alice);
        assertEq(nft.generationOf(id), 0);
        assertGt(nft.genesSeedOf(id), 0);
        (uint16 gen, uint256 seed) = nft.lineageOf(id);
        assertEq(gen, 0);
        assertGt(seed, 0);
    }

    function testEnumerableSquad() public {
        vm.startPrank(alice);
        nft.mint();
        nft.mint();
        vm.stopPrank();
        assertEq(nft.balanceOf(alice), 2);
        assertEq(nft.tokenOfOwnerByIndex(alice, 0), 1);
        assertEq(nft.tokenOfOwnerByIndex(alice, 1), 2);
    }

    function testRebornBumpsGenerationAndReseeds() public {
        vm.prank(alice);
        uint256 id = nft.mint();
        uint256 seed0 = nft.genesSeedOf(id);
        vm.prank(alice);
        uint16 gen1 = nft.reborn(id);
        assertEq(gen1, 1);
        assertEq(nft.generationOf(id), 1);
        assertTrue(nft.genesSeedOf(id) != seed0); // re-rolled
        assertEq(nft.ownerOf(id), alice); // same token, same owner
    }

    function testRebornOnlyOwner() public {
        vm.prank(alice);
        uint256 id = nft.mint();
        vm.prank(bob);
        vm.expectRevert("not owner");
        nft.reborn(id);
    }

    function testSupplyCap() public {
        vm.startPrank(alice);
        nft.mint();
        nft.mint();
        nft.mint();
        vm.expectRevert("supply cap reached");
        nft.mint();
        vm.stopPrank();
    }

    function testTransferMovesOwnershipStateTravels() public {
        vm.prank(alice);
        uint256 id = nft.mint();
        vm.prank(alice);
        nft.transferFrom(alice, bob, id);
        assertEq(nft.ownerOf(id), bob);
        // lineage (generation/genesSeed) is intrinsic to the token → travels with it
        assertEq(nft.generationOf(id), 0);
    }
}
