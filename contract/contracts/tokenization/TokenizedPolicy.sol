// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/ITokenizedPolicy.sol";

/**
 * @title TokenizedPolicy
 * @dev Implementation of tokenized insurance policies as NFTs
 */
contract TokenizedPolicy is ERC721URIStorage, AccessControl, ITokenizedPolicy {
    using Counters for Counters.Counter;
    
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VALUATOR_ROLE = keccak256("VALUATOR_ROLE");
    
    Counters.Counter private _tokenIdCounter;
    
    // Mapping from token ID to policy details
    struct PolicyData {
        string policyNumber;
        address issuer;
        uint256 valuationAmount;
        uint256 expiryDate;
        bytes32 documentHash;
    }
    
    mapping(uint256 => PolicyData) private _policies;
    
    // Events
    event PolicyMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string policyNumber,
        uint256 valuationAmount
    );
    
    event ValuationUpdated(
        uint256 indexed tokenId,
        uint256 oldValuation,
        uint256 newValuation
    );
    
    /**
     * @dev Constructor for TokenizedPolicy contract
     * @param name Name of the ERC721 token
     * @param symbol Symbol of the ERC721 token
     */
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VALUATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev See {ITokenizedPolicy-getPolicyDetails}
     */
    function getPolicyDetails(uint256 tokenId) external view override returns (
        string memory policyNumber,
        address issuer,
        uint256 valuationAmount,
        uint256 expiryDate
    ) {
        require(_exists(tokenId), "TokenizedPolicy: Policy does not exist");
        PolicyData storage policy = _policies[tokenId];
        return (
            policy.policyNumber,
            policy.issuer,
            policy.valuationAmount,
            policy.expiryDate
        );
    }
    
    /**
     * @dev See {ITokenizedPolicy-mintPolicy}
     */
    function mintPolicy(
        address recipient,
        string calldata policyNumber,
        address issuer,
        uint256 valuationAmount,
        uint256 expiryDate,
        bytes32 documentHash
    ) external override returns (uint256) {
        require(hasRole(MINTER_ROLE, msg.sender), "TokenizedPolicy: Must have minter role");
        require(recipient != address(0), "TokenizedPolicy: Cannot mint to zero address");
        require(bytes(policyNumber).length > 0, "TokenizedPolicy: Policy number cannot be empty");
        require(issuer != address(0), "TokenizedPolicy: Issuer cannot be zero address");
        require(valuationAmount > 0, "TokenizedPolicy: Valuation must be greater than zero");
        require(expiryDate > block.timestamp, "TokenizedPolicy: Policy must not be expired");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(recipient, tokenId);
        
        _policies[tokenId] = PolicyData({
            policyNumber: policyNumber,
            issuer: issuer,
            valuationAmount: valuationAmount,
            expiryDate: expiryDate,
            documentHash: documentHash
        });
        
        emit PolicyMinted(tokenId, recipient, policyNumber, valuationAmount);
        
        return tokenId;
    }
    
    /**
     * @dev See {ITokenizedPolicy-updateValuation}
     */
    function updateValuation(uint256 tokenId, uint256 newValuation) external override {
        require(hasRole(VALUATOR_ROLE, msg.sender), "TokenizedPolicy: Must have valuator role");
        require(_exists(tokenId), "TokenizedPolicy: Policy does not exist");
        require(newValuation > 0, "TokenizedPolicy: Valuation must be greater than zero");
        
        uint256 oldValuation = _policies[tokenId].valuationAmount;
        _policies[tokenId].valuationAmount = newValuation;
        
        emit ValuationUpdated(tokenId, oldValuation, newValuation);
    }
    
    /**
     * @dev Gets the document hash for a policy
     * @param tokenId The token ID
     * @return documentHash The document hash
     */
    function getDocumentHash(uint256 tokenId) external view returns (bytes32) {
        require(_exists(tokenId), "TokenizedPolicy: Policy does not exist");
        return _policies[tokenId].documentHash;
    }
    
    /**
     * @dev Checks if a policy is expired
     * @param tokenId The token ID
     * @return expired Whether the policy is expired
     */
    function isExpired(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "TokenizedPolicy: Policy does not exist");
        return block.timestamp > _policies[tokenId].expiryDate;
    }
    
    // Override required by Solidity
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 