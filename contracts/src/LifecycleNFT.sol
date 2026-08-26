// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// @title Pixel Manager LifecycleNFT — the persistent, evolving player token.
/// @notice ONE token per player that lives the whole loop: minted as a 10-year-old PROSPECT,
/// developed in the Career game, graduated to a PRO, retired, then REBORN as the next
/// generation — the SAME tokenId throughout. Following the game's "minimal on-chain" trust
/// model, the chain holds only OWNERSHIP + lineage: the `generation` counter and an immutable
/// per-generation `genesSeed`. All mutable game state (prospect/pro state, career actions,
/// stats, morale, contracts) lives OFF-CHAIN in the server, keyed by tokenId and gated by the
/// on-chain owner. Fixed supply: mint is capped; reborn evolves in place (never mints new).
contract LifecycleNFT is ERC721Enumerable {
    uint256 public immutable SUPPLY_CAP;
    uint256 public nextId = 1;

    /// generation of each token: 0 at genesis, +1 each reborn (lineage depth).
    mapping(uint256 => uint16) public generationOf;
    /// immutable-per-generation seed the server derives genes/pedigree from (re-rolled on reborn).
    mapping(uint256 => uint256) public genesSeedOf;

    event Minted(uint256 indexed tokenId, address indexed to, uint256 genesSeed);
    event Reborn(uint256 indexed tokenId, uint16 newGeneration, uint256 newGenesSeed);

    constructor(uint256 supplyCap) ERC721("Pixel Manager Player", "PMLIFE") {
        SUPPLY_CAP = supplyCap;
    }

    /// @notice Mint a fresh genesis PROSPECT (generation 0) to the caller. Cap-enforced.
    function mint() external returns (uint256 tokenId) {
        require(nextId <= SUPPLY_CAP, "supply cap reached");
        tokenId = nextId++;
        uint256 seed = uint256(keccak256(abi.encodePacked(tokenId, block.prevrandao, msg.sender)));
        genesSeedOf[tokenId] = seed;
        // generationOf defaults to 0
        _safeMint(msg.sender, tokenId);
        emit Minted(tokenId, msg.sender, seed);
    }

    /// @notice Evolve a retired token into the NEXT generation in place (same tokenId): bumps the
    /// generation and re-rolls the genes seed. Owner-only — the server applies regression-bounded
    /// inheritance off-chain from the new seed + the prior lineage. The reborn is a new 10yo prospect.
    function reborn(uint256 tokenId) external returns (uint16 newGeneration) {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        newGeneration = generationOf[tokenId] + 1;
        generationOf[tokenId] = newGeneration;
        uint256 seed = uint256(keccak256(abi.encodePacked(tokenId, newGeneration, block.prevrandao, msg.sender)));
        genesSeedOf[tokenId] = seed;
        emit Reborn(tokenId, newGeneration, seed);
    }

    /// @notice Lineage view for the server: (generation, genesSeed) for a token.
    function lineageOf(uint256 tokenId) external view returns (uint16 generation, uint256 genesSeed) {
        require(_ownerOf(tokenId) != address(0), "no such token");
        return (generationOf[tokenId], genesSeedOf[tokenId]);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "no such token");
        string memory id = Strings.toString(tokenId);
        string memory gen = Strings.toString(uint256(generationOf[tokenId]));
        string memory json = string(
            abi.encodePacked(
                '{"name":"Pixel Manager Player #', id,
                '","description":"An evolving Pixel Manager player NFT. Development, stats and career live off-chain, keyed to this token.",',
                '"attributes":[{"trait_type":"Generation","value":', gen, '}]}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}
