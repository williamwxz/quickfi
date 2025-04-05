// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../utils/BeaconProxyFactory.sol";
import "../interfaces/IRiskEngine.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title RiskEngineFactory
 * @dev Factory for creating and managing RiskEngine proxies
 * Based on Perimeter Protocol's pattern
 */
contract RiskEngineFactory is BeaconProxyFactory {
    using Address for address;
    
    // Events
    event RiskEngineDeployed(address indexed proxy);
    
    /**
     * @dev Constructor
     * @param serviceConfig The service configuration address
     * @param implementation_ The initial implementation address
     */
    constructor(address serviceConfig, address implementation_) 
        BeaconProxyFactory(serviceConfig) 
    {
        // Set the initial implementation
        require(implementation_.isContract(), "RiskEngineFactory: not a contract");
        _setImplementation(implementation_);
    }
    
    /**
     * @dev Deploys a new RiskEngine
     * @return proxy The deployed proxy address
     */
    function deployRiskEngine() external returns (address proxy) {
        // Create initialization data
        bytes memory initData = abi.encodeWithSelector(
            IRiskEngine.initialize.selector
        );
        
        // Deploy the proxy
        proxy = deployProxy(initData);
        
        // Emit event
        emit RiskEngineDeployed(proxy);
        
        return proxy;
    }
} 