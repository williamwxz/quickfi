// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ITokenRegistry
 * @dev Interface for TokenRegistry contract
 */
interface ITokenRegistry {
    struct TokenInfo {
        bool isSupported;
        uint8 decimals;
        uint256 minLoanAmount;
        uint256 maxLoanAmount;
    }
    
    function addToken(address token, uint8 decimals, uint256 minLoanAmount, uint256 maxLoanAmount) external;
    function removeToken(address token) external;
    function updateToken(address token, uint8 decimals, uint256 minLoanAmount, uint256 maxLoanAmount) external;
    function isTokenSupported(address token) external view returns (bool);
    function getTokenInfo(address token) external view returns (TokenInfo memory);
    function getSupportedTokens() external view returns (address[] memory);
}
