// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title UpgradeableBeacon
 * @dev Implementation of a beacon contract that can be used by beacon proxies to
 * retrieve the implementation address.
 */
contract UpgradeableBeacon is Ownable {
    using Address for address;
    
    address private _implementation;
    
    event Upgraded(address indexed implementation);
    
    /**
     * @dev Constructor setting initial owner and implementation address
     * @param implementation_ Address of the initial implementation
     */
    constructor(address implementation_) Ownable() {
        _setImplementation(implementation_);
    }
    
    /**
     * @dev Returns the current implementation address
     */
    function implementation() public view returns (address) {
        return _implementation;
    }
    
    /**
     * @dev Upgrades the beacon to a new implementation
     * @param newImplementation Address of the new implementation
     */
    function upgradeTo(address newImplementation) public onlyOwner {
        _setImplementation(newImplementation);
        emit Upgraded(newImplementation);
    }
    
    /**
     * @dev Sets the implementation address
     * @param newImplementation Address of the new implementation
     */
    function _setImplementation(address newImplementation) private {
        require(
            newImplementation.isContract(),
            "UpgradeableBeacon: implementation is not a contract"
        );
        _implementation = newImplementation;
    }
} 