// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IPolicyOracle.sol";

/**
 * @title MockPolicyOracle
 * @dev Mock implementation of the Policy Oracle for testing
 * In a production environment, this would be replaced with a Chainlink Oracle
 */
contract MockPolicyOracle is IPolicyOracle, AccessControl {
    // Roles
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // Policy data mappings
    mapping(string => uint256) private _policyValuations;
    mapping(string => uint256) private _policyExpiryDates;
    mapping(string => uint8) private _policyStatuses;

    // Request counter for simulating request IDs
    uint256 private _requestCounter;

    // Policy status constants
    uint8 public constant POLICY_STATUS_ACTIVE = 0;
    uint8 public constant POLICY_STATUS_EXPIRED = 1;
    uint8 public constant POLICY_STATUS_DEFAULTED = 2;
    uint8 public constant POLICY_STATUS_CLAIMED = 3;
    uint8 public constant POLICY_STATUS_CANCELLED = 4;

    /**
     * @dev Constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    /**
     * @dev Gets the current status for a policy
     * @param policyNumber The policy number
     * @return The current policy status
     */
    function getPolicyStatus(string memory policyNumber) external view override returns (uint8) {
        // If no status is set, return ACTIVE by default
        if (_policyStatuses[policyNumber] == 0 && _policyExpiryDates[policyNumber] == 0) {
            return POLICY_STATUS_ACTIVE;
        }

        // If policy has expired, return EXPIRED
        if (_policyExpiryDates[policyNumber] > 0 && _policyExpiryDates[policyNumber] < block.timestamp) {
            return POLICY_STATUS_EXPIRED;
        }

        return _policyStatuses[policyNumber];
    }

    /**
     * @dev Gets the current valuation for a policy
     * @param policyNumber The policy number
     * @return The current valuation amount in USD (with 6 decimals)
     */
    function getPolicyValuation(string memory policyNumber) external view override returns (uint256) {
        return _policyValuations[policyNumber];
    }

    /**
     * @dev Gets the current expiry date for a policy
     * @param policyNumber The policy number
     * @return The expiry date as a Unix timestamp
     */
    function getPolicyExpiryDate(string memory policyNumber) external view override returns (uint256) {
        return _policyExpiryDates[policyNumber];
    }

    /**
     * @dev Requests an update for policy valuation from the oracle
     * @param policyNumber The policy number
     * @return requestId The ID of the oracle request
     */
    function requestPolicyValuationUpdate(string memory policyNumber) external override returns (bytes32 requestId) {
        // In a real implementation, this would send a request to Chainlink
        // For the mock, we'll just return a simulated request ID
        _requestCounter++;
        return keccak256(abi.encodePacked(policyNumber, "valuation", _requestCounter));
    }

    /**
     * @dev Requests an update for policy expiry date from the oracle
     * @param policyNumber The policy number
     * @return requestId The ID of the oracle request
     */
    function requestPolicyExpiryUpdate(string memory policyNumber) external override returns (bytes32 requestId) {
        // In a real implementation, this would send a request to Chainlink
        // For the mock, we'll just return a simulated request ID
        _requestCounter++;
        return keccak256(abi.encodePacked(policyNumber, "expiry", _requestCounter));
    }

    /**
     * @dev Sets the valuation for a policy (mock function)
     * @param policyNumber The policy number
     * @param valuation The valuation amount
     */
    function setPolicyValuation(string memory policyNumber, uint256 valuation) external onlyRole(ORACLE_ROLE) {
        uint256 oldValuation = _policyValuations[policyNumber];
        _policyValuations[policyNumber] = valuation;

        emit PolicyValuationUpdated(policyNumber, oldValuation, valuation);
    }

    /**
     * @dev Sets the expiry date for a policy (mock function)
     * @param policyNumber The policy number
     * @param expiryDate The expiry date
     */
    function setPolicyExpiryDate(string memory policyNumber, uint256 expiryDate) external onlyRole(ORACLE_ROLE) {
        uint256 oldExpiry = _policyExpiryDates[policyNumber];
        _policyExpiryDates[policyNumber] = expiryDate;

        emit PolicyExpiryUpdated(policyNumber, oldExpiry, expiryDate);
    }

    /**
     * @dev Fulfills a policy valuation update request (mock function)
     * This simulates the callback from Chainlink
     * @param requestId The request ID
     * @param policyNumber The policy number
     * @param valuation The valuation amount
     */
    function fulfillPolicyValuationUpdate(
        bytes32 requestId,
        string memory policyNumber,
        uint256 valuation
    ) external onlyRole(ORACLE_ROLE) {
        // In a real implementation, this would be called by the Chainlink node
        // For the mock, we'll just update the value directly
        uint256 oldValuation = _policyValuations[policyNumber];
        _policyValuations[policyNumber] = valuation;

        emit PolicyValuationUpdated(policyNumber, oldValuation, valuation);
    }

    /**
     * @dev Fulfills a policy expiry date update request (mock function)
     * This simulates the callback from Chainlink
     * @param requestId The request ID
     * @param policyNumber The policy number
     * @param expiryDate The expiry date
     */
    function fulfillPolicyExpiryUpdate(
        bytes32 requestId,
        string memory policyNumber,
        uint256 expiryDate
    ) external onlyRole(ORACLE_ROLE) {
        // In a real implementation, this would be called by the Chainlink node
        // For the mock, we'll just update the value directly
        uint256 oldExpiry = _policyExpiryDates[policyNumber];
        _policyExpiryDates[policyNumber] = expiryDate;

        emit PolicyExpiryUpdated(policyNumber, oldExpiry, expiryDate);
    }

    /**
     * @dev Notifies the insurance company about a policy default
     * @param policyNumber The policy number
     * @param liquidator The address that liquidated the loan
     * @param details Additional details about the default
     * @return requestId The ID of the oracle request
     */
    function notifyPolicyDefault(
        string memory policyNumber,
        address liquidator,
        string memory details
    ) external override returns (bytes32 requestId) {
        // In a real implementation, this would send a notification to the insurance company
        // via Chainlink's Any API functionality
        _requestCounter++;
        requestId = keccak256(abi.encodePacked(policyNumber, "default", _requestCounter));

        // Update policy status to DEFAULTED
        uint8 oldStatus = _policyStatuses[policyNumber];
        _policyStatuses[policyNumber] = POLICY_STATUS_DEFAULTED;

        emit PolicyStatusUpdated(policyNumber, oldStatus, POLICY_STATUS_DEFAULTED);
        emit DefaultNotificationSent(policyNumber, liquidator, block.timestamp);

        return requestId;
    }

    /**
     * @dev Requests an update for policy status from the oracle
     * @param policyNumber The policy number
     * @return requestId The ID of the oracle request
     */
    function requestPolicyStatusUpdate(string memory policyNumber) external override returns (bytes32 requestId) {
        // In a real implementation, this would send a request to Chainlink
        // For the mock, we'll just return a simulated request ID
        _requestCounter++;
        return keccak256(abi.encodePacked(policyNumber, "status", _requestCounter));
    }

    /**
     * @dev Sets the status for a policy (mock function)
     * @param policyNumber The policy number
     * @param status The policy status
     */
    function setPolicyStatus(string memory policyNumber, uint8 status) external onlyRole(ORACLE_ROLE) {
        require(status <= POLICY_STATUS_CANCELLED, "MockPolicyOracle: Invalid status");

        uint8 oldStatus = _policyStatuses[policyNumber];
        _policyStatuses[policyNumber] = status;

        emit PolicyStatusUpdated(policyNumber, oldStatus, status);
    }

    /**
     * @dev Fulfills a policy status update request (mock function)
     * This simulates the callback from Chainlink
     * @param requestId The request ID
     * @param policyNumber The policy number
     * @param status The policy status
     */
    function fulfillPolicyStatusUpdate(
        bytes32 requestId,
        string memory policyNumber,
        uint8 status
    ) external onlyRole(ORACLE_ROLE) {
        require(status <= POLICY_STATUS_CANCELLED, "MockPolicyOracle: Invalid status");

        // In a real implementation, this would be called by the Chainlink node
        // For the mock, we'll just update the value directly
        uint8 oldStatus = _policyStatuses[policyNumber];
        _policyStatuses[policyNumber] = status;

        emit PolicyStatusUpdated(policyNumber, oldStatus, status);
    }
}
