// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ITokenizedPolicy
 * @dev Interface for tokenized insurance policies using ERC721
 */
interface ITokenizedPolicy {
    /**
     * @dev Initializes the contract with the given parameters
     * @param name The name of the token
     * @param symbol The symbol of the token
     */
    function initialize(string memory name, string memory symbol) external;

    /**
     * @dev Returns the policy details for a token
     * @param tokenId The token ID
     * @return policyNumber The policy number
     * @return issuer The policy issuer
     * @return valuationAmount The current valuation amount
     * @return expiryDate The expiry date of the policy
     */
    function getPolicyDetails(uint256 tokenId) external view returns (
        string memory policyNumber,
        address issuer,
        uint256 valuationAmount,
        uint256 expiryDate
    );
    
    /**
     * @dev Mints a new tokenized policy to the recipient
     * @param recipient The address to receive the token
     * @param policyNumber The policy number
     * @param issuer The policy issuer
     * @param valuationAmount The initial valuation amount
     * @param expiryDate The expiry date of the policy
     * @param documentHash Hash of the policy document
     * @return tokenId The minted token ID
     */
    function mintPolicy(
        address recipient,
        string calldata policyNumber,
        address issuer,
        uint256 valuationAmount,
        uint256 expiryDate,
        bytes32 documentHash
    ) external returns (uint256 tokenId);
    
    /**
     * @dev Updates the valuation of a tokenized policy
     * @param tokenId The token ID
     * @param newValuation The new valuation amount
     */
    function updateValuation(uint256 tokenId, uint256 newValuation) external;
} 