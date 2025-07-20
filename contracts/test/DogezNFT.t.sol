// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {DogezNFT} from "../src/DogezNFT.sol";

contract DogezNFTTest is Test {
    DogezNFT public nft;
    
    address public owner = address(0x1);
    address public minter = address(0x2);
    address public user = address(0x3);
    address public user2 = address(0x4);
    
    string public constant BASE_URI = "https://api.dogez.app/metadata/";
    uint256 public constant MAX_SUPPLY = 10000;

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BaseURIUpdated(string indexed newBaseURI);
    event MaxSupplyUpdated(uint256 indexed newMaxSupply);
    event MintingPaused();
    event MintingUnpaused();
    event BatchMint(address indexed to, uint256[] tokenIds);

    function setUp() public {
        nft = new DogezNFT("Dogez", "DOGEZ", BASE_URI, owner, MAX_SUPPLY);
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Constructor() public {
        assertEq(nft.name(), "Dogez");
        assertEq(nft.symbol(), "DOGEZ");
        assertEq(nft.owner(), owner);
        assertEq(nft.maxSupply(), MAX_SUPPLY);
        assertEq(nft.totalSupply(), 0);
        assertEq(nft.nextTokenId(), 1);
        assertFalse(nft.mintingPaused());
    }

    function test_Constructor_ZeroOwner() public {
        vm.expectRevert(DogezNFT.ZeroAddress.selector);
        new DogezNFT("Dogez", "DOGEZ", BASE_URI, address(0), MAX_SUPPLY);
    }

    function test_Constructor_ZeroMaxSupply() public {
        vm.expectRevert(DogezNFT.ZeroAmount.selector);
        new DogezNFT("Dogez", "DOGEZ", BASE_URI, owner, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            MINTER MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddMinter() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MinterAdded(minter);
        nft.addMinter(minter);
        
        assertTrue(nft.isMinter(minter));
        assertTrue(nft.minters(minter));
    }

    function test_AddMinter_OnlyOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        nft.addMinter(minter);
    }

    function test_AddMinter_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(DogezNFT.ZeroAddress.selector);
        nft.addMinter(address(0));
    }

    function test_RemoveMinter() public {
        // First add a minter
        vm.prank(owner);
        nft.addMinter(minter);
        
        // Then remove it
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MinterRemoved(minter);
        nft.removeMinter(minter);
        
        assertFalse(nft.isMinter(minter));
        assertFalse(nft.minters(minter));
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Mint() public {
        // Add minter
        vm.prank(owner);
        nft.addMinter(minter);
        
        uint256 pointId = 1;
        string memory tokenURI = "metadata1.json";
        
        vm.prank(minter);
        uint256 tokenId = nft.mint(user, pointId, tokenURI);
        
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), user);
        assertEq(nft.balanceOf(user), 1);
        assertEq(nft.totalSupply(), 1);
        assertEq(nft.nextTokenId(), 2);
        assertTrue(nft.pointMinted(pointId));
        assertEq(nft.tokenURI(tokenId), string(abi.encodePacked(BASE_URI, tokenURI)));
    }

    function test_Mint_NotAuthorized() public {
        vm.prank(user);
        vm.expectRevert(DogezNFT.NotAuthorized.selector);
        nft.mint(user, 1, "metadata1.json");
    }

    function test_Mint_MintingPaused() public {
        // Add minter and pause minting
        vm.startPrank(owner);
        nft.addMinter(minter);
        nft.pauseMinting();
        vm.stopPrank();
        
        vm.prank(minter);
        vm.expectRevert(DogezNFT.MintingIsPaused.selector);
        nft.mint(user, 1, "metadata1.json");
    }

    function test_Mint_ZeroAddress() public {
        vm.prank(owner);
        nft.addMinter(minter);
        
        vm.prank(minter);
        vm.expectRevert(DogezNFT.ZeroAddress.selector);
        nft.mint(address(0), 1, "metadata1.json");
    }

    function test_Mint_PointAlreadyMinted() public {
        vm.prank(owner);
        nft.addMinter(minter);
        
        uint256 pointId = 1;
        
        // Mint first time - should succeed
        vm.prank(minter);
        nft.mint(user, pointId, "metadata1.json");
        
        // Try to mint same point again - should fail
        vm.prank(minter);
        vm.expectRevert(DogezNFT.PointAlreadyMinted.selector);
        nft.mint(user2, pointId, "metadata2.json");
    }

    function test_Mint_ExceedsMaxSupply() public {
        // Create NFT with max supply of 1
        DogezNFT smallNft = new DogezNFT("Small", "SMALL", BASE_URI, owner, 1);
        
        vm.prank(owner);
        smallNft.addMinter(minter);
        
        // First mint should succeed
        vm.prank(minter);
        smallNft.mint(user, 1, "metadata1.json");
        
        // Second mint should fail
        vm.prank(minter);
        vm.expectRevert(DogezNFT.ExceedsMaxSupply.selector);
        smallNft.mint(user2, 2, "metadata2.json");
    }

    /*//////////////////////////////////////////////////////////////
                            BATCH MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_BatchMint() public {
        vm.prank(owner);
        nft.addMinter(minter);
        
        uint256[] memory pointIds = new uint256[](3);
        pointIds[0] = 1;
        pointIds[1] = 2;
        pointIds[2] = 3;
        
        string[] memory tokenURIs = new string[](3);
        tokenURIs[0] = "metadata1.json";
        tokenURIs[1] = "metadata2.json";
        tokenURIs[2] = "metadata3.json";
        
        vm.prank(minter);
        uint256[] memory tokenIds = nft.batchMint(user, pointIds, tokenURIs);
        
        assertEq(tokenIds.length, 3);
        assertEq(tokenIds[0], 1);
        assertEq(tokenIds[1], 2);
        assertEq(tokenIds[2], 3);
        
        assertEq(nft.balanceOf(user), 3);
        assertEq(nft.totalSupply(), 3);
        assertEq(nft.nextTokenId(), 4);
        
        // Check each token
        for (uint256 i = 0; i < 3; i++) {
            assertEq(nft.ownerOf(tokenIds[i]), user);
            assertTrue(nft.pointMinted(pointIds[i]));
        }
    }

    function test_BatchMint_ArrayLengthMismatch() public {
        vm.prank(owner);
        nft.addMinter(minter);
        
        uint256[] memory pointIds = new uint256[](2);
        pointIds[0] = 1;
        pointIds[1] = 2;
        
        string[] memory tokenURIs = new string[](3);
        tokenURIs[0] = "metadata1.json";
        tokenURIs[1] = "metadata2.json";
        tokenURIs[2] = "metadata3.json";
        
        vm.prank(minter);
        vm.expectRevert(DogezNFT.ArrayLengthMismatch.selector);
        nft.batchMint(user, pointIds, tokenURIs);
    }

    function test_BatchMint_ZeroAmount() public {
        vm.prank(owner);
        nft.addMinter(minter);
        
        uint256[] memory pointIds = new uint256[](0);
        string[] memory tokenURIs = new string[](0);
        
        vm.prank(minter);
        vm.expectRevert(DogezNFT.ZeroAmount.selector);
        nft.batchMint(user, pointIds, tokenURIs);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_SetBaseURI() public {
        string memory newBaseURI = "https://new.api.dogez.app/metadata/";
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit BaseURIUpdated(newBaseURI);
        nft.setBaseURI(newBaseURI);
        
        // Mint a token to test the new base URI
        vm.prank(owner);
        nft.addMinter(minter);
        
        vm.prank(minter);
        uint256 tokenId = nft.mint(user, 1, "test.json");
        
        assertEq(nft.tokenURI(tokenId), string(abi.encodePacked(newBaseURI, "test.json")));
    }

    function test_SetMaxSupply() public {
        uint256 newMaxSupply = 5000;
        
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MaxSupplyUpdated(newMaxSupply);
        nft.setMaxSupply(newMaxSupply);
        
        assertEq(nft.maxSupply(), newMaxSupply);
    }

    function test_SetMaxSupply_BelowTotalSupply() public {
        // First mint some tokens
        vm.prank(owner);
        nft.addMinter(minter);
        
        vm.prank(minter);
        nft.mint(user, 1, "metadata1.json");
        
        vm.prank(minter);
        nft.mint(user, 2, "metadata2.json");
        
        // Try to set max supply below current total supply
        vm.prank(owner);
        vm.expectRevert(DogezNFT.ExceedsMaxSupply.selector);
        nft.setMaxSupply(1);
    }

    function test_PauseMinting() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MintingPaused();
        nft.pauseMinting();
        
        assertTrue(nft.mintingPaused());
    }

    function test_UnpauseMinting() public {
        // First pause
        vm.prank(owner);
        nft.pauseMinting();
        
        // Then unpause
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MintingUnpaused();
        nft.unpauseMinting();
        
        assertFalse(nft.mintingPaused());
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TokensOfOwner() public {
        vm.prank(owner);
        nft.addMinter(minter);
        
        // Mint multiple tokens to user
        vm.startPrank(minter);
        nft.mint(user, 1, "metadata1.json");
        nft.mint(user, 2, "metadata2.json");
        nft.mint(user, 3, "metadata3.json");
        
        // Mint one to user2
        nft.mint(user2, 4, "metadata4.json");
        vm.stopPrank();
        
        uint256[] memory userTokens = nft.tokensOfOwner(user);
        uint256[] memory user2Tokens = nft.tokensOfOwner(user2);
        
        assertEq(userTokens.length, 3);
        assertEq(userTokens[0], 1);
        assertEq(userTokens[1], 2);
        assertEq(userTokens[2], 3);
        
        assertEq(user2Tokens.length, 1);
        assertEq(user2Tokens[0], 4);
    }

    function test_TokensOfOwner_NoTokens() public {
        uint256[] memory tokens = nft.tokensOfOwner(user);
        assertEq(tokens.length, 0);
    }

    /*//////////////////////////////////////////////////////////////
                            ERC721 STANDARD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_TransferFrom() public {
        // Setup: mint a token to user
        vm.prank(owner);
        nft.addMinter(minter);
        
        vm.prank(minter);
        uint256 tokenId = nft.mint(user, 1, "metadata1.json");
        
        // Transfer from user to user2
        vm.prank(user);
        nft.transferFrom(user, user2, tokenId);
        
        assertEq(nft.ownerOf(tokenId), user2);
        assertEq(nft.balanceOf(user), 0);
        assertEq(nft.balanceOf(user2), 1);
    }

    function test_Approve() public {
        // Setup: mint a token to user
        vm.prank(owner);
        nft.addMinter(minter);
        
        vm.prank(minter);
        uint256 tokenId = nft.mint(user, 1, "metadata1.json");
        
        // User approves user2 to transfer the token
        vm.prank(user);
        nft.approve(user2, tokenId);
        
        assertEq(nft.getApproved(tokenId), user2);
        
        // User2 can now transfer the token
        vm.prank(user2);
        nft.transferFrom(user, user2, tokenId);
        
        assertEq(nft.ownerOf(tokenId), user2);
    }

    function test_SetApprovalForAll() public {
        // Setup: mint tokens to user
        vm.prank(owner);
        nft.addMinter(minter);
        
        vm.startPrank(minter);
        nft.mint(user, 1, "metadata1.json");
        nft.mint(user, 2, "metadata2.json");
        vm.stopPrank();
        
        // User approves user2 for all tokens
        vm.prank(user);
        nft.setApprovalForAll(user2, true);
        
        assertTrue(nft.isApprovedForAll(user, user2));
        
        // User2 can transfer any of user's tokens
        vm.prank(user2);
        nft.transferFrom(user, user2, 1);
        
        assertEq(nft.ownerOf(1), user2);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_Mint(uint256 pointId, string memory tokenURI) public {
        vm.assume(pointId > 0);
        vm.assume(bytes(tokenURI).length > 0);
        
        vm.prank(owner);
        nft.addMinter(minter);
        
        vm.prank(minter);
        uint256 tokenId = nft.mint(user, pointId, tokenURI);
        
        assertEq(nft.ownerOf(tokenId), user);
        assertTrue(nft.pointMinted(pointId));
        assertEq(nft.totalSupply(), 1);
    }
} 