// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../TroveManager.sol";
import "../BorrowerOperations.sol";
import "../ActivePool.sol";
import "../DefaultPool.sol";
import "../StabilityPool.sol";
import "../GasPool.sol";
import "../CollSurplusPool.sol";
import "../GUSDToken.sol";
import "./PriceFeedTestnet.sol";
import "../SortedTroves.sol";
import "./EchidnaProxy.sol";
//import "../Dependencies/console.sol";

// Run with:
// rm -f fuzzTests/corpus/* # (optional)
// ~/.local/bin/echidna-test contracts/TestContracts/EchidnaTester.sol --contract EchidnaTester --config fuzzTests/echidna_config.yaml

contract EchidnaTester {
    using SafeMath for uint;

    uint constant private NUMBER_OF_ACTORS = 100;
    uint constant private INITIAL_BALANCE = 1e24;
    uint private MCR;
    uint private CCR;
    uint private GUSD_GAS_COMPENSATION;

    TroveManager public troveManager;
    BorrowerOperations public borrowerOperations;
    ActivePool public activePool;
    DefaultPool public defaultPool;
    StabilityPool public stabilityPool;
    GasPool public gasPool;
    CollSurplusPool public collSurplusPool;
    GUSDToken public gusdToken;
    PriceFeedTestnet priceFeedTestnet;
    SortedTroves sortedTroves;

    EchidnaProxy[NUMBER_OF_ACTORS] public echidnaProxies;

    uint private numberOfTroves;

    constructor() public payable {
        troveManager = new TroveManager();
        borrowerOperations = new BorrowerOperations();
        activePool = new ActivePool();
        defaultPool = new DefaultPool();
        stabilityPool = new StabilityPool();
        gasPool = new GasPool();
        gusdToken = new GUSDToken(
            address(troveManager),
            address(stabilityPool),
            address(borrowerOperations)
        );

        collSurplusPool = new CollSurplusPool();
        priceFeedTestnet = new PriceFeedTestnet();

        sortedTroves = new SortedTroves();

        troveManager.setAddresses(address(borrowerOperations), 
            address(activePool), address(defaultPool), 
            address(stabilityPool), address(gasPool), address(collSurplusPool),
            address(priceFeedTestnet), address(gusdToken), 
            address(sortedTroves), address(0), address(0));
       
        borrowerOperations.setAddresses(address(troveManager), 
            address(activePool), address(defaultPool), 
            address(stabilityPool), address(gasPool), address(collSurplusPool),
            address(priceFeedTestnet), address(sortedTroves), 
            address(gusdToken), address(0));

        activePool.setAddresses(address(borrowerOperations), 
            address(troveManager), address(stabilityPool), address(defaultPool));

        defaultPool.setAddresses(address(troveManager), address(activePool));
        
        stabilityPool.setAddresses(address(borrowerOperations), 
            address(troveManager), address(activePool), address(gusdToken), 
            address(sortedTroves), address(priceFeedTestnet), address(0));

        collSurplusPool.setAddresses(address(borrowerOperations), 
             address(troveManager), address(activePool));
    
        sortedTroves.setParams(1e18, address(troveManager), address(borrowerOperations));

        for (uint i = 0; i < NUMBER_OF_ACTORS; i++) {
            echidnaProxies[i] = new EchidnaProxy(troveManager, borrowerOperations, stabilityPool, gusdToken);
            (bool success, ) = address(echidnaProxies[i]).call{value: INITIAL_BALANCE}("");
            require(success);
        }

        MCR = borrowerOperations.MCR();
        CCR = borrowerOperations.CCR();
        GUSD_GAS_COMPENSATION = borrowerOperations.GUSD_GAS_COMPENSATION();
        require(MCR > 0);
        require(CCR > 0);

        // TODO:
        priceFeedTestnet.setPrice(1e22);
    }

    // TroveManager

    function liquidateExt(uint _i, address _user) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].liquidatePrx(_user);
    }

    function liquidateTrovesExt(uint _i, uint _n) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].liquidateTrovesPrx(_n);
    }

    function batchLiquidateTrovesExt(uint _i, address[] calldata _troveArray) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].batchLiquidateTrovesPrx(_troveArray);
    }

    function redeemCollateralExt(
        uint _i,
        uint _GUSDAmount,
        address _firstRedemptionHint,
        address _upperPartialRedemptionHint,
        address _lowerPartialRedemptionHint,
        uint _partialRedemptionHintNICR
    ) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].redeemCollateralPrx(_GUSDAmount, _firstRedemptionHint, _upperPartialRedemptionHint, _lowerPartialRedemptionHint, _partialRedemptionHintNICR, 0, 0);
    }

    // Borrower Operations

    function getAdjustedETH(uint actorBalance, uint _GIVE, uint ratio) internal view returns (uint) {
        uint price = priceFeedTestnet.getPrice();
        require(price > 0);
        uint minETH = ratio.mul(GUSD_GAS_COMPENSATION).div(price);
        require(actorBalance > minETH);
        uint GIVE = minETH + _GIVE % (actorBalance - minETH);
        return GIVE;
    }

    function getAdjustedGUSD(uint GIVE, uint _GUSDAmount, uint ratio) internal view returns (uint) {
        uint price = priceFeedTestnet.getPrice();
        uint GUSDAmount = _GUSDAmount;
        uint compositeDebt = GUSDAmount.add(GUSD_GAS_COMPENSATION);
        uint ICR = GivetyMath._computeCR(GIVE, compositeDebt, price);
        if (ICR < ratio) {
            compositeDebt = GIVE.mul(price).div(ratio);
            GUSDAmount = compositeDebt.sub(GUSD_GAS_COMPENSATION);
        }
        return GUSDAmount;
    }

    function openTroveExt(uint _i, uint _GIVE, uint _GUSDAmount) public payable {
        uint actor = _i % NUMBER_OF_ACTORS;
        EchidnaProxy echidnaProxy = echidnaProxies[actor];
        uint actorBalance = address(echidnaProxy).balance;

        // we pass in CCR instead of MCR in case it’s the first one
        uint GIVE = getAdjustedETH(actorBalance, _GIVE, CCR);
        uint GUSDAmount = getAdjustedGUSD(GIVE, _GUSDAmount, CCR);

        //console.log('GIVE', GIVE);
        //console.log('GUSDAmount', GUSDAmount);

        echidnaProxy.openTrovePrx(GIVE, GUSDAmount, address(0), address(0), 0);

        numberOfTroves = troveManager.getTroveOwnersCount();
        assert(numberOfTroves > 0);
        // canary
        //assert(numberOfTroves == 0);
    }

    function openTroveRawExt(uint _i, uint _GIVE, uint _GUSDAmount, address _upperHint, address _lowerHint, uint _maxFee) public payable {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].openTrovePrx(_GIVE, _GUSDAmount, _upperHint, _lowerHint, _maxFee);
    }

    function addCollExt(uint _i, uint _GIVE) external payable {
        uint actor = _i % NUMBER_OF_ACTORS;
        EchidnaProxy echidnaProxy = echidnaProxies[actor];
        uint actorBalance = address(echidnaProxy).balance;

        uint GIVE = getAdjustedETH(actorBalance, _GIVE, MCR);

        echidnaProxy.addCollPrx(GIVE, address(0), address(0));
    }

    function addCollRawExt(uint _i, uint _GIVE, address _upperHint, address _lowerHint) external payable {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].addCollPrx(_GIVE, _upperHint, _lowerHint);
    }

    function withdrawCollExt(uint _i, uint _amount, address _upperHint, address _lowerHint) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].withdrawCollPrx(_amount, _upperHint, _lowerHint);
    }

    function withdrawGUSDExt(uint _i, uint _amount, address _upperHint, address _lowerHint, uint _maxFee) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].withdrawGUSDPrx(_amount, _upperHint, _lowerHint, _maxFee);
    }

    function repayGUSDExt(uint _i, uint _amount, address _upperHint, address _lowerHint) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].repayGUSDPrx(_amount, _upperHint, _lowerHint);
    }

    function closeTroveExt(uint _i) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].closeTrovePrx();
    }

    function adjustTroveExt(uint _i, uint _GIVE, uint _collWithdrawal, uint _debtChange, bool _isDebtIncrease) external payable {
        uint actor = _i % NUMBER_OF_ACTORS;
        EchidnaProxy echidnaProxy = echidnaProxies[actor];
        uint actorBalance = address(echidnaProxy).balance;

        uint GIVE = getAdjustedETH(actorBalance, _GIVE, MCR);
        uint debtChange = _debtChange;
        if (_isDebtIncrease) {
            // TODO: add current amount already withdrawn:
            debtChange = getAdjustedGUSD(GIVE, uint(_debtChange), MCR);
        }
        // TODO: collWithdrawal, debtChange
        echidnaProxy.adjustTrovePrx(GIVE, _collWithdrawal, debtChange, _isDebtIncrease, address(0), address(0), 0);
    }

    function adjustTroveRawExt(uint _i, uint _GIVE, uint _collWithdrawal, uint _debtChange, bool _isDebtIncrease, address _upperHint, address _lowerHint, uint _maxFee) external payable {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].adjustTrovePrx(_GIVE, _collWithdrawal, _debtChange, _isDebtIncrease, _upperHint, _lowerHint, _maxFee);
    }

    // Pool Manager

    function provideToSPExt(uint _i, uint _amount, address _frontEndTag) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].provideToSPPrx(_amount, _frontEndTag);
    }

    function withdrawFromSPExt(uint _i, uint _amount) external {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].withdrawFromSPPrx(_amount);
    }

    // GUSD Token

    function transferExt(uint _i, address recipient, uint256 amount) external returns (bool) {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].transferPrx(recipient, amount);
    }

    function approveExt(uint _i, address spender, uint256 amount) external returns (bool) {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].approvePrx(spender, amount);
    }

    function transferFromExt(uint _i, address sender, address recipient, uint256 amount) external returns (bool) {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].transferFromPrx(sender, recipient, amount);
    }

    function increaseAllowanceExt(uint _i, address spender, uint256 addedValue) external returns (bool) {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].increaseAllowancePrx(spender, addedValue);
    }

    function decreaseAllowanceExt(uint _i, address spender, uint256 subtractedValue) external returns (bool) {
        uint actor = _i % NUMBER_OF_ACTORS;
        echidnaProxies[actor].decreaseAllowancePrx(spender, subtractedValue);
    }

    // PriceFeed

    function setPriceExt(uint256 _price) external {
        bool result = priceFeedTestnet.setPrice(_price);
        assert(result);
    }

    // --------------------------
    // Invariants and properties
    // --------------------------

    function echidna_canary_number_of_troves() public view returns(bool) {
        if (numberOfTroves > 20) {
            return false;
        }

        return true;
    }

    function echidna_canary_active_pool_balance() public view returns(bool) {
        if (address(activePool).balance > 0) {
            return false;
        }
        return true;
    }

    function echidna_troves_order() external view returns(bool) {
        address currentTrove = sortedTroves.getFirst();
        address nextTrove = sortedTroves.getNext(currentTrove);

        while (currentTrove != address(0) && nextTrove != address(0)) {
            if (troveManager.getNominalICR(nextTrove) > troveManager.getNominalICR(currentTrove)) {
                return false;
            }
            // Uncomment to check that the condition is meaningful
            //else return false;

            currentTrove = nextTrove;
            nextTrove = sortedTroves.getNext(currentTrove);
        }

        return true;
    }

    /**
     * Status
     * Minimum debt (gas compensation)
     * Stake > 0
     */
    function echidna_trove_properties() public view returns(bool) {
        address currentTrove = sortedTroves.getFirst();
        while (currentTrove != address(0)) {
            // Status
            if (TroveManager.Status(troveManager.getTroveStatus(currentTrove)) != TroveManager.Status.active) {
                return false;
            }
            // Uncomment to check that the condition is meaningful
            //else return false;

            // Minimum debt (gas compensation)
            if (troveManager.getTroveDebt(currentTrove) < GUSD_GAS_COMPENSATION) {
                return false;
            }
            // Uncomment to check that the condition is meaningful
            //else return false;

            // Stake > 0
            if (troveManager.getTroveStake(currentTrove) == 0) {
                return false;
            }
            // Uncomment to check that the condition is meaningful
            //else return false;

            currentTrove = sortedTroves.getNext(currentTrove);
        }
        return true;
    }

    function echidna_GIVE_balances() public view returns(bool) {
        if (address(troveManager).balance > 0) {
            return false;
        }

        if (address(borrowerOperations).balance > 0) {
            return false;
        }

        if (address(activePool).balance != activePool.getGIVE()) {
            return false;
        }

        if (address(defaultPool).balance != defaultPool.getGIVE()) {
            return false;
        }

        if (address(stabilityPool).balance != stabilityPool.getGIVE()) {
            return false;
        }

        if (address(gusdToken).balance > 0) {
            return false;
        }
    
        if (address(priceFeedTestnet).balance > 0) {
            return false;
        }
        
        if (address(sortedTroves).balance > 0) {
            return false;
        }

        return true;
    }

    // TODO: What should we do with this? Should it be allowed? Should it be a canary?
    function echidna_price() public view returns(bool) {
        uint price = priceFeedTestnet.getPrice();
        
        if (price == 0) {
            return false;
        }
        // Uncomment to check that the condition is meaningful
        //else return false;

        return true;
    }

    // Total GUSD matches
    function echidna_GUSD_global_balances() public view returns(bool) {
        uint totalSupply = gusdToken.totalSupply();
        uint gasPoolBalance = gusdToken.balanceOf(address(gasPool));

        uint activePoolBalance = activePool.getGUSDDebt();
        uint defaultPoolBalance = defaultPool.getGUSDDebt();
        if (totalSupply != activePoolBalance + defaultPoolBalance) {
            return false;
        }

        uint stabilityPoolBalance = stabilityPool.getTotalGUSDDeposits();
        address currentTrove = sortedTroves.getFirst();
        uint trovesBalance;
        while (currentTrove != address(0)) {
            trovesBalance += gusdToken.balanceOf(address(currentTrove));
            currentTrove = sortedTroves.getNext(currentTrove);
        }
        // we cannot state equality because tranfers are made to external addresses too
        if (totalSupply <= stabilityPoolBalance + trovesBalance + gasPoolBalance) {
            return false;
        }

        return true;
    }

    /*
    function echidna_test() public view returns(bool) {
        return true;
    }
    */
}
