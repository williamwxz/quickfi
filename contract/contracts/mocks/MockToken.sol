// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockToken
 * @dev Mock ERC20 token for testing
 */
contract MockToken is ERC20 {
    uint8 private _decimals;

    /**
     * @dev Constructor
     * @param name The token name
     * @param symbol The token symbol
     * @param decimals_ The number of decimals
     */
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mints tokens to an account
     * @param account The account to mint to
     * @param amount The amount to mint
     */
    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    /**
     * @dev Burns tokens from an account
     * @param account The account to burn from
     * @param amount The amount to burn
     */
    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }
} 