// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";
import {Counters} from "openzeppelin-contracts/contracts/utils/Counters.sol";

/**
 * @title DogezNFT
 * @notice NFT contract for Dogez collectibles in the game
 * @dev ERC-721 implementation with:
 *      - Enumerable for easy querying
 *      - URI storage for metadata
 *      - Minting controls for game integration
 *      - Batch operations for efficiency
 */
contract DogezNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Counter for token IDs
    Counters.Counter private _tokenIdCounter;

    /// @notice Base URI for token metadata
    string private _baseTokenURI;

    /// @notice Mapping of addresses authorized to mint NFTs (game contracts)
    mapping(address => bool) public minters;

    /// @notice Mapping to track if a specific game point has been minted
    mapping(uint256 => bool) public pointMinted;

    /// @notice Maximum supply of NFTs that can be minted
    uint256 public maxSupply;

    /// @notice Whether minting is paused
    bool public mintingPaused;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BaseURIUpdated(string indexed newBaseURI);
    event MaxSupplyUpdated(uint256 indexed newMaxSupply);
    event MintingPaused();
    event MintingUnpaused();
    event BatchMint(address indexed to, uint256[] tokenIds);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotAuthorized();
    error MintingIsPaused();
    error ExceedsMaxSupply();
    error PointAlreadyMinted();
    error ZeroAddress();
    error ZeroAmount();
    error InvalidTokenId();
    error ArrayLengthMismatch();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the DogezNFT contract
     * @param _name Name of the NFT collection
     * @param _symbol Symbol of the NFT collection
     * @param _baseURI Base URI for token metadata
     * @param _owner Owner of the contract
     * @param _maxSupply Maximum supply of NFTs
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseURI,
        address _owner,
        uint256 _maxSupply
    ) ERC721(_name, _symbol) Ownable() {
        if (_owner == address(0)) revert ZeroAddress();
        if (_maxSupply == 0) revert ZeroAmount();

        _baseTokenURI = _baseURI;
        maxSupply = _maxSupply;

        // Transfer ownership to the specified owner
        if (_owner != msg.sender) {
            _transferOwnership(_owner);
        }

        // Start token IDs at 1
        _tokenIdCounter.increment();
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint a single NFT to an address (only authorized minters)
     * @param to Address to mint the NFT to
     * @param pointId The game point ID this NFT represents
     * @param tokenURI URI for the token metadata
     * @return tokenId The ID of the minted token
     */
    function mint(
        address to,
        uint256 pointId,
        string memory tokenURI
    ) external returns (uint256) {
        if (!minters[msg.sender]) revert NotAuthorized();
        if (mintingPaused) revert MintingIsPaused();
        if (to == address(0)) revert ZeroAddress();
        if (totalSupply() >= maxSupply) revert ExceedsMaxSupply();
        if (pointMinted[pointId]) revert PointAlreadyMinted();

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Mark the point as minted
        pointMinted[pointId] = true;

        // Mint the token
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }

    /**
     * @notice Mint multiple NFTs to an address (only authorized minters)
     * @param to Address to mint the NFTs to
     * @param pointIds Array of game point IDs
     * @param tokenURIs Array of token URIs
     * @return tokenIds Array of minted token IDs
     */
    function batchMint(
        address to,
        uint256[] calldata pointIds,
        string[] calldata tokenURIs
    ) external returns (uint256[] memory) {
        if (!minters[msg.sender]) revert NotAuthorized();
        if (mintingPaused) revert MintingIsPaused();
        if (to == address(0)) revert ZeroAddress();
        if (pointIds.length == 0) revert ZeroAmount();
        if (pointIds.length != tokenURIs.length) revert ArrayLengthMismatch();
        if (totalSupply() + pointIds.length > maxSupply) revert ExceedsMaxSupply();

        uint256[] memory tokenIds = new uint256[](pointIds.length);

        for (uint256 i = 0; i < pointIds.length; i++) {
            if (pointMinted[pointIds[i]]) revert PointAlreadyMinted();

            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();

            // Mark the point as minted
            pointMinted[pointIds[i]] = true;

            // Mint the token
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);

            tokenIds[i] = tokenId;
        }

        emit BatchMint(to, tokenIds);
        return tokenIds;
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Add an authorized minter (game contracts)
     * @param minter Address to authorize for minting
     */
    function addMinter(address minter) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    /**
     * @notice Remove an authorized minter
     * @param minter Address to remove minting authorization from
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }

    /**
     * @notice Update the base URI for token metadata
     * @param newBaseURI New base URI
     */
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @notice Update the maximum supply (can only decrease)
     * @param newMaxSupply New maximum supply
     */
    function setMaxSupply(uint256 newMaxSupply) external onlyOwner {
        if (newMaxSupply < totalSupply()) revert ExceedsMaxSupply();
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    /**
     * @notice Pause minting
     */
    function pauseMinting() external onlyOwner {
        mintingPaused = true;
        emit MintingPaused();
    }

    /**
     * @notice Unpause minting
     */
    function unpauseMinting() external onlyOwner {
        mintingPaused = false;
        emit MintingUnpaused();
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get all token IDs owned by an address
     * @param owner Address to query
     * @return tokenIds Array of token IDs owned by the address
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);

        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    /**
     * @notice Check if an address is an authorized minter
     * @param account Address to check
     * @return Whether the address is authorized to mint
     */
    function isMinter(address account) external view returns (bool) {
        return minters[account];
    }

    /**
     * @notice Get the next token ID that will be minted
     * @return The next token ID
     */
    function nextTokenId() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL/OVERRIDE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the base URI for token metadata
     * @return The base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @notice Override required by Solidity for multiple inheritance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @notice Override required by Solidity for multiple inheritance
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @notice Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
