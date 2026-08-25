// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// @title Pixel Manager PlayerNFT — star players as ERC-721.
/// @notice Each token carries IMMUTABLE base stats (1–20) + a role, rolled
/// deterministically from the tokenId at mint. The game server reads ownership
/// (ERC721Enumerable) + `statsOf` to build a player's squad from their wallet.
/// Genesis pricing / supply caps and stat UPGRADES are separate later contracts;
/// this is the free-mint testnet proof that chain ownership drives the squad.
contract PlayerNFT is ERC721Enumerable {
    enum Role { GK, DF, MF, FW }

    struct Stats {
        uint8 pace;
        uint8 strength;
        uint8 passing;
        uint8 shooting;
        uint8 tackling;
        uint8 positioning;
        uint8 workrate;
        uint8 keeping;
        uint8 setPiece; // corners / free kicks / penalties
        uint8 stamina;  // endurance
    }

    uint256 public nextId = 1;
    mapping(uint256 => Role) public roleOf;
    mapping(uint256 => Stats) private _stats;

    event PlayerMinted(uint256 indexed tokenId, address indexed to, Role role);

    constructor() ERC721("Pixel Manager Player", "PMPLR") {}

    /// @notice Free testnet mint: rolls a star-tier player deterministically from the tokenId.
    function mint() external returns (uint256 tokenId) {
        tokenId = nextId++;
        uint256 seed = uint256(keccak256(abi.encodePacked(tokenId, address(this))));
        Role role = Role(seed % 4);
        roleOf[tokenId] = role;
        _stats[tokenId] = _roll(seed, role);
        _safeMint(msg.sender, tokenId);
        emit PlayerMinted(tokenId, msg.sender, role);
    }

    /// @notice The immutable base stats for a minted token.
    function statsOf(uint256 tokenId) external view returns (Stats memory) {
        require(_ownerOf(tokenId) != address(0), "no such player");
        return _stats[tokenId];
    }

    // ── stat rolling (star tier: base 8–15 + role bias, clamped 1–20) ──────────
    function _roll(uint256 seed, Role role) internal pure returns (Stats memory s) {
        s.pace = _stat(seed, 0, (role == Role.FW || role == Role.DF) ? 3 : 0);
        s.strength = _stat(seed, 1, role == Role.DF ? 3 : 0);
        s.passing = _stat(seed, 2, role == Role.MF ? 3 : 0);
        s.shooting = _stat(seed, 3, role == Role.FW ? 4 : 0);
        s.tackling = _stat(seed, 4, role == Role.DF ? 4 : 0);
        s.positioning = _stat(seed, 5, 1);
        s.workrate = _stat(seed, 6, role == Role.MF ? 2 : 0);
        // keepers are elite in goal; outfielders are near-useless there
        s.keeping = role == Role.GK ? _stat(seed, 7, 5) : uint8(1 + (uint256(keccak256(abi.encodePacked(seed, uint256(99)))) % 5));
        s.setPiece = _stat(seed, 8, (role == Role.FW || role == Role.MF) ? 3 : 0);
        s.stamina = _stat(seed, 9, 2);
    }

    function _stat(uint256 seed, uint256 i, uint8 bias) internal pure returns (uint8) {
        uint256 v = 8 + (uint256(keccak256(abi.encodePacked(seed, i))) % 8) + bias; // 8–15 + bias
        if (v > 20) v = 20;
        return uint8(v);
    }

    // ── on-chain metadata (so wallets/marketplaces show the player) ────────────
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "no such player");
        Stats memory s = _stats[tokenId];
        string[4] memory roleNames = ["GK", "DF", "MF", "FW"];
        string memory json = string(
            abi.encodePacked(
                '{"name":"Pixel Player #',
                Strings.toString(tokenId),
                '","description":"A Pixel Manager star player. Base stats are immutable and travel with the NFT.","attributes":[',
                _txtAttr("Role", roleNames[uint8(roleOf[tokenId])]),
                ",",
                _numAttr("Pace", s.pace),
                ",",
                _numAttr("Strength", s.strength),
                ",",
                _numAttr("Passing", s.passing),
                ",",
                _numAttr("Shooting", s.shooting),
                ",",
                _numAttr("Tackling", s.tackling),
                ",",
                _numAttr("Positioning", s.positioning),
                ",",
                _numAttr("Workrate", s.workrate),
                ",",
                _numAttr("Keeping", s.keeping),
                ",",
                _numAttr("Set Piece", s.setPiece),
                ",",
                _numAttr("Stamina", s.stamina),
                "]}"
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _txtAttr(string memory t, string memory v) internal pure returns (string memory) {
        return string(abi.encodePacked('{"trait_type":"', t, '","value":"', v, '"}'));
    }

    function _numAttr(string memory t, uint8 v) internal pure returns (string memory) {
        return string(abi.encodePacked('{"trait_type":"', t, '","value":', Strings.toString(v), "}"));
    }
}
