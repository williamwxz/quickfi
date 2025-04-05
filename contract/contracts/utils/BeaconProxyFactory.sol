// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";
import "../interfaces/IServiceConfiguration.sol";
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
     * @dev The implementation address
     */
    address private _implementation;
    
    /**
     * @dev Constructor that sets the service configuration
     * @param serviceConfig The service configuration address
     */
    constructor(address serviceConfig) {
        require(serviceConfig != address(0), "BeaconProxyFactory: invalid service config");
        _serviceConfiguration = IServiceConfiguration(serviceConfig);
    }
    
    /**
     * @dev Returns the current implementation address
     */
    function implementation() public view virtual override returns (address) {
        return _implementation;
    }
    
    /**
     * @dev Sets a new implementation address for the beacon
     */
    function updateImplementation(address newImplementation) 
        external 
        onlyDeployer 
    {
        _setImplementation(newImplementation);
    }
    
    /**
     * @dev Internal function to set the implementation
     */
    function _setImplementation(address newImplementation) 
        internal 
    {
        require(newImplementation.isContract(), "BeaconProxyFactory: not a contract");
        _implementation = newImplementation;
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
        require(_implementation != address(0), "BeaconProxyFactory: implementation not set");
        
        proxy = address(new BeaconProxy(address(this), data));
        
        return proxy;
    }
} 