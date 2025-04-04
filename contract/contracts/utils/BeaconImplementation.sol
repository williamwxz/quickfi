// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title BeaconImplementation base contract
 * @dev Base contract that overrides the constructor to disable initialization.
 * This pattern is used in upgradeable contracts to prevent initialization of the implementation contract.
 */
abstract contract BeaconImplementation is Initializable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
} 