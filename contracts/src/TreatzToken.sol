// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Burnable} from "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/security/ReentrancyGuard.sol";

/**
 * @title TreatzToken
 * @notice The native game token for the Dogez ecosystem
 * @dev ERC-20 token with additional features:
 *      - Permit functionality for gasless approvals
 *      - Burnable for deflationary mechanics
 *      - Owner controls for minting (with caps)
 *      - Game integration functions
 */
contract TreatzToken is ERC20, ERC20Permit, ERC20Burnable, Ownable, ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Maximum total supply that can ever exist (1 billion tokens)
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18;

    /// @notice Decimals for the token
    uint8 public constant DECIMALS = 18;

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping of addresses authorized to mint tokens (game contracts)
    mapping(address => bool) public minters;

    /// @notice Mapping of addresses authorized to burn tokens from others (game contracts)
    mapping(address => bool) public burners;

    /// @notice Whether minting is permanently disabled
    bool public mintingDisabled;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BurnerAdded(address indexed burner);
    event BurnerRemoved(address indexed burner);
    event MintingDisabled();
    event TokensBurned(address indexed from, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotAuthorized();
    error ExceedsMaxSupply();
    error MintingPermanentlyDisabled();
    error ZeroAddress();
    error ZeroAmount();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initialize the TreatzToken
     * @param _owner The owner of the contract
     * @param _initialSupply Initial supply to mint to owner
     */
    constructor(
        address _owner,
        uint256 _initialSupply
    ) ERC20("Treatz", "TREATZ") ERC20Permit("Treatz") Ownable() {
        if (_owner == address(0)) revert ZeroAddress();
        if (_initialSupply > MAX_SUPPLY) revert ExceedsMaxSupply();

        // Transfer ownership to the specified owner
        if (_owner != msg.sender) {
            _transferOwnership(_owner);
        }

        if (_initialSupply > 0) {
            _mint(_owner, _initialSupply);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            MINTER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Mint tokens to an address (only authorized minters)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        if (!minters[msg.sender]) revert NotAuthorized();
        if (mintingDisabled) revert MintingPermanentlyDisabled();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        if (totalSupply() + amount > MAX_SUPPLY) revert ExceedsMaxSupply();

        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from an address (only authorized burners)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) public override {
        if (!burners[msg.sender]) {
            // If not an authorized burner, use standard burnFrom logic
            super.burnFrom(from, amount);
        } else {
            // Authorized burners can burn without approval
            _burn(from, amount);
        }
        
        emit TokensBurned(from, amount);
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
     * @notice Add an authorized burner (game contracts)
     * @param burner Address to authorize for burning
     */
    function addBurner(address burner) external onlyOwner {
        if (burner == address(0)) revert ZeroAddress();
        burners[burner] = true;
        emit BurnerAdded(burner);
    }

    /**
     * @notice Remove an authorized burner
     * @param burner Address to remove burning authorization from
     */
    function removeBurner(address burner) external onlyOwner {
        burners[burner] = false;
        emit BurnerRemoved(burner);
    }

    /**
     * @notice Permanently disable minting (irreversible)
     * @dev This is a safety mechanism to ensure no more tokens can be minted
     */
    function disableMinting() external onlyOwner {
        mintingDisabled = true;
        emit MintingDisabled();
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get the number of decimals for the token
     * @return The number of decimals
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
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
     * @notice Check if an address is an authorized burner
     * @param account Address to check
     * @return Whether the address is authorized to burn
     */
    function isBurner(address account) external view returns (bool) {
        return burners[account];
    }
}
