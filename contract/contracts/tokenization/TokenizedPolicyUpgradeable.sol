// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../interfaces/ITokenizedPolicy.sol";

/**
 * @title TokenizedPolicyUpgradeable
 * @dev Upgradeable ERC721 token representing insurance policies
 */
contract TokenizedPolicyUpgradeable is
    ITokenizedPolicy,
    Initializable,
    ERC721Upgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

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
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializer
     * @param name The token name
     * @param symbol The token symbol
     */
    function initialize(string memory name, string memory symbol) external override initializer {
        __ERC721_init(name, symbol);
        __AccessControl_init();
        __UUPSUpgradeable_init();

        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
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
    ) external override onlyRole(MINTER_ROLE) returns (uint256) {
        require(to != address(0), "TokenizedPolicy: Zero address");
        require(issuer != address(0), "TokenizedPolicy: Zero address");
        require(expiryDate > block.timestamp, "TokenizedPolicy: Invalid expiry date");

        uint256 tokenId = _nextTokenId++;
        _mint(to, tokenId);

        _policyDetails[tokenId] = PolicyDetails({
            policyNumber: policyNumber,
            issuer: issuer,
            valuationAmount: valuationAmount,
            expiryDate: expiryDate,
            documentHash: documentHash
        });

        emit PolicyMinted(tokenId, to, policyNumber, issuer, valuationAmount, expiryDate);
        return tokenId;
    }

    /**
     * @dev Updates the valuation of a policy
     * @param tokenId The token ID
     * @param newValuation The new valuation amount
     */
    function updateValuation(uint256 tokenId, uint256 newValuation) external override onlyRole(MINTER_ROLE) {
        require(_exists(tokenId), "TokenizedPolicy: Invalid token ID");

        _policyDetails[tokenId].valuationAmount = newValuation;
        emit PolicyValuationUpdated(tokenId, newValuation);
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
    function getPolicyDetails(uint256 tokenId) external view override returns (
        string memory policyNumber,
        address issuer,
        uint256 valuationAmount,
        uint256 expiryDate,
        bytes32 documentHash
    ) {
        require(_exists(tokenId), "TokenizedPolicy: Invalid token ID");

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
    function getValuation(uint256 tokenId) external view override returns (uint256) {
        require(_exists(tokenId), "TokenizedPolicy: Invalid token ID");
        return _policyDetails[tokenId].valuationAmount;
    }

    /**
     * @dev Gets the expiry date of a policy
     * @param tokenId The token ID
     * @return The policy expiry date timestamp
     */
    function getExpiryDate(uint256 tokenId) external view returns (uint256) {
        require(_exists(tokenId), "TokenizedPolicy: Invalid token ID");
        return _policyDetails[tokenId].expiryDate;
    }

    /**
     * @dev Updates the expiry date of a policy (admin only)
     * @param tokenId The token ID
     * @param newExpiryDate The new expiry date timestamp
     */
    function updatePolicyExpiryDate(uint256 tokenId, uint256 newExpiryDate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(tokenId), "TokenizedPolicy: Invalid token ID");
        require(newExpiryDate > block.timestamp, "TokenizedPolicy: Expiry date must be in the future");

        _policyDetails[tokenId].expiryDate = newExpiryDate;
        emit PolicyExpiryDateUpdated(tokenId, newExpiryDate);
    }



    /**
     * @dev Required by UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    /**
     * @dev See {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}