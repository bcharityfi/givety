// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import './Interfaces/IDefaultPool.sol';
import "./Dependencies/SafeMath.sol";
import "./Dependencies/Ownable.sol";
import "./Dependencies/CheckContract.sol";
import "./Dependencies/console.sol";

/*
 * The Default Pool holds the GIVE and GUSD debt (but not GUSD tokens) from liquidations that have been redistributed
 * to active troves but not yet "applied", i.e. not yet recorded on a recipient active trove's struct.
 *
 * When a trove makes an operation that applies its pending GIVE and GUSD debt, its pending GIVE and GUSD debt is moved
 * from the Default Pool to the Active Pool.
 */
contract DefaultPool is Ownable, CheckContract, IDefaultPool {
    using SafeMath for uint256;

    string constant public NAME = "DefaultPool";

    address public troveManagerAddress;
    address public activePoolAddress;
    uint256 internal GIVE;  // deposited GIVE tracker
    uint256 internal GUSDDebt;  // debt

    event TroveManagerAddressChanged(address _newTroveManagerAddress);
    event DefaultPoolGUSDDebtUpdated(uint _GUSDDebt);
    event DefaultPoolGIVEBalanceUpdated(uint _GIVE);

    // --- Dependency setters ---

    function setAddresses(
        address _troveManagerAddress,
        address _activePoolAddress
    )
        external
        onlyOwner
    {
        checkContract(_troveManagerAddress);
        checkContract(_activePoolAddress);

        troveManagerAddress = _troveManagerAddress;
        activePoolAddress = _activePoolAddress;

        emit TroveManagerAddressChanged(_troveManagerAddress);
        emit ActivePoolAddressChanged(_activePoolAddress);

        _renounceOwnership();
    }

    // --- Getters for public variables. Required by IPool interface ---

    /*
    * Returns the GIVE state variable.
    *
    * Not necessarily equal to the the contract's raw GIVE balance - give can be forcibly sent to contracts.
    */
    function getGIVE() external view override returns (uint) {
        return GIVE;
    }

    function getGUSDDebt() external view override returns (uint) {
        return GUSDDebt;
    }

    // --- Pool functionality ---

    function sendGIVEToActivePool(uint _amount) external override {
        _requireCallerIsTroveManager();
        address activePool = activePoolAddress; // cache to save an SLOAD
        GIVE = GIVE.sub(_amount);
        emit DefaultPoolGIVEBalanceUpdated(GIVE);
        emit EtherSent(activePool, _amount);

        (bool success, ) = activePool.call{ value: _amount }("");
        require(success, "DefaultPool: sending GIVE failed");
    }

    function increaseGUSDDebt(uint _amount) external override {
        _requireCallerIsTroveManager();
        GUSDDebt = GUSDDebt.add(_amount);
        emit DefaultPoolGUSDDebtUpdated(GUSDDebt);
    }

    function decreaseGUSDDebt(uint _amount) external override {
        _requireCallerIsTroveManager();
        GUSDDebt = GUSDDebt.sub(_amount);
        emit DefaultPoolGUSDDebtUpdated(GUSDDebt);
    }

    // --- 'require' functions ---

    function _requireCallerIsActivePool() internal view {
        require(msg.sender == activePoolAddress, "DefaultPool: Caller is not the ActivePool");
    }

    function _requireCallerIsTroveManager() internal view {
        require(msg.sender == troveManagerAddress, "DefaultPool: Caller is not the TroveManager");
    }

    // --- Fallback function ---

    receive() external payable {
        _requireCallerIsActivePool();
        GIVE = GIVE.add(msg.value);
        emit DefaultPoolGIVEBalanceUpdated(GIVE);
    }
}
