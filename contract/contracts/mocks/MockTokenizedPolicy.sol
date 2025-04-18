// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IPolicyOracle.sol";

/**
 * @title MockTokenizedPolicy
 * @dev Mock contract for TokenizedPolicy used in tests
 */
contract MockTokenizedPolicy is ERC721, Ownable {
    // Oracle address
    IPolicyOracle public policyOracle;

    // Flag to determine if oracle should be used
    bool public useOracle;
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
    constructor(string memory name, string memory symbol) ERC721(name, symbol) Ownable() {
        // By default, don't use oracle
        useOracle = false;
    }

    /**
     * @dev Sets the policy oracle address
     * @param oracle The oracle address
     * @param _useOracle Whether to use the oracle
     */
    function setPolicyOracle(address oracle, bool _useOracle) external onlyOwner {
        require(oracle != address(0), "MockTokenizedPolicy: Zero address");
        policyOracle = IPolicyOracle(oracle);
        useOracle = _useOracle;
    }

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

        if (useOracle && address(policyOracle) != address(0)) {
            // Get the policy number
            string memory policyNumber = _policyDetails[tokenId].policyNumber;

            // Get valuation from oracle
            return policyOracle.getPolicyValuation(policyNumber);
        } else {
            // Use stored valuation
            return _policyDetails[tokenId].valuationAmount;
        }
    }

    /**
     * @dev Gets the expiry date of a policy
     * @param tokenId The token ID
     * @return The policy expiry date
     */
    function getExpiryDate(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");

        if (useOracle && address(policyOracle) != address(0)) {
            // Get the policy number
            string memory policyNumber = _policyDetails[tokenId].policyNumber;

            // Get expiry date from oracle
            return policyOracle.getPolicyExpiryDate(policyNumber);
        } else {
            // Use stored expiry date
            return _policyDetails[tokenId].expiryDate;
        }
    }

    /**
     * @dev Gets the status of a policy
     * @param tokenId The token ID
     * @return The policy status (0=Active, 1=Expired, 2=Defaulted, 3=Claimed, 4=Cancelled)
     */
    function getPolicyStatus(uint256 tokenId) external view returns (uint8) {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");

        if (useOracle && address(policyOracle) != address(0)) {
            // Get the policy number
            string memory policyNumber = _policyDetails[tokenId].policyNumber;

            // Get status from oracle
            return policyOracle.getPolicyStatus(policyNumber);
        } else {
            // If no oracle, check if policy is expired
            if (_policyDetails[tokenId].expiryDate < block.timestamp) {
                return 1; // EXPIRED
            } else {
                return 0; // ACTIVE
            }
        }
    }

    /**
     * @dev Requests an update for policy valuation from the oracle
     * @param tokenId The token ID
     * @return requestId The ID of the oracle request
     */
    function requestValuationUpdate(uint256 tokenId) external returns (bytes32) {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");
        require(useOracle && address(policyOracle) != address(0), "MockTokenizedPolicy: Oracle not set");

        // Get the policy number
        string memory policyNumber = _policyDetails[tokenId].policyNumber;

        // Request update from oracle
        return policyOracle.requestPolicyValuationUpdate(policyNumber);
    }

    /**
     * @dev Requests an update for policy expiry date from the oracle
     * @param tokenId The token ID
     * @return requestId The ID of the oracle request
     */
    function requestExpiryUpdate(uint256 tokenId) external returns (bytes32) {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");
        require(useOracle && address(policyOracle) != address(0), "MockTokenizedPolicy: Oracle not set");

        // Get the policy number
        string memory policyNumber = _policyDetails[tokenId].policyNumber;

        // Request update from oracle
        return policyOracle.requestPolicyExpiryUpdate(policyNumber);
    }

    /**
     * @dev Requests an update for policy status from the oracle
     * @param tokenId The token ID
     * @return requestId The ID of the oracle request
     */
    function requestStatusUpdate(uint256 tokenId) external returns (bytes32) {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");
        require(useOracle && address(policyOracle) != address(0), "MockTokenizedPolicy: Oracle not set");

        // Get the policy number
        string memory policyNumber = _policyDetails[tokenId].policyNumber;

        // Request update from oracle
        return policyOracle.requestPolicyStatusUpdate(policyNumber);
    }

    /**
     * @dev Notifies the insurance company about a policy default
     * @param tokenId The token ID
     * @param liquidator The address that liquidated the loan
     * @param details Additional details about the default
     * @return requestId The ID of the oracle request
     */
    function notifyPolicyDefault(uint256 tokenId, address liquidator, string memory details) external returns (bytes32) {
        require(_exists(tokenId), "MockTokenizedPolicy: Invalid token ID");
        require(useOracle && address(policyOracle) != address(0), "MockTokenizedPolicy: Oracle not set");

        // Get the policy number
        string memory policyNumber = _policyDetails[tokenId].policyNumber;

        // Notify insurance company via oracle
        return policyOracle.notifyPolicyDefault(policyNumber, liquidator, details);
    }
}