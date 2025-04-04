// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

/**
 * @title RiskEngineProxy
 * @dev Proxy contract for RiskEngine using OpenZeppelin's TransparentUpgradeableProxy
 */
contract RiskEngineProxy is TransparentUpgradeableProxy {
    /**
     * @dev Constructor
     * @param _logic Initial implementation address
     * @param admin_ Admin address for ProxyAdmin
     * @param _data Initialization data
     */
    constructor(
        address _logic,
        address admin_,
        bytes memory _data
    ) TransparentUpgradeableProxy(_logic, admin_, _data) {}
} 