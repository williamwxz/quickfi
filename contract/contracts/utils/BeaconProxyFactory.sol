// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/IServiceConfiguration.sol";
import "../interfaces/IBeacon.sol";
import "./UpgradeableBeacon.sol";
import "./BeaconProxy.sol";

/**
 * @title BeaconProxyFactory
 * @dev Factory for emitting beacon proxies
 * Based on Perimeter Protocol's BeaconProxyFactory
 */
abstract contract BeaconProxyFactory is IBeacon {
    using Address for address;
    
    /**
     * @dev Address of the protocol service configuration
     */
    IServiceConfiguration internal _serviceConfiguration;
    
    /**
     * @dev Modifier that requires that the sender is registered as a protocol deployer.
     */
    modifier onlyDeployer() {
        require(
            _serviceConfiguration.isDeployer(msg.sender),
            "BeaconProxyFactory: unauthorized"
        );
        _;
    }
    
    /**
     * @inheritdoc IBeacon
     */
    address public implementation;
    
    /**
     * @dev Constructor that sets the service configuration
     * @param serviceConfig The service configuration address
     */
    constructor(address serviceConfig) {
        require(serviceConfig != address(0), "BeaconProxyFactory: invalid service config");
        _serviceConfiguration = IServiceConfiguration(serviceConfig);
    }
    
    /**
     * @inheritdoc IBeacon
     */
    function setImplementation(address newImplementation) 
        external 
        onlyDeployer 
    {
        require(newImplementation.isContract(), "BeaconProxyFactory: not a contract");
        implementation = newImplementation;
        emit ImplementationSet(newImplementation);
    }
    
    /**
     * @dev Deploys a new proxy pointing to the current implementation
     * @param data Initialization data to pass to the implementation
     * @return proxy The address of the deployed proxy
     */
    function deployProxy(bytes memory data) 
        internal 
        returns (address proxy) 
    {
        require(implementation != address(0), "BeaconProxyFactory: implementation not set");
        
        proxy = address(new BeaconProxy(address(this), data));
        
        return proxy;
    }
} 