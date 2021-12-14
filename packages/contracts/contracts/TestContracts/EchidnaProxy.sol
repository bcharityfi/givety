// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../TroveManager.sol";
import "../BorrowerOperations.sol";
import "../StabilityPool.sol";
import "../GUSDToken.sol";

contract EchidnaProxy {
    TroveManager troveManager;
    BorrowerOperations borrowerOperations;
    StabilityPool stabilityPool;
    GUSDToken gusdToken;

    constructor(
        TroveManager _troveManager,
        BorrowerOperations _borrowerOperations,
        StabilityPool _stabilityPool,
        GUSDToken _gusdToken
    ) public {
        troveManager = _troveManager;
        borrowerOperations = _borrowerOperations;
        stabilityPool = _stabilityPool;
        gusdToken = _gusdToken;
    }

    receive() external payable {
        // do nothing
    }

    // TroveManager

    function liquidatePrx(address _user) external {
        troveManager.liquidate(_user);
    }

    function liquidateTrovesPrx(uint _n) external {
        troveManager.liquidateTroves(_n);
    }

    function batchLiquidateTrovesPrx(address[] calldata _troveArray) external {
        troveManager.batchLiquidateTroves(_troveArray);
    }

    function redeemCollateralPrx(
        uint _GUSDAmount,
        address _firstRedemptionHint,
        address _upperPartialRedemptionHint,
        address _lowerPartialRedemptionHint,
        uint _partialRedemptionHintNICR,
        uint _maxIterations,
        uint _maxFee
    ) external {
        troveManager.redeemCollateral(_GUSDAmount, _firstRedemptionHint, _upperPartialRedemptionHint, _lowerPartialRedemptionHint, _partialRedemptionHintNICR, _maxIterations, _maxFee);
    }

    // Borrower Operations
    function openTrovePrx(uint _GIVE, uint _GUSDAmount, address _upperHint, address _lowerHint, uint _maxFee) external payable {
        borrowerOperations.openTrove{value: _GIVE}(_maxFee, _GUSDAmount, _upperHint, _lowerHint);
    }

    function addCollPrx(uint _GIVE, address _upperHint, address _lowerHint) external payable {
        borrowerOperations.addColl{value: _GIVE}(_upperHint, _lowerHint);
    }

    function withdrawCollPrx(uint _amount, address _upperHint, address _lowerHint) external {
        borrowerOperations.withdrawColl(_amount, _upperHint, _lowerHint);
    }

    function withdrawGUSDPrx(uint _amount, address _upperHint, address _lowerHint, uint _maxFee) external {
        borrowerOperations.withdrawGUSD(_maxFee, _amount, _upperHint, _lowerHint);
    }

    function repayGUSDPrx(uint _amount, address _upperHint, address _lowerHint) external {
        borrowerOperations.repayGUSD(_amount, _upperHint, _lowerHint);
    }

    function closeTrovePrx() external {
        borrowerOperations.closeTrove();
    }

    function adjustTrovePrx(uint _GIVE, uint _collWithdrawal, uint _debtChange, bool _isDebtIncrease, address _upperHint, address _lowerHint, uint _maxFee) external payable {
        borrowerOperations.adjustTrove{value: _GIVE}(_maxFee, _collWithdrawal, _debtChange, _isDebtIncrease, _upperHint, _lowerHint);
    }

    // Pool Manager
    function provideToSPPrx(uint _amount, address _frontEndTag) external {
        stabilityPool.provideToSP(_amount, _frontEndTag);
    }

    function withdrawFromSPPrx(uint _amount) external {
        stabilityPool.withdrawFromSP(_amount);
    }

    // GUSD Token

    function transferPrx(address recipient, uint256 amount) external returns (bool) {
        return gusdToken.transfer(recipient, amount);
    }

    function approvePrx(address spender, uint256 amount) external returns (bool) {
        return gusdToken.approve(spender, amount);
    }

    function transferFromPrx(address sender, address recipient, uint256 amount) external returns (bool) {
        return gusdToken.transferFrom(sender, recipient, amount);
    }

    function increaseAllowancePrx(address spender, uint256 addedValue) external returns (bool) {
        return gusdToken.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowancePrx(address spender, uint256 subtractedValue) external returns (bool) {
        return gusdToken.decreaseAllowance(spender, subtractedValue);
    }
}
