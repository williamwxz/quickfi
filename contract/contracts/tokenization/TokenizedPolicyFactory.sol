// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../utils/BeaconProxyFactory.sol";
import "../interfaces/ITokenizedPolicy.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title TokenizedPolicyFactory
 * @dev Factory for creating and managing TokenizedPolicy proxies
 * Based on Perimeter Protocol's pattern
 */
contract TokenizedPolicyFactory is BeaconProxyFactory {
    using Address for address;

    // Events
    event TokenizedPolicyDeployed(address indexed proxy, string name, string symbol);
    
    /**
     * @dev Constructor
     * @param serviceConfig The service configuration address
     * @param implementation_ The initial implementation address
     */
    constructor(address serviceConfig, address implementation_) 
        BeaconProxyFactory(serviceConfig) 
    {
        // Set the initial implementation
        require(implementation_.isContract(), "TokenizedPolicyFactory: not a contract");
        _setImplementation(implementation_);
    }
    
    /**
     * @dev Deploys a new TokenizedPolicy
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @return proxy The deployed proxy address
     */
    function deployTokenizedPolicy(
        string memory name,
        string memory symbol
    ) external returns (address proxy) {
        // Create initialization data
        bytes memory initData = abi.encodeWithSelector(
            ITokenizedPolicy.initialize.selector,
            name,
            symbol
        );
        
        // Deploy the proxy
        proxy = deployProxy(initData);
        
        // Emit event
        emit TokenizedPolicyDeployed(proxy, name, symbol);
        
        return proxy;
    }
} 