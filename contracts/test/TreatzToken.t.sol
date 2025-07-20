// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {TreatzToken} from "../src/TreatzToken.sol";

contract TreatzTokenTest is Test {
    TreatzToken public token;
    
    address public owner = address(0x1);
    address public minter = address(0x2);
    address public burner = address(0x3);
    address public user = address(0x4);
    address public user2 = address(0x5);
    
    uint256 public constant INITIAL_SUPPLY = 100_000_000e18; // 100M tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18; // 1B tokens

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BurnerAdded(address indexed burner);
    event BurnerRemoved(address indexed burner);
    event MintingDisabled();
    event TokensBurned(address indexed from, uint256 amount);

    function setUp() public {
        token = new TreatzToken(owner, INITIAL_SUPPLY);
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Constructor() public {
        assertEq(token.name(), "Treatz");
        assertEq(token.symbol(), "TREATZ");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.owner(), owner);
        assertEq(token.MAX_SUPPLY(), MAX_SUPPLY);
        assertFalse(token.mintingDisabled());
    }

    function test_Constructor_ZeroOwner() public {
        vm.expectRevert(TreatzToken.ZeroAddress.selector);
        new TreatzToken(address(0), INITIAL_SUPPLY);
    }

    function test_Constructor_ExceedsMaxSupply() public {
        vm.expectRevert(TreatzToken.ExceedsMaxSupply.selector);
        new TreatzToken(owner, MAX_SUPPLY + 1);
    }

    function test_Constructor_ZeroInitialSupply() public {
        TreatzToken zeroSupplyToken = new TreatzToken(owner, 0);
        assertEq(zeroSupplyToken.totalSupply(), 0);
        assertEq(zeroSupplyToken.balanceOf(owner), 0);
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddMinter() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MinterAdded(minter);
        token.addMinter(minter);
        
        assertTrue(token.isMinter(minter));
        assertTrue(token.minters(minter));
    }

    function test_AddMinter_OnlyOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        token.addMinter(minter);
    }

    function test_AddMinter_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(TreatzToken.ZeroAddress.selector);
        token.addMinter(address(0));
    }

    function test_RemoveMinter() public {
        // First add a minter
        vm.prank(owner);
        token.addMinter(minter);
        
        // Then remove it
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MinterRemoved(minter);
        token.removeMinter(minter);
        
        assertFalse(token.isMinter(minter));
        assertFalse(token.minters(minter));
    }

    function test_Mint() public {
        // Add minter
        vm.prank(owner);
        token.addMinter(minter);
        
        uint256 mintAmount = 1000e18;
        uint256 balanceBefore = token.balanceOf(user);
        uint256 totalSupplyBefore = token.totalSupply();
        
        vm.prank(minter);
        token.mint(user, mintAmount);
        
        assertEq(token.balanceOf(user), balanceBefore + mintAmount);
        assertEq(token.totalSupply(), totalSupplyBefore + mintAmount);
    }

    function test_Mint_NotAuthorized() public {
        vm.prank(user);
        vm.expectRevert(TreatzToken.NotAuthorized.selector);
        token.mint(user, 1000e18);
    }

    function test_Mint_MintingDisabled() public {
        // Add minter and disable minting
        vm.startPrank(owner);
        token.addMinter(minter);
        token.disableMinting();
        vm.stopPrank();
        
        vm.prank(minter);
        vm.expectRevert(TreatzToken.MintingPermanentlyDisabled.selector);
        token.mint(user, 1000e18);
    }

    function test_Mint_ZeroAddress() public {
        vm.prank(owner);
        token.addMinter(minter);
        
        vm.prank(minter);
        vm.expectRevert(TreatzToken.ZeroAddress.selector);
        token.mint(address(0), 1000e18);
    }

    function test_Mint_ZeroAmount() public {
        vm.prank(owner);
        token.addMinter(minter);
        
        vm.prank(minter);
        vm.expectRevert(TreatzToken.ZeroAmount.selector);
        token.mint(user, 0);
    }

    function test_Mint_ExceedsMaxSupply() public {
        vm.prank(owner);
        token.addMinter(minter);
        
        uint256 remainingSupply = MAX_SUPPLY - token.totalSupply();
        
        vm.prank(minter);
        vm.expectRevert(TreatzToken.ExceedsMaxSupply.selector);
        token.mint(user, remainingSupply + 1);
    }

    /*//////////////////////////////////////////////////////////////
                            BURNING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_AddBurner() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit BurnerAdded(burner);
        token.addBurner(burner);
        
        assertTrue(token.isBurner(burner));
        assertTrue(token.burners(burner));
    }

    function test_AddBurner_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(TreatzToken.ZeroAddress.selector);
        token.addBurner(address(0));
    }

    function test_RemoveBurner() public {
        // First add a burner
        vm.prank(owner);
        token.addBurner(burner);
        
        // Then remove it
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit BurnerRemoved(burner);
        token.removeBurner(burner);
        
        assertFalse(token.isBurner(burner));
        assertFalse(token.burners(burner));
    }

    function test_BurnFrom_AuthorizedBurner() public {
        // Setup: owner has tokens, add burner
        vm.prank(owner);
        token.addBurner(burner);
        
        uint256 burnAmount = 1000e18;
        uint256 balanceBefore = token.balanceOf(owner);
        uint256 totalSupplyBefore = token.totalSupply();
        
        vm.prank(burner);
        vm.expectEmit(true, true, true, true);
        emit TokensBurned(owner, burnAmount);
        token.burnFrom(owner, burnAmount);
        
        assertEq(token.balanceOf(owner), balanceBefore - burnAmount);
        assertEq(token.totalSupply(), totalSupplyBefore - burnAmount);
    }

    function test_BurnFrom_WithApproval() public {
        // Setup: transfer tokens to user, user approves burner
        vm.prank(owner);
        token.transfer(user, 5000e18);
        
        vm.prank(user);
        token.approve(user2, 1000e18);
        
        uint256 burnAmount = 500e18;
        uint256 balanceBefore = token.balanceOf(user);
        uint256 allowanceBefore = token.allowance(user, user2);
        
        vm.prank(user2);
        vm.expectEmit(true, true, true, true);
        emit TokensBurned(user, burnAmount);
        token.burnFrom(user, burnAmount);
        
        assertEq(token.balanceOf(user), balanceBefore - burnAmount);
        assertEq(token.allowance(user, user2), allowanceBefore - burnAmount);
    }

    function test_Burn() public {
        // Transfer tokens to user first
        vm.prank(owner);
        token.transfer(user, 5000e18);
        
        uint256 burnAmount = 1000e18;
        uint256 balanceBefore = token.balanceOf(user);
        uint256 totalSupplyBefore = token.totalSupply();
        
        vm.prank(user);
        token.burn(burnAmount);
        
        assertEq(token.balanceOf(user), balanceBefore - burnAmount);
        assertEq(token.totalSupply(), totalSupplyBefore - burnAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            ADMIN TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DisableMinting() public {
        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit MintingDisabled();
        token.disableMinting();
        
        assertTrue(token.mintingDisabled());
    }

    function test_DisableMinting_OnlyOwner() public {
        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        token.disableMinting();
    }

    /*//////////////////////////////////////////////////////////////
                            ERC20 STANDARD TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Transfer() public {
        uint256 transferAmount = 1000e18;
        
        vm.prank(owner);
        token.transfer(user, transferAmount);
        
        assertEq(token.balanceOf(user), transferAmount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
    }

    function test_Approve() public {
        uint256 approvalAmount = 1000e18;
        
        vm.prank(owner);
        token.approve(user, approvalAmount);
        
        assertEq(token.allowance(owner, user), approvalAmount);
    }

    function test_TransferFrom() public {
        uint256 approvalAmount = 1000e18;
        uint256 transferAmount = 500e18;
        
        // Owner approves user to spend tokens
        vm.prank(owner);
        token.approve(user, approvalAmount);
        
        // User transfers from owner to user2
        vm.prank(user);
        token.transferFrom(owner, user2, transferAmount);
        
        assertEq(token.balanceOf(user2), transferAmount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - transferAmount);
        assertEq(token.allowance(owner, user), approvalAmount - transferAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_Mint(uint256 amount) public {
        amount = bound(amount, 1, MAX_SUPPLY - INITIAL_SUPPLY);
        
        vm.prank(owner);
        token.addMinter(minter);
        
        vm.prank(minter);
        token.mint(user, amount);
        
        assertEq(token.balanceOf(user), amount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + amount);
    }

    function testFuzz_Transfer(uint256 amount) public {
        amount = bound(amount, 1, INITIAL_SUPPLY);
        
        vm.prank(owner);
        token.transfer(user, amount);
        
        assertEq(token.balanceOf(user), amount);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY - amount);
    }
} 