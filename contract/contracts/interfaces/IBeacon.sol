// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IBeacon
 * @dev Interface for the beacon pattern
 * Based on Perimeter Protocol's IBeacon
 */
interface IBeacon {
    /**
     * @dev Event emitted when a new implementation is set
     */
    event ImplementationSet(address indexed implementation);
    
    /**
     * @dev Returns the address of the current implementation
     * @return The address of the current implementation
     */
    function implementation() external view returns (address);
    
    /**
     * @dev Sets the implementation address for the beacon
     * @param newImplementation New implementation address
     */
    function setImplementation(address newImplementation) external;
} 