// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IPolicyOracle
 * @dev Interface for the Policy Oracle that provides valuation and expiry date data
 * and synchronizes policy status with insurance companies
 */
interface IPolicyOracle {
    /**
     * @dev Event emitted when a policy valuation is updated
     */
    event PolicyValuationUpdated(
        string indexed policyNumber,
        uint256 oldValuation,
        uint256 newValuation
    );

    /**
     * @dev Event emitted when a policy expiry date is updated
     */
    event PolicyExpiryUpdated(
        string indexed policyNumber,
        uint256 oldExpiry,
        uint256 newExpiry
    );

    /**
     * @dev Event emitted when a policy status is updated
     */
    event PolicyStatusUpdated(
        string indexed policyNumber,
        uint8 oldStatus,
        uint8 newStatus
    );

    /**
     * @dev Event emitted when a default notification is sent to the insurance company
     */
    event DefaultNotificationSent(
        string indexed policyNumber,
        address indexed liquidator,
        uint256 timestamp
    );

    /**
     * @dev Event emitted when default details are provided
     */
    event DefaultDetails(
        string indexed policyNumber,
        string details
    );

    /**
     * @dev Gets the current valuation for a policy
     * @param policyNumber The policy number
     * @return The current valuation amount in USD (with 6 decimals)
     */
    function getPolicyValuation(string memory policyNumber) external view returns (uint256);

    /**
     * @dev Gets the current expiry date for a policy
     * @param policyNumber The policy number
     * @return The expiry date as a Unix timestamp
     */
    function getPolicyExpiryDate(string memory policyNumber) external view returns (uint256);

    /**
     * @dev Requests an update for policy valuation from the oracle
     * @param policyNumber The policy number
     * @return requestId The ID of the oracle request
     */
    function requestPolicyValuationUpdate(string memory policyNumber) external returns (bytes32 requestId);

    /**
     * @dev Requests an update for policy expiry date from the oracle
     * @param policyNumber The policy number
     * @return requestId The ID of the oracle request
     */
    function requestPolicyExpiryUpdate(string memory policyNumber) external returns (bytes32 requestId);

    /**
     * @dev Gets the current status for a policy
     * @param policyNumber The policy number
     * @return The current policy status (0=Active, 1=Expired, 2=Defaulted, 3=Claimed, 4=Cancelled)
     */
    function getPolicyStatus(string memory policyNumber) external view returns (uint8);

    /**
     * @dev Notifies the insurance company about a policy default
     * @param policyNumber The policy number
     * @param liquidator The address that liquidated the loan
     * @param details Additional details about the default
     * @return requestId The ID of the oracle request
     */
    function notifyPolicyDefault(string memory policyNumber, address liquidator, string memory details) external returns (bytes32 requestId);

    /**
     * @dev Requests an update for policy status from the oracle
     * @param policyNumber The policy number
     * @return requestId The ID of the oracle request
     */
    function requestPolicyStatusUpdate(string memory policyNumber) external returns (bytes32 requestId);
}
