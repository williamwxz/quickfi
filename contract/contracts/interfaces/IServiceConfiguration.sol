// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IServiceConfiguration
 * @dev Interface for the service configuration contract
 */
interface IServiceConfiguration {
    /**
     * @dev Emitted when a liquidity asset is set
     */
    event LiquidityAssetSet(address indexed asset, bool isValid);

    /**
     * @dev Emitted when protocol pause state changes
     */
    event ProtocolPaused(bool isPaused);

    /**
     * @dev Emitted when a loan factory is set
     */
    event LoanFactorySet(address indexed factory, bool isValid);

    /**
     * @dev Emitted when protocol fee is set
     */
    event ProtocolFeeSet(uint256 feeBps);

    /**
     * @dev Set a liquidity asset as valid or not
     */
    function setLiquidityAsset(address asset, bool isValid) external;

    /**
     * @dev Set protocol pause state
     */
    function setPaused(bool _paused) external;

    /**
     * @dev Set a loan factory as valid or not
     */
    function setLoanFactory(address factory, bool isValid) external;

    /**
     * @dev Set protocol fee in basis points
     */
    function setProtocolFeeBps(uint256 _protocolFeeBps) external;

    /**
     * @dev Check if an address is a deployer
     */
    function isDeployer(address account) external view returns (bool);

    /**
     * @dev Check if an address is an operator
     */
    function isOperator(address account) external view returns (bool);

    /**
     * @dev Check if protocol is paused
     */
    function paused() external view returns (bool);

    /**
     * @dev Check if an asset is a valid liquidity asset
     */
    function isLiquidityAsset(address asset) external view returns (bool);

    /**
     * @dev Get protocol fee in basis points
     */
    function protocolFeeBps() external view returns (uint256);

    /**
     * @dev Check if an address is a valid loan factory
     */
    function isLoanFactory(address factory) external view returns (bool);
} 