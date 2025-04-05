// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ITokenizedPolicy
 * @dev Interface for TokenizedPolicy contract
 */
interface ITokenizedPolicy {
    // Events
    event PolicyMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string policyNumber,
        address issuer,
        uint256 valuationAmount,
        uint256 expiryDate
    );

    event PolicyValuationUpdated(
        uint256 indexed tokenId,
        uint256 newValuation
    );

    /**
     * @dev Initializes the contract
     * @param name The token name
     * @param symbol The token symbol
     */
    function initialize(string memory name, string memory symbol) external;

    /**
     * @dev Mints a new policy token
     * @param to The recipient address
     * @param policyNumber The policy number
     * @param issuer The policy issuer
     * @param valuationAmount The policy valuation amount
     * @param expiryDate The policy expiry date
     * @param documentHash The policy document hash
     * @return tokenId The minted token ID
     */
    function mintPolicy(
        address to,
        string memory policyNumber,
        address issuer,
        uint256 valuationAmount,
        uint256 expiryDate,
        bytes32 documentHash
    ) external returns (uint256);

    /**
     * @dev Updates the valuation of a policy
     * @param tokenId The token ID
     * @param newValuation The new valuation amount
     */
    function updateValuation(uint256 tokenId, uint256 newValuation) external;

    /**
     * @dev Gets the details of a policy
     * @param tokenId The token ID
     * @return policyNumber The policy number
     * @return issuer The policy issuer
     * @return valuationAmount The policy valuation amount
     * @return expiryDate The policy expiry date
     * @return documentHash The policy document hash
     */
    function getPolicyDetails(uint256 tokenId) external view returns (
        string memory policyNumber,
        address issuer,
        uint256 valuationAmount,
        uint256 expiryDate,
        bytes32 documentHash
    );

    /**
     * @dev Gets the valuation of a policy
     * @param tokenId The token ID
     * @return The policy valuation amount
     */
    function getValuation(uint256 tokenId) external view returns (uint256);
} 