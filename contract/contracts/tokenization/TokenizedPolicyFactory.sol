// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ITokenizedPolicy.sol";
import "./TokenizedPolicy.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title TokenizedPolicyFactory
 * @dev Factory for creating and managing TokenizedPolicy proxies
 * Based on Perimeter Protocol's pattern
 */
contract TokenizedPolicyFactory is 
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable 
{
    // Roles
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    
    // Events
    event TokenizedPolicyDeployed(address indexed policy, string name, string symbol);
    
    // Service configuration address
    address public serviceConfig;
    
    /**
     * @dev Constructor
     */
    constructor() {
        _disableInitializers();
    }
    
    /**
     * @dev Initializer
     * @param serviceConfig_ The service configuration address
     */
    function initialize(address serviceConfig_) external initializer {
        require(serviceConfig_ != address(0), "TokenizedPolicyFactory: zero address");
        
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        serviceConfig = serviceConfig_;
        
        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FACTORY_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }
    
    /**
     * @dev Deploys a new TokenizedPolicy (non-upgradeable)
     * @param name Name of the token
     * @param symbol Symbol of the token
     * @return policy The deployed TokenizedPolicy address
     */
    function deployTokenizedPolicy(
        string memory name,
        string memory symbol
    ) external onlyRole(FACTORY_ROLE) returns (address policy) {
        // Deploy new non-upgradeable TokenizedPolicy
        policy = address(new TokenizedPolicy(name, symbol));
        
        // Emit event
        emit TokenizedPolicyDeployed(policy, name, symbol);
        
        return policy;
    }
    
    /**
     * @dev Required by UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
} 