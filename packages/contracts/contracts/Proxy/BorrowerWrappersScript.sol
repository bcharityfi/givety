// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/SafeMath.sol";
import "../Dependencies/GivetyMath.sol";
import "../Dependencies/IERC20.sol";
import "../Interfaces/IBorrowerOperations.sol";
import "../Interfaces/ITroveManager.sol";
import "../Interfaces/IStabilityPool.sol";
import "../Interfaces/IPriceFeed.sol";
import "../Interfaces/IGVTYStaking.sol";
import "./BorrowerOperationsScript.sol";
import "./GIVETransferScript.sol";
import "./GVTYStakingScript.sol";
import "../Dependencies/console.sol";


contract BorrowerWrappersScript is BorrowerOperationsScript, GIVETransferScript, GVTYStakingScript {
    using SafeMath for uint;

    string constant public NAME = "BorrowerWrappersScript";

    ITroveManager immutable troveManager;
    IStabilityPool immutable stabilityPool;
    IPriceFeed immutable priceFeed;
    IERC20 immutable gusdToken;
    IERC20 immutable gvtyToken;
    IGVTYStaking immutable gvtyStaking;

    constructor(
        address _borrowerOperationsAddress,
        address _troveManagerAddress,
        address _gvtyStakingAddress
    )
        BorrowerOperationsScript(IBorrowerOperations(_borrowerOperationsAddress))
        GVTYStakingScript(_gvtyStakingAddress)
        public
    {
        checkContract(_troveManagerAddress);
        ITroveManager troveManagerCached = ITroveManager(_troveManagerAddress);
        troveManager = troveManagerCached;

        IStabilityPool stabilityPoolCached = troveManagerCached.stabilityPool();
        checkContract(address(stabilityPoolCached));
        stabilityPool = stabilityPoolCached;

        IPriceFeed priceFeedCached = troveManagerCached.priceFeed();
        checkContract(address(priceFeedCached));
        priceFeed = priceFeedCached;

        address gusdTokenCached = address(troveManagerCached.gusdToken());
        checkContract(gusdTokenCached);
        gusdToken = IERC20(gusdTokenCached);

        address gvtyTokenCached = address(troveManagerCached.gvtyToken());
        checkContract(gvtyTokenCached);
        gvtyToken = IERC20(gvtyTokenCached);

        IGVTYStaking gvtyStakingCached = troveManagerCached.gvtyStaking();
        require(_gvtyStakingAddress == address(gvtyStakingCached), "BorrowerWrappersScript: Wrong GVTYStaking address");
        gvtyStaking = gvtyStakingCached;
    }

    function claimCollateralAndOpenTrove(uint _maxFee, uint _GUSDAmount, address _upperHint, address _lowerHint) external payable {
        uint balanceBefore = address(this).balance;

        // Claim collateral
        borrowerOperations.claimCollateral();

        uint balanceAfter = address(this).balance;

        // already checked in CollSurplusPool
        assert(balanceAfter > balanceBefore);

        uint totalCollateral = balanceAfter.sub(balanceBefore).add(msg.value);

        // Open trove with obtained collateral, plus collateral sent by user
        borrowerOperations.openTrove{ value: totalCollateral }(_maxFee, _GUSDAmount, _upperHint, _lowerHint);
    }

    function claimSPRewardsAndRecycle(uint _maxFee, address _upperHint, address _lowerHint) external {
        uint collBalanceBefore = address(this).balance;
        uint gvtyBalanceBefore = gvtyToken.balanceOf(address(this));

        // Claim rewards
        stabilityPool.withdrawFromSP(0);

        uint collBalanceAfter = address(this).balance;
        uint gvtyBalanceAfter = gvtyToken.balanceOf(address(this));
        uint claimedCollateral = collBalanceAfter.sub(collBalanceBefore);

        // Add claimed GIVE to trove, get more GUSD and stake it into the Stability Pool
        if (claimedCollateral > 0) {
            _requireUserHasTrove(address(this));
            uint GUSDAmount = _getNetGUSDAmount(claimedCollateral);
            borrowerOperations.adjustTrove{ value: claimedCollateral }(_maxFee, 0, GUSDAmount, true, _upperHint, _lowerHint);
            // Provide withdrawn GUSD to Stability Pool
            if (GUSDAmount > 0) {
                stabilityPool.provideToSP(GUSDAmount, address(0));
            }
        }

        // Stake claimed GVTY
        uint claimedGVTY = gvtyBalanceAfter.sub(gvtyBalanceBefore);
        if (claimedGVTY > 0) {
            gvtyStaking.stake(claimedGVTY);
        }
    }

    function claimStakingGainsAndRecycle(uint _maxFee, address _upperHint, address _lowerHint) external {
        uint collBalanceBefore = address(this).balance;
        uint gusdBalanceBefore = gusdToken.balanceOf(address(this));
        uint gvtyBalanceBefore = gvtyToken.balanceOf(address(this));

        // Claim gains
        gvtyStaking.unstake(0);

        uint gainedCollateral = address(this).balance.sub(collBalanceBefore); // stack too deep issues :'(
        uint gainedGUSD = gusdToken.balanceOf(address(this)).sub(gusdBalanceBefore);

        uint netGUSDAmount;
        // Top up trove and get more GUSD, keeping ICR constant
        if (gainedCollateral > 0) {
            _requireUserHasTrove(address(this));
            netGUSDAmount = _getNetGUSDAmount(gainedCollateral);
            borrowerOperations.adjustTrove{ value: gainedCollateral }(_maxFee, 0, netGUSDAmount, true, _upperHint, _lowerHint);
        }

        uint totalGUSD = gainedGUSD.add(netGUSDAmount);
        if (totalGUSD > 0) {
            stabilityPool.provideToSP(totalGUSD, address(0));

            // Providing to Stability Pool also triggers GVTY claim, so stake it if any
            uint gvtyBalanceAfter = gvtyToken.balanceOf(address(this));
            uint claimedGVTY = gvtyBalanceAfter.sub(gvtyBalanceBefore);
            if (claimedGVTY > 0) {
                gvtyStaking.stake(claimedGVTY);
            }
        }

    }

    function _getNetGUSDAmount(uint _collateral) internal returns (uint) {
        uint price = priceFeed.fetchPrice();
        uint ICR = troveManager.getCurrentICR(address(this), price);

        uint GUSDAmount = _collateral.mul(price).div(ICR);
        uint borrowingRate = troveManager.getBorrowingRateWithDecay();
        uint netDebt = GUSDAmount.mul(GivetyMath.DECIMAL_PRECISION).div(GivetyMath.DECIMAL_PRECISION.add(borrowingRate));

        return netDebt;
    }

    function _requireUserHasTrove(address _depositor) internal view {
        require(troveManager.getTroveStatus(_depositor) == 1, "BorrowerWrappersScript: caller must have an active trove");
    }
}
