// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./utils/ServiceConfiguration.sol";
import "./tokenization/TokenizedPolicyFactory.sol";
import "./loan/RiskEngineProxy.sol";
import "./controllers/RiskController.sol";
import "./interfaces/ITokenizedPolicy.sol";

/**
 * @title QuickFiDeployer
 * @dev Master deployer for coordinating the deployment of the QuickFi protocol
 * Uses non-upgradeable pattern for TokenizedPolicy and transparent proxy for RiskEngine
 * and TokenizedPolicyFactory
 */
contract QuickFiDeployer is Ownable {
    // Service configuration
    ServiceConfiguration public serviceConfiguration;
    
    // Proxy admin for proxies
    ProxyAdmin public proxyAdmin;
    
    // Factory for TokenizedPolicy
    TokenizedPolicyFactory public tokenizedPolicyFactory;
    
    // Deployed component addresses
    address public tokenizedPolicy;
    address public riskEngine;
    address public riskController;
    address public usdcToken;
    
    // Events
    event QuickFiDeployed(
        address tokenizedPolicy,
        address riskEngine,
        address riskController,
        address usdcToken
    );
    
    event FactoryDeployed(string factoryType, address factory);
    
    /**
     * @dev Constructor
     */
    constructor() Ownable() {
        // Create service configuration
        serviceConfiguration = new ServiceConfiguration();
        serviceConfiguration.initialize();
        
        // Create proxy admin
        proxyAdmin = new ProxyAdmin();
    }
    
    /**
     * @dev Sets up the protocol components
     * @param factoryImpl The TokenizedPolicyFactory implementation address
     * @param riskEngineImpl The RiskEngine implementation address
     */
    function setupProtocol(
        address factoryImpl,
        address riskEngineImpl
    ) external onlyOwner {
        require(factoryImpl != address(0), "QuickFiDeployer: Zero address");
        require(riskEngineImpl != address(0), "QuickFiDeployer: Zero address");
        
        // Deploy TokenizedPolicyFactory proxy
        bytes memory factoryInitData = abi.encodeWithSignature(
            "initialize(address)",
            address(serviceConfiguration)
        );
        
        address factoryProxy = address(new TransparentUpgradeableProxy(
            factoryImpl,
            address(proxyAdmin),
            factoryInitData
        ));
        
        tokenizedPolicyFactory = TokenizedPolicyFactory(factoryProxy);
        
        // Deploy RiskEngine proxy
        bytes memory riskEngineInitData = abi.encodeWithSignature(
            "initialize()"
        );
        
        riskEngine = address(new RiskEngineProxy(
            riskEngineImpl,
            address(proxyAdmin),
            riskEngineInitData
        ));
        
        // Register factory as deployer
        serviceConfiguration.grantRole(serviceConfiguration.DEPLOYER_ROLE(), address(tokenizedPolicyFactory));
        
        // Emit event
        emit FactoryDeployed("TokenizedPolicyFactory", address(tokenizedPolicyFactory));
    }
    
    /**
     * @dev Deploys the QuickFi protocol core components
     * @param _usdcToken The USDC token address
     * @param tokenName The name for the tokenized policy token
     * @param tokenSymbol The symbol for the tokenized policy token
     */
    function deployQuickFi(
        address _usdcToken,
        string memory tokenName,
        string memory tokenSymbol
    ) external onlyOwner {
        require(_usdcToken != address(0), "QuickFiDeployer: Zero address");
        require(address(tokenizedPolicyFactory) != address(0), "QuickFiDeployer: Protocol not setup");
        require(riskEngine != address(0), "QuickFiDeployer: Protocol not setup");
        
        // Store USDC token address
        usdcToken = _usdcToken;
        
        // Deploy TokenizedPolicy
        tokenizedPolicy = tokenizedPolicyFactory.deployTokenizedPolicy(
            tokenName,
            tokenSymbol
        );
        
        // Deploy RiskController
        riskController = address(new RiskController(riskEngine));
        
        // Set risk parameters
        RiskController(riskController).updateRiskParameters(
            tokenizedPolicy,
            7000, // 70% max LTV
            8500, // 85% liquidation threshold
            500   // 5% base interest rate
        );
        
        // Set USDC as valid liquidity asset
        serviceConfiguration.setLiquidityAsset(_usdcToken, true);
        
        emit QuickFiDeployed(
            tokenizedPolicy,
            riskEngine,
            riskController,
            usdcToken
        );
    }
    
    /**
     * @dev Add a deployer to the service configuration
     * @param deployer The deployer address to add
     */
    function addDeployer(address deployer) external onlyOwner {
        serviceConfiguration.grantRole(serviceConfiguration.DEPLOYER_ROLE(), deployer);
    }
    
    /**
     * @dev Remove a deployer from the service configuration
     * @param deployer The deployer address to remove
     */
    function removeDeployer(address deployer) external onlyOwner {
        serviceConfiguration.revokeRole(serviceConfiguration.DEPLOYER_ROLE(), deployer);
    }
    
    /**
     * @dev Transfer ownership of the service configuration
     * @param newOwner The new owner address
     */
    function transferServiceConfigOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "QuickFiDeployer: Zero address");
        serviceConfiguration.grantRole(serviceConfiguration.DEFAULT_ADMIN_ROLE(), newOwner);
    }
    
    /**
     * @dev Transfer ownership of the proxy admin
     * @param newOwner The new owner address
     */
    function transferProxyAdminOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "QuickFiDeployer: Zero address");
        proxyAdmin.transferOwnership(newOwner);
    }
} 