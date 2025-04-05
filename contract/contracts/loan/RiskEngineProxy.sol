// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title RiskEngineProxy
 * @dev Proxy contract for RiskEngine implementation
 */
contract RiskEngineProxy is ERC1967Proxy {
    /**
     * @dev Constructor
     * @param implementation The implementation contract address
     * @param admin The proxy admin address
     * @param data The initialization data
     */
    constructor(
        address implementation,
        address admin,
        bytes memory data
    ) ERC1967Proxy(implementation, data) {}
} 