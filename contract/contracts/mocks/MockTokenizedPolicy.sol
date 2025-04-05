// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockTokenizedPolicy
 * @dev Mock contract for TokenizedPolicy used in tests
 */
contract MockTokenizedPolicy is ERC721, Ownable {
    // Policy details struct
    struct PolicyDetails {
        string policyNumber;
        address issuer;
        uint256 valuationAmount;
        uint256 expiryDate;
        bytes32 documentHash;
    }

    // Policy details
    mapping(uint256 => PolicyDetails) private _policyDetails;
    uint256 private _nextTokenId;

    /**
     * @dev Constructor
     * @param name The token name
     * @param symbol The token symbol
     */
    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable() {}

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
    ) external returns (uint256) {
        require(to != address(0), "MockTokenizedPolicy: Zero address");
        require(issuer != address(0), "MockTokenizedPolicy: Zero address");
        // Don't check expiry date for testing purposes

        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);

        _policyDetails[tokenId] = PolicyDetails({
            policyNumber: policyNumber,
            issuer: issuer,
            valuationAmount: valuationAmount,
            expiryDate: expiryDate,
            documentHash: documentHash
        });

        return tokenId;
    }

    /**
     * @dev Updates the valuation of a policy
     * @param tokenId The token ID
     * @param newValuation The new valuation amount
     */
    function updateValuation(uint256 tokenId, uint256 newValuation) external {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");
        _policyDetails[tokenId].valuationAmount = newValuation;
    }

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
    ) {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");

        PolicyDetails memory details = _policyDetails[tokenId];
        return (
            details.policyNumber,
            details.issuer,
            details.valuationAmount,
            details.expiryDate,
            details.documentHash
        );
    }

    /**
     * @dev Gets the valuation of a policy
     * @param tokenId The token ID
     * @return The policy valuation amount
     */
    function getValuation(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");
        return _policyDetails[tokenId].valuationAmount;
    }
} 