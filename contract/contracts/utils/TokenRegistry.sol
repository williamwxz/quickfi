// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TokenRegistry
 * @dev Registry for supported stablecoins in the QuickFi protocol
 */
contract TokenRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    struct TokenInfo {
        bool isSupported;
        uint8 decimals;
        uint256 minLoanAmount;
        uint256 maxLoanAmount;
    }
    
    mapping(address => TokenInfo) private _supportedTokens;
    address[] private _tokenList;
    
    event TokenAdded(address indexed token, uint8 decimals, uint256 minLoanAmount, uint256 maxLoanAmount);
    event TokenRemoved(address indexed token);
    event TokenUpdated(address indexed token, uint8 decimals, uint256 minLoanAmount, uint256 maxLoanAmount);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Add a supported stablecoin
     * @param token The token address
     * @param decimals The token decimals
     * @param minLoanAmount The minimum loan amount
     * @param maxLoanAmount The maximum loan amount
     */
    function addToken(address token, uint8 decimals, uint256 minLoanAmount, uint256 maxLoanAmount) external onlyRole(ADMIN_ROLE) {
        require(token != address(0), "TokenRegistry: Token cannot be zero address");
        require(!_supportedTokens[token].isSupported, "TokenRegistry: Token already supported");
        
        _supportedTokens[token] = TokenInfo({
            isSupported: true,
            decimals: decimals,
            minLoanAmount: minLoanAmount,
            maxLoanAmount: maxLoanAmount
        });
        
        _tokenList.push(token);
        
        emit TokenAdded(token, decimals, minLoanAmount, maxLoanAmount);
    }
    
    /**
     * @dev Remove a supported stablecoin
     * @param token The token address
     */
    function removeToken(address token) external onlyRole(ADMIN_ROLE) {
        require(_supportedTokens[token].isSupported, "TokenRegistry: Token not supported");
        
        _supportedTokens[token].isSupported = false;
        
        // Remove from list (find and replace with last element, then pop)
        for (uint256 i = 0; i < _tokenList.length; i++) {
            if (_tokenList[i] == token) {
                _tokenList[i] = _tokenList[_tokenList.length - 1];
                _tokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(token);
    }
    
    /**
     * @dev Update a supported stablecoin
     * @param token The token address
     * @param decimals The token decimals
     * @param minLoanAmount The minimum loan amount
     * @param maxLoanAmount The maximum loan amount
     */
    function updateToken(address token, uint8 decimals, uint256 minLoanAmount, uint256 maxLoanAmount) external onlyRole(ADMIN_ROLE) {
        require(_supportedTokens[token].isSupported, "TokenRegistry: Token not supported");
        
        _supportedTokens[token].decimals = decimals;
        _supportedTokens[token].minLoanAmount = minLoanAmount;
        _supportedTokens[token].maxLoanAmount = maxLoanAmount;
        
        emit TokenUpdated(token, decimals, minLoanAmount, maxLoanAmount);
    }
    
    /**
     * @dev Check if a token is supported
     * @param token The token address
     * @return Whether the token is supported
     */
    function isTokenSupported(address token) external view returns (bool) {
        return _supportedTokens[token].isSupported;
    }
    
    /**
     * @dev Get token information
     * @param token The token address
     * @return The token information
     */
    function getTokenInfo(address token) external view returns (TokenInfo memory) {
        require(_supportedTokens[token].isSupported, "TokenRegistry: Token not supported");
        return _supportedTokens[token];
    }
    
    /**
     * @dev Get all supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return _tokenList;
    }
}
