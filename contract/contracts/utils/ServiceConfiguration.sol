// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../interfaces/IServiceConfiguration.sol";

/**
 * @title ServiceConfiguration
 * @dev Implementation of the IServiceConfiguration interface.
 * Based on Perimeter Protocol's pattern
 */
contract ServiceConfiguration is 
    IServiceConfiguration,
    AccessControlUpgradeable,
    UUPSUpgradeable 
{
    /**
     * @dev The Operator Role - can update protocol parameters
     */
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /**
     * @dev The Pauser Role - can pause/unpause the protocol
     */
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /**
     * @dev The Deployer Role - can deploy and upgrade contracts
     */
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    /**
     * @dev Protocol pause state
     */
    bool public paused;

    /**
     * @dev Valid liquidity assets mapping
     */
    mapping(address => bool) public isLiquidityAsset;

    /**
     * @dev Protocol fee in basis points
     */
    uint256 public protocolFeeBps;

    /**
     * @dev Valid loan factory addresses
     */
    mapping(address => bool) public isLoanFactory;

    /**
     * @dev Modifier that checks that the caller has the Operator role
     */
    modifier onlyOperator() {
        require(
            hasRole(OPERATOR_ROLE, msg.sender),
            "ServiceConfiguration: caller is not an operator"
        );
        _;
    }

    /**
     * @dev Modifier that checks that the caller has the Pauser role
     */
    modifier onlyPauser() {
        require(
            hasRole(PAUSER_ROLE, msg.sender),
            "ServiceConfiguration: caller is not a pauser"
        );
        _;
    }

    /**
     * @dev Initialize function to setup roles and initial state
     */
    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        // Initialize state
        paused = false;
        protocolFeeBps = 0;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(DEPLOYER_ROLE, msg.sender);
    }

    /**
     * @dev Set a liquidity asset as valid or not
     */
    function setLiquidityAsset(address asset, bool isValid) 
        external 
        onlyOperator 
    {
        isLiquidityAsset[asset] = isValid;
        emit LiquidityAssetSet(asset, isValid);
    }

    /**
     * @dev Set protocol pause state
     */
    function setPaused(bool _paused) external onlyPauser {
        paused = _paused;
        emit ProtocolPaused(_paused);
    }

    /**
     * @dev Set a loan factory as valid or not
     */
    function setLoanFactory(address factory, bool isValid) 
        external 
        onlyOperator 
    {
        isLoanFactory[factory] = isValid;
        emit LoanFactorySet(factory, isValid);
    }

    /**
     * @dev Set protocol fee in basis points
     */
    function setProtocolFeeBps(uint256 _protocolFeeBps) 
        external 
        onlyOperator 
    {
        require(_protocolFeeBps <= 1000, "ServiceConfiguration: Fee too high"); // Max 10%
        protocolFeeBps = _protocolFeeBps;
        emit ProtocolFeeSet(_protocolFeeBps);
    }

    /**
     * @dev Check if an address is a deployer
     */
    function isDeployer(address account) external view returns (bool) {
        return hasRole(DEPLOYER_ROLE, account);
    }

    /**
     * @dev Check if an address is an operator
     */
    function isOperator(address account) external view returns (bool) {
        return hasRole(OPERATOR_ROLE, account);
    }

    /**
     * @dev Required override for UUPS proxy pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override {
        require(
            hasRole(DEPLOYER_ROLE, msg.sender),
            "ServiceConfiguration: caller is not a deployer"
        );
    }
} 