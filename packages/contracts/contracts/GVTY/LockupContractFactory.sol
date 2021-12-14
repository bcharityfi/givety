// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/CheckContract.sol";
import "../Dependencies/SafeMath.sol";
import "../Dependencies/Ownable.sol";
import "../Interfaces/ILockupContractFactory.sol";
import "./LockupContract.sol";
import "../Dependencies/console.sol";

/*
* The LockupContractFactory deploys LockupContracts - its main purpose is to keep a registry of valid deployed 
* LockupContracts. 
* 
* This registry is checked by GVTYToken when the Givety deployer attempts to transfer GVTY tokens. During the first year 
* since system deployment, the Givety deployer is only allowed to transfer GVTY to valid LockupContracts that have been 
* deployed by and recorded in the LockupContractFactory. This ensures the deployer's GVTY can't be traded or staked in the
* first year, and can only be sent to a verified LockupContract which unlocks at least one year after system deployment.
*
* LockupContracts can of course be deployed directly, but only those deployed through and recorded in the LockupContractFactory 
* will be considered "valid" by GVTYToken. This is a convenient way to verify that the target address is a genuine 
* LockupContract.
*/

contract LockupContractFactory is ILockupContractFactory, Ownable, CheckContract {
    using SafeMath for uint;

    // --- Data ---
    string constant public NAME = "LockupContractFactory";

    uint constant public SECONDS_IN_ONE_YEAR = 31536000;

    address public gvtyTokenAddress;
    
    mapping (address => address) public lockupContractToDeployer;

    // --- Events ---

    event GVTYTokenAddressSet(address _gvtyTokenAddress);
    event LockupContractDeployedThroughFactory(address _lockupContractAddress, address _beneficiary, uint _unlockTime, address _deployer);

    // --- Functions ---

    function setGVTYTokenAddress(address _gvtyTokenAddress) external override onlyOwner {
        checkContract(_gvtyTokenAddress);

        gvtyTokenAddress = _gvtyTokenAddress;
        emit GVTYTokenAddressSet(_gvtyTokenAddress);

        _renounceOwnership();
    }

    function deployLockupContract(address _beneficiary, uint _unlockTime) external override {
        address gvtyTokenAddressCached = gvtyTokenAddress;
        _requireGVTYAddressIsSet(gvtyTokenAddressCached);
        LockupContract lockupContract = new LockupContract(
                                                        gvtyTokenAddressCached,
                                                        _beneficiary, 
                                                        _unlockTime);

        lockupContractToDeployer[address(lockupContract)] = msg.sender;
        emit LockupContractDeployedThroughFactory(address(lockupContract), _beneficiary, _unlockTime, msg.sender);
    }

    function isRegisteredLockup(address _contractAddress) public view override returns (bool) {
        return lockupContractToDeployer[_contractAddress] != address(0);
    }

    // --- 'require'  functions ---
    function _requireGVTYAddressIsSet(address _gvtyTokenAddress) internal pure {
        require(_gvtyTokenAddress != address(0), "LCF: GVTY Address is not set");
    }
}
