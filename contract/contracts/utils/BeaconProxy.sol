// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Address.sol";
import "./UpgradeableBeacon.sol";

/**
 * @title BeaconProxy
 * @dev A proxy that retrieves its implementation address from a beacon contract.
 * This proxy is specifically designed for the QuickFi protocol.
 */
contract BeaconProxy {
    using Address for address;
    
    /**
     * @dev Storage slot with the beacon contract address.
     * This slot is unlikely to be used by derived contracts.
     */
    bytes32 private constant _BEACON_SLOT = bytes32(uint256(keccak256("quickfi.proxy.beacon")) - 1);
    
    /**
     * @dev Constructor for the BeaconProxy contract.
     * @param beacon Address of the beacon contract from which to retrieve the implementation.
     * @param data Initialization call data to be forwarded to the implementation upon construction.
     */
    constructor(address beacon, bytes memory data) {
        _setBeacon(beacon);
        
        if (data.length > 0) {
            Address.functionDelegateCall(
                _implementation(),
                data,
                "BeaconProxy: initialization failed"
            );
        }
    }
    
    /**
     * @dev Returns the current implementation address.
     */
    function _implementation() internal view returns (address) {
        return UpgradeableBeacon(_getBeacon()).implementation();
    }
    
    /**
     * @dev Returns the beacon address.
     */
    function _getBeacon() internal view returns (address) {
        bytes32 slot = _BEACON_SLOT;
        address beacon;
        
        assembly {
            beacon := sload(slot)
        }
        
        return beacon;
    }
    
    /**
     * @dev Sets the beacon address.
     * @param beacon Address of the beacon contract.
     */
    function _setBeacon(address beacon) internal {
        require(
            beacon.isContract(),
            "BeaconProxy: beacon is not a contract"
        );
        
        bytes32 slot = _BEACON_SLOT;
        
        assembly {
            sstore(slot, beacon)
        }
    }
    
    /**
     * @dev Delegates the current call to the implementation retrieved from the beacon.
     */
    function _fallback() internal {
        _delegate(_implementation());
    }
    
    /**
     * @dev Delegates a call to a specified implementation address.
     * @param implementation Address to which the call will be delegated.
     */
    function _delegate(address implementation) internal {
        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())
            
            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), implementation, 0, calldatasize(), 0, 0)
            
            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())
            
            switch result
            // delegatecall returns 0 on error.
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
    
    /**
     * @dev External fallback function performs a delegation of the call to the implementation.
     * Will run if no other function in the contract matches the call data.
     */
    fallback() external payable {
        _fallback();
    }
    
    /**
     * @dev External receive function triggers the fallback function.
     */
    receive() external payable {
        _fallback();
    }
} 