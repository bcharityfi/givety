// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import './Interfaces/IActivePool.sol';
import "./Dependencies/SafeMath.sol";
import "./Dependencies/Ownable.sol";
import "./Dependencies/CheckContract.sol";
import "./Dependencies/console.sol";

/*
 * The Active Pool holds the GIVE collateral and GUSD debt (but not GUSD tokens) for all active troves.
 *
 * When a trove is liquidated, it's GIVE and GUSD debt are transferred from the Active Pool, to either the
 * Stability Pool, the Default Pool, or both, depending on the liquidation conditions.
 *
 */
contract ActivePool is Ownable, CheckContract, IActivePool {
    using SafeMath for uint256;

    string constant public NAME = "ActivePool";

    address public borrowerOperationsAddress;
    address public troveManagerAddress;
    address public stabilityPoolAddress;
    address public defaultPoolAddress;
    uint256 internal GIVE;  // deposited Give tracker
    uint256 internal GUSDDebt;

    // --- Events ---

    event BorrowerOperationsAddressChanged(address _newBorrowerOperationsAddress);
    event TroveManagerAddressChanged(address _newTroveManagerAddress);
    event ActivePoolGUSDDebtUpdated(uint _GUSDDebt);
    event ActivePoolGIVEBalanceUpdated(uint _GIVE);

    // --- Contract setters ---

    function setAddresses(
        address _borrowerOperationsAddress,
        address _troveManagerAddress,
        address _stabilityPoolAddress,
        address _defaultPoolAddress
    )
        external
        onlyOwner
    {
        checkContract(_borrowerOperationsAddress);
        checkContract(_troveManagerAddress);
        checkContract(_stabilityPoolAddress);
        checkContract(_defaultPoolAddress);

        borrowerOperationsAddress = _borrowerOperationsAddress;
        troveManagerAddress = _troveManagerAddress;
        stabilityPoolAddress = _stabilityPoolAddress;
        defaultPoolAddress = _defaultPoolAddress;

        emit BorrowerOperationsAddressChanged(_borrowerOperationsAddress);
        emit TroveManagerAddressChanged(_troveManagerAddress);
        emit StabilityPoolAddressChanged(_stabilityPoolAddress);
        emit DefaultPoolAddressChanged(_defaultPoolAddress);

        _renounceOwnership();
    }

    // --- Getters for public variables. Required by IPool interface ---

    /*
    * Returns the GIVE state variable.
    *
    *Not necessarily equal to the the contract's raw GIVE balance - give can be forcibly sent to contracts.
    */
    function getGIVE() external view override returns (uint) {
        return GIVE;
    }

    function getGUSDDebt() external view override returns (uint) {
        return GUSDDebt;
    }

    // --- Pool functionality ---

    function sendGIVE(address _account, uint _amount) external override {
        _requireCallerIsBOorTroveMorSP();
        GIVE = GIVE.sub(_amount);
        emit ActivePoolGIVEBalanceUpdated(GIVE);
        emit EtherSent(_account, _amount);

        (bool success, ) = _account.call{ value: _amount }("");
        require(success, "ActivePool: sending GIVE failed");
    }

    function increaseGUSDDebt(uint _amount) external override {
        _requireCallerIsBOorTroveM();
        GUSDDebt  = GUSDDebt.add(_amount);
        ActivePoolGUSDDebtUpdated(GUSDDebt);
    }

    function decreaseGUSDDebt(uint _amount) external override {
        _requireCallerIsBOorTroveMorSP();
        GUSDDebt = GUSDDebt.sub(_amount);
        ActivePoolGUSDDebtUpdated(GUSDDebt);
    }

    // --- 'require' functions ---

    function _requireCallerIsBorrowerOperationsOrDefaultPool() internal view {
        require(
            msg.sender == borrowerOperationsAddress ||
            msg.sender == defaultPoolAddress,
            "ActivePool: Caller is neither BO nor Default Pool");
    }

    function _requireCallerIsBOorTroveMorSP() internal view {
        require(
            msg.sender == borrowerOperationsAddress ||
            msg.sender == troveManagerAddress ||
            msg.sender == stabilityPoolAddress,
            "ActivePool: Caller is neither BorrowerOperations nor TroveManager nor StabilityPool");
    }

    function _requireCallerIsBOorTroveM() internal view {
        require(
            msg.sender == borrowerOperationsAddress ||
            msg.sender == troveManagerAddress,
            "ActivePool: Caller is neither BorrowerOperations nor TroveManager");
    }

    // --- Fallback function ---

    receive() external payable {
        _requireCallerIsBorrowerOperationsOrDefaultPool();
        GIVE = GIVE.add(msg.value);
        emit ActivePoolGIVEBalanceUpdated(GIVE);
    }
}
