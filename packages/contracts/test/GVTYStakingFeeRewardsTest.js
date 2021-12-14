const Decimal = require("decimal.js");
const deploymentHelper = require("../utils/deploymentHelpers.js")
const { BNConverter } = require("../utils/BNConverter.js")
const testHelpers = require("../utils/testHelpers.js")

const GVTYStakingTester = artifacts.require('GVTYStakingTester')
const TroveManagerTester = artifacts.require("TroveManagerTester")
const NonPayable = artifacts.require("./NonPayable.sol")

const th = testHelpers.TestHelper
const timeValues = testHelpers.TimeValues
const dec = th.dec
const assertRevert = th.assertRevert

const toBN = th.toBN
const ZERO = th.toBN('0')

/* NOTE: These tests do not test for specific GIVE and GUSD gain values. They only test that the 
 * gains are non-zero, occur when they should, and are in correct proportion to the user's stake. 
 *
 * Specific GIVE/GUSD gain values will depend on the final fee schedule used, and the final choices for
 * parameters BETA and MINUTE_DECAY_FACTOR in the TroveManager, which are still TBD based on economic
 * modelling.
 * 
 */ 

contract('GVTYStaking revenue share tests', async accounts => {

  const [bountyAddress, lpRewardsAddress, multisig] = accounts.slice(997, 1000)
  
  const [owner, A, B, C, D, E, F, G, whale] = accounts;

  let priceFeed
  let gusdToken
  let sortedTroves
  let troveManager
  let activePool
  let stabilityPool
  let defaultPool
  let borrowerOperations
  let gvtyStaking
  let gvtyToken

  let contracts

  const openTrove = async (params) => th.openTrove(contracts, params)

  beforeEach(async () => {
    contracts = await deploymentHelper.deployGivetyCore()
    contracts.troveManager = await TroveManagerTester.new()
    contracts = await deploymentHelper.deployGUSDTokenTester(contracts)
    const GVTYContracts = await deploymentHelper.deployGVTYTesterContractsHardhat(bountyAddress, lpRewardsAddress, multisig)
    
    await deploymentHelper.connectGVTYContracts(GVTYContracts)
    await deploymentHelper.connectCoreContracts(contracts, GVTYContracts)
    await deploymentHelper.connectGVTYContractsToCore(GVTYContracts, contracts)

    nonPayable = await NonPayable.new() 
    priceFeed = contracts.priceFeedTestnet
    gusdToken = contracts.gusdToken
    sortedTroves = contracts.sortedTroves
    troveManager = contracts.troveManager
    activePool = contracts.activePool
    stabilityPool = contracts.stabilityPool
    defaultPool = contracts.defaultPool
    borrowerOperations = contracts.borrowerOperations
    hintHelpers = contracts.hintHelpers

    gvtyToken = GVTYContracts.gvtyToken
    gvtyStaking = GVTYContracts.gvtyStaking
  })

  it('stake(): reverts if amount is zero', async () => {
    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // console.log(`A gvty bal: ${await gvtyToken.balanceOf(A)}`)

    // A makes stake
    await gvtyToken.approve(gvtyStaking.address, dec(100, 18), {from: A})
    await assertRevert(gvtyStaking.stake(0, {from: A}), "GVTYStaking: Amount must be non-zero")
  })

  it("GIVE fee per GVTY staked increases when a redemption fee is triggered and totalStakes > 0", async () => {
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // console.log(`A gvty bal: ${await gvtyToken.balanceOf(A)}`)

    // A makes stake
    await gvtyToken.approve(gvtyStaking.address, dec(100, 18), {from: A})
    await gvtyStaking.stake(dec(100, 18), {from: A})

    // Check GIVE fee per unit staked is zero
    const F_GIVE_Before = await gvtyStaking.F_GIVE()
    assert.equal(F_GIVE_Before, '0')

    const B_BalBeforeREdemption = await gusdToken.balanceOf(B)
    // B redeems
    const redemptionTx = await th.redeemCollateralAndGetTxObject(B, contracts, dec(100, 18))
    
    const B_BalAfterRedemption = await gusdToken.balanceOf(B)
    assert.isTrue(B_BalAfterRedemption.lt(B_BalBeforeREdemption))

    // check GIVE fee emitted in event is non-zero
    const emittedETHFee = toBN((await th.getEmittedRedemptionValues(redemptionTx))[3])
    assert.isTrue(emittedETHFee.gt(toBN('0')))

    // Check GIVE fee per unit staked has increased by correct amount
    const F_GIVE_After = await gvtyStaking.F_GIVE()

    // Expect fee per unit staked = fee/100, since there is 100 GUSD totalStaked
    const expected_F_GIVE_After = emittedETHFee.div(toBN('100')) 

    assert.isTrue(expected_F_GIVE_After.eq(F_GIVE_After))
  })

  it("GIVE fee per GVTY staked doesn't change when a redemption fee is triggered and totalStakes == 0", async () => {
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // Check GIVE fee per unit staked is zero
    const F_GIVE_Before = await gvtyStaking.F_GIVE()
    assert.equal(F_GIVE_Before, '0')

    const B_BalBeforeREdemption = await gusdToken.balanceOf(B)
    // B redeems
    const redemptionTx = await th.redeemCollateralAndGetTxObject(B, contracts, dec(100, 18))
    
    const B_BalAfterRedemption = await gusdToken.balanceOf(B)
    assert.isTrue(B_BalAfterRedemption.lt(B_BalBeforeREdemption))

    // check GIVE fee emitted in event is non-zero
    const emittedETHFee = toBN((await th.getEmittedRedemptionValues(redemptionTx))[3])
    assert.isTrue(emittedETHFee.gt(toBN('0')))

    // Check GIVE fee per unit staked has not increased 
    const F_GIVE_After = await gvtyStaking.F_GIVE()
    assert.equal(F_GIVE_After, '0')
  })

  it("GUSD fee per GVTY staked increases when a redemption fee is triggered and totalStakes > 0", async () => {
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // A makes stake
    await gvtyToken.approve(gvtyStaking.address, dec(100, 18), {from: A})
    await gvtyStaking.stake(dec(100, 18), {from: A})

    // Check GUSD fee per unit staked is zero
    const F_GUSD_Before = await gvtyStaking.F_GIVE()
    assert.equal(F_GUSD_Before, '0')

    const B_BalBeforeREdemption = await gusdToken.balanceOf(B)
    // B redeems
    const redemptionTx = await th.redeemCollateralAndGetTxObject(B, contracts, dec(100, 18))
    
    const B_BalAfterRedemption = await gusdToken.balanceOf(B)
    assert.isTrue(B_BalAfterRedemption.lt(B_BalBeforeREdemption))

    // Check base rate is now non-zero
    const baseRate = await troveManager.baseRate()
    assert.isTrue(baseRate.gt(toBN('0')))

    // D draws debt
    const tx = await borrowerOperations.withdrawGUSD(th._100pct, dec(27, 18), D, D, {from: D})
    
    // Check GUSD fee value in event is non-zero
    const emittedGUSDFee = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(tx))
    assert.isTrue(emittedGUSDFee.gt(toBN('0')))
    
    // Check GUSD fee per unit staked has increased by correct amount
    const F_GUSD_After = await gvtyStaking.F_GUSD()

    // Expect fee per unit staked = fee/100, since there is 100 GUSD totalStaked
    const expected_F_GUSD_After = emittedGUSDFee.div(toBN('100')) 

    assert.isTrue(expected_F_GUSD_After.eq(F_GUSD_After))
  })

  it("GUSD fee per GVTY staked doesn't change when a redemption fee is triggered and totalStakes == 0", async () => {
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // Check GUSD fee per unit staked is zero
    const F_GUSD_Before = await gvtyStaking.F_GIVE()
    assert.equal(F_GUSD_Before, '0')

    const B_BalBeforeREdemption = await gusdToken.balanceOf(B)
    // B redeems
    const redemptionTx = await th.redeemCollateralAndGetTxObject(B, contracts, dec(100, 18))
    
    const B_BalAfterRedemption = await gusdToken.balanceOf(B)
    assert.isTrue(B_BalAfterRedemption.lt(B_BalBeforeREdemption))

    // Check base rate is now non-zero
    const baseRate = await troveManager.baseRate()
    assert.isTrue(baseRate.gt(toBN('0')))

    // D draws debt
    const tx = await borrowerOperations.withdrawGUSD(th._100pct, dec(27, 18), D, D, {from: D})
    
    // Check GUSD fee value in event is non-zero
    const emittedGUSDFee = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(tx))
    assert.isTrue(emittedGUSDFee.gt(toBN('0')))
    
    // Check GUSD fee per unit staked did not increase, is still zero
    const F_GUSD_After = await gvtyStaking.F_GUSD()
    assert.equal(F_GUSD_After, '0')
  })

  it("GVTY Staking: A single staker earns all GIVE and GVTY fees that occur", async () => {
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // A makes stake
    await gvtyToken.approve(gvtyStaking.address, dec(100, 18), {from: A})
    await gvtyStaking.stake(dec(100, 18), {from: A})

    const B_BalBeforeREdemption = await gusdToken.balanceOf(B)
    // B redeems
    const redemptionTx_1 = await th.redeemCollateralAndGetTxObject(B, contracts, dec(100, 18))
    
    const B_BalAfterRedemption = await gusdToken.balanceOf(B)
    assert.isTrue(B_BalAfterRedemption.lt(B_BalBeforeREdemption))

    // check GIVE fee 1 emitted in event is non-zero
    const emittedETHFee_1 = toBN((await th.getEmittedRedemptionValues(redemptionTx_1))[3])
    assert.isTrue(emittedETHFee_1.gt(toBN('0')))

    const C_BalBeforeREdemption = await gusdToken.balanceOf(C)
    // C redeems
    const redemptionTx_2 = await th.redeemCollateralAndGetTxObject(C, contracts, dec(100, 18))
    
    const C_BalAfterRedemption = await gusdToken.balanceOf(C)
    assert.isTrue(C_BalAfterRedemption.lt(C_BalBeforeREdemption))
 
     // check GIVE fee 2 emitted in event is non-zero
     const emittedETHFee_2 = toBN((await th.getEmittedRedemptionValues(redemptionTx_2))[3])
     assert.isTrue(emittedETHFee_2.gt(toBN('0')))

    // D draws debt
    const borrowingTx_1 = await borrowerOperations.withdrawGUSD(th._100pct, dec(104, 18), D, D, {from: D})
    
    // Check GUSD fee value in event is non-zero
    const emittedGUSDFee_1 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_1))
    assert.isTrue(emittedGUSDFee_1.gt(toBN('0')))

    // B draws debt
    const borrowingTx_2 = await borrowerOperations.withdrawGUSD(th._100pct, dec(17, 18), B, B, {from: B})
    
    // Check GUSD fee value in event is non-zero
    const emittedGUSDFee_2 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_2))
    assert.isTrue(emittedGUSDFee_2.gt(toBN('0')))

    const expectedTotalGIVEGain = emittedETHFee_1.add(emittedETHFee_2)
    const expectedTotalGUSDGain = emittedGUSDFee_1.add(emittedGUSDFee_2)

    const A_GIVEBalance_Before = toBN(await web3.eth.getBalance(A))
    const A_GUSDBalance_Before = toBN(await gusdToken.balanceOf(A))

    // A un-stakes
    await gvtyStaking.unstake(dec(100, 18), {from: A, gasPrice: 0})

    const A_GIVEBalance_After = toBN(await web3.eth.getBalance(A))
    const A_GUSDBalance_After = toBN(await gusdToken.balanceOf(A))


    const A_GIVEGain = A_GIVEBalance_After.sub(A_GIVEBalance_Before)
    const A_GUSDGain = A_GUSDBalance_After.sub(A_GUSDBalance_Before)

    assert.isAtMost(th.getDifference(expectedTotalGIVEGain, A_GIVEGain), 1000)
    assert.isAtMost(th.getDifference(expectedTotalGUSDGain, A_GUSDGain), 1000)
  })

  it("stake(): Top-up sends out all accumulated GIVE and GUSD gains to the staker", async () => { 
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // A makes stake
    await gvtyToken.approve(gvtyStaking.address, dec(100, 18), {from: A})
    await gvtyStaking.stake(dec(50, 18), {from: A})

    const B_BalBeforeREdemption = await gusdToken.balanceOf(B)
    // B redeems
    const redemptionTx_1 = await th.redeemCollateralAndGetTxObject(B, contracts, dec(100, 18))
    
    const B_BalAfterRedemption = await gusdToken.balanceOf(B)
    assert.isTrue(B_BalAfterRedemption.lt(B_BalBeforeREdemption))

    // check GIVE fee 1 emitted in event is non-zero
    const emittedETHFee_1 = toBN((await th.getEmittedRedemptionValues(redemptionTx_1))[3])
    assert.isTrue(emittedETHFee_1.gt(toBN('0')))

    const C_BalBeforeREdemption = await gusdToken.balanceOf(C)
    // C redeems
    const redemptionTx_2 = await th.redeemCollateralAndGetTxObject(C, contracts, dec(100, 18))
    
    const C_BalAfterRedemption = await gusdToken.balanceOf(C)
    assert.isTrue(C_BalAfterRedemption.lt(C_BalBeforeREdemption))
 
     // check GIVE fee 2 emitted in event is non-zero
     const emittedETHFee_2 = toBN((await th.getEmittedRedemptionValues(redemptionTx_2))[3])
     assert.isTrue(emittedETHFee_2.gt(toBN('0')))

    // D draws debt
    const borrowingTx_1 = await borrowerOperations.withdrawGUSD(th._100pct, dec(104, 18), D, D, {from: D})
    
    // Check GUSD fee value in event is non-zero
    const emittedGUSDFee_1 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_1))
    assert.isTrue(emittedGUSDFee_1.gt(toBN('0')))

    // B draws debt
    const borrowingTx_2 = await borrowerOperations.withdrawGUSD(th._100pct, dec(17, 18), B, B, {from: B})
    
    // Check GUSD fee value in event is non-zero
    const emittedGUSDFee_2 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_2))
    assert.isTrue(emittedGUSDFee_2.gt(toBN('0')))

    const expectedTotalGIVEGain = emittedETHFee_1.add(emittedETHFee_2)
    const expectedTotalGUSDGain = emittedGUSDFee_1.add(emittedGUSDFee_2)

    const A_GIVEBalance_Before = toBN(await web3.eth.getBalance(A))
    const A_GUSDBalance_Before = toBN(await gusdToken.balanceOf(A))

    // A tops up
    await gvtyStaking.stake(dec(50, 18), {from: A, gasPrice: 0})

    const A_GIVEBalance_After = toBN(await web3.eth.getBalance(A))
    const A_GUSDBalance_After = toBN(await gusdToken.balanceOf(A))

    const A_GIVEGain = A_GIVEBalance_After.sub(A_GIVEBalance_Before)
    const A_GUSDGain = A_GUSDBalance_After.sub(A_GUSDBalance_Before)

    assert.isAtMost(th.getDifference(expectedTotalGIVEGain, A_GIVEGain), 1000)
    assert.isAtMost(th.getDifference(expectedTotalGUSDGain, A_GUSDGain), 1000)
  })

  it("getPendingGIVEGain(): Returns the staker's correct pending GIVE gain", async () => { 
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // A makes stake
    await gvtyToken.approve(gvtyStaking.address, dec(100, 18), {from: A})
    await gvtyStaking.stake(dec(50, 18), {from: A})

    const B_BalBeforeREdemption = await gusdToken.balanceOf(B)
    // B redeems
    const redemptionTx_1 = await th.redeemCollateralAndGetTxObject(B, contracts, dec(100, 18))
    
    const B_BalAfterRedemption = await gusdToken.balanceOf(B)
    assert.isTrue(B_BalAfterRedemption.lt(B_BalBeforeREdemption))

    // check GIVE fee 1 emitted in event is non-zero
    const emittedETHFee_1 = toBN((await th.getEmittedRedemptionValues(redemptionTx_1))[3])
    assert.isTrue(emittedETHFee_1.gt(toBN('0')))

    const C_BalBeforeREdemption = await gusdToken.balanceOf(C)
    // C redeems
    const redemptionTx_2 = await th.redeemCollateralAndGetTxObject(C, contracts, dec(100, 18))
    
    const C_BalAfterRedemption = await gusdToken.balanceOf(C)
    assert.isTrue(C_BalAfterRedemption.lt(C_BalBeforeREdemption))
 
     // check GIVE fee 2 emitted in event is non-zero
     const emittedETHFee_2 = toBN((await th.getEmittedRedemptionValues(redemptionTx_2))[3])
     assert.isTrue(emittedETHFee_2.gt(toBN('0')))

    const expectedTotalGIVEGain = emittedETHFee_1.add(emittedETHFee_2)

    const A_GIVEGain = await gvtyStaking.getPendingGIVEGain(A)

    assert.isAtMost(th.getDifference(expectedTotalGIVEGain, A_GIVEGain), 1000)
  })

  it("getPendingGUSDGain(): Returns the staker's correct pending GUSD gain", async () => { 
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})

    // A makes stake
    await gvtyToken.approve(gvtyStaking.address, dec(100, 18), {from: A})
    await gvtyStaking.stake(dec(50, 18), {from: A})

    const B_BalBeforeREdemption = await gusdToken.balanceOf(B)
    // B redeems
    const redemptionTx_1 = await th.redeemCollateralAndGetTxObject(B, contracts, dec(100, 18))
    
    const B_BalAfterRedemption = await gusdToken.balanceOf(B)
    assert.isTrue(B_BalAfterRedemption.lt(B_BalBeforeREdemption))

    // check GIVE fee 1 emitted in event is non-zero
    const emittedETHFee_1 = toBN((await th.getEmittedRedemptionValues(redemptionTx_1))[3])
    assert.isTrue(emittedETHFee_1.gt(toBN('0')))

    const C_BalBeforeREdemption = await gusdToken.balanceOf(C)
    // C redeems
    const redemptionTx_2 = await th.redeemCollateralAndGetTxObject(C, contracts, dec(100, 18))
    
    const C_BalAfterRedemption = await gusdToken.balanceOf(C)
    assert.isTrue(C_BalAfterRedemption.lt(C_BalBeforeREdemption))
 
     // check GIVE fee 2 emitted in event is non-zero
     const emittedETHFee_2 = toBN((await th.getEmittedRedemptionValues(redemptionTx_2))[3])
     assert.isTrue(emittedETHFee_2.gt(toBN('0')))

    // D draws debt
    const borrowingTx_1 = await borrowerOperations.withdrawGUSD(th._100pct, dec(104, 18), D, D, {from: D})
    
    // Check GUSD fee value in event is non-zero
    const emittedGUSDFee_1 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_1))
    assert.isTrue(emittedGUSDFee_1.gt(toBN('0')))

    // B draws debt
    const borrowingTx_2 = await borrowerOperations.withdrawGUSD(th._100pct, dec(17, 18), B, B, {from: B})
    
    // Check GUSD fee value in event is non-zero
    const emittedGUSDFee_2 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_2))
    assert.isTrue(emittedGUSDFee_2.gt(toBN('0')))

    const expectedTotalGUSDGain = emittedGUSDFee_1.add(emittedGUSDFee_2)
    const A_GUSDGain = await gvtyStaking.getPendingGUSDGain(A)

    assert.isAtMost(th.getDifference(expectedTotalGUSDGain, A_GUSDGain), 1000)
  })

  // - multi depositors, several rewards
  it("GVTY Staking: Multiple stakers earn the correct share of all GIVE and GVTY fees, based on their stake size", async () => {
    await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(10, 18)), extraParams: { from: whale } })
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: E } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: F } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: G } })

    // FF time one year so owner can transfer GVTY
    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A, B, C
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})
    await gvtyToken.transfer(B, dec(200, 18), {from: multisig})
    await gvtyToken.transfer(C, dec(300, 18), {from: multisig})

    // A, B, C make stake
    await gvtyToken.approve(gvtyStaking.address, dec(100, 18), {from: A})
    await gvtyToken.approve(gvtyStaking.address, dec(200, 18), {from: B})
    await gvtyToken.approve(gvtyStaking.address, dec(300, 18), {from: C})
    await gvtyStaking.stake(dec(100, 18), {from: A})
    await gvtyStaking.stake(dec(200, 18), {from: B})
    await gvtyStaking.stake(dec(300, 18), {from: C})

    // Confirm staking contract holds 600 GVTY
    // console.log(`gvty staking GVTY bal: ${await gvtyToken.balanceOf(gvtyStaking.address)}`)
    assert.equal(await gvtyToken.balanceOf(gvtyStaking.address), dec(600, 18))
    assert.equal(await gvtyStaking.totalGVTYStaked(), dec(600, 18))

    // F redeems
    const redemptionTx_1 = await th.redeemCollateralAndGetTxObject(F, contracts, dec(45, 18))
    const emittedETHFee_1 = toBN((await th.getEmittedRedemptionValues(redemptionTx_1))[3])
    assert.isTrue(emittedETHFee_1.gt(toBN('0')))

     // G redeems
     const redemptionTx_2 = await th.redeemCollateralAndGetTxObject(G, contracts, dec(197, 18))
     const emittedETHFee_2 = toBN((await th.getEmittedRedemptionValues(redemptionTx_2))[3])
     assert.isTrue(emittedETHFee_2.gt(toBN('0')))

    // F draws debt
    const borrowingTx_1 = await borrowerOperations.withdrawGUSD(th._100pct, dec(104, 18), F, F, {from: F})
    const emittedGUSDFee_1 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_1))
    assert.isTrue(emittedGUSDFee_1.gt(toBN('0')))

    // G draws debt
    const borrowingTx_2 = await borrowerOperations.withdrawGUSD(th._100pct, dec(17, 18), G, G, {from: G})
    const emittedGUSDFee_2 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_2))
    assert.isTrue(emittedGUSDFee_2.gt(toBN('0')))

    // D obtains GVTY from owner and makes a stake
    await gvtyToken.transfer(D, dec(50, 18), {from: multisig})
    await gvtyToken.approve(gvtyStaking.address, dec(50, 18), {from: D})
    await gvtyStaking.stake(dec(50, 18), {from: D})

    // Confirm staking contract holds 650 GVTY
    assert.equal(await gvtyToken.balanceOf(gvtyStaking.address), dec(650, 18))
    assert.equal(await gvtyStaking.totalGVTYStaked(), dec(650, 18))

     // G redeems
     const redemptionTx_3 = await th.redeemCollateralAndGetTxObject(C, contracts, dec(197, 18))
     const emittedETHFee_3 = toBN((await th.getEmittedRedemptionValues(redemptionTx_3))[3])
     assert.isTrue(emittedETHFee_3.gt(toBN('0')))

     // G draws debt
    const borrowingTx_3 = await borrowerOperations.withdrawGUSD(th._100pct, dec(17, 18), G, G, {from: G})
    const emittedGUSDFee_3 = toBN(th.getGUSDFeeFromGUSDBorrowingEvent(borrowingTx_3))
    assert.isTrue(emittedGUSDFee_3.gt(toBN('0')))
     
    /*  
    Expected rewards:

    A_GIVE: (100* ETHFee_1)/600 + (100* ETHFee_2)/600 + (100*GIVE_Fee_3)/650
    B_GIVE: (200* ETHFee_1)/600 + (200* ETHFee_2)/600 + (200*GIVE_Fee_3)/650
    C_GIVE: (300* ETHFee_1)/600 + (300* ETHFee_2)/600 + (300*GIVE_Fee_3)/650
    D_GIVE:                                             (100*GIVE_Fee_3)/650

    A_GUSD: (100*GUSDFee_1 )/600 + (100* GUSDFee_2)/600 + (100*GUSDFee_3)/650
    B_GUSD: (200* GUSDFee_1)/600 + (200* GUSDFee_2)/600 + (200*GUSDFee_3)/650
    C_GUSD: (300* GUSDFee_1)/600 + (300* GUSDFee_2)/600 + (300*GUSDFee_3)/650
    D_GUSD:                                               (100*GUSDFee_3)/650
    */

    // Expected GIVE gains
    const expectedGIVEGain_A = toBN('100').mul(emittedETHFee_1).div( toBN('600'))
                            .add(toBN('100').mul(emittedETHFee_2).div( toBN('600')))
                            .add(toBN('100').mul(emittedETHFee_3).div( toBN('650')))

    const expectedGIVEGain_B = toBN('200').mul(emittedETHFee_1).div( toBN('600'))
                            .add(toBN('200').mul(emittedETHFee_2).div( toBN('600')))
                            .add(toBN('200').mul(emittedETHFee_3).div( toBN('650')))

    const expectedGIVEGain_C = toBN('300').mul(emittedETHFee_1).div( toBN('600'))
                            .add(toBN('300').mul(emittedETHFee_2).div( toBN('600')))
                            .add(toBN('300').mul(emittedETHFee_3).div( toBN('650')))

    const expectedGIVEGain_D = toBN('50').mul(emittedETHFee_3).div( toBN('650'))

    // Expected GUSD gains:
    const expectedGUSDGain_A = toBN('100').mul(emittedGUSDFee_1).div( toBN('600'))
                            .add(toBN('100').mul(emittedGUSDFee_2).div( toBN('600')))
                            .add(toBN('100').mul(emittedGUSDFee_3).div( toBN('650')))

    const expectedGUSDGain_B = toBN('200').mul(emittedGUSDFee_1).div( toBN('600'))
                            .add(toBN('200').mul(emittedGUSDFee_2).div( toBN('600')))
                            .add(toBN('200').mul(emittedGUSDFee_3).div( toBN('650')))

    const expectedGUSDGain_C = toBN('300').mul(emittedGUSDFee_1).div( toBN('600'))
                            .add(toBN('300').mul(emittedGUSDFee_2).div( toBN('600')))
                            .add(toBN('300').mul(emittedGUSDFee_3).div( toBN('650')))
    
    const expectedGUSDGain_D = toBN('50').mul(emittedGUSDFee_3).div( toBN('650'))


    const A_GIVEBalance_Before = toBN(await web3.eth.getBalance(A))
    const A_GUSDBalance_Before = toBN(await gusdToken.balanceOf(A))
    const B_GIVEBalance_Before = toBN(await web3.eth.getBalance(B))
    const B_GUSDBalance_Before = toBN(await gusdToken.balanceOf(B))
    const C_GIVEBalance_Before = toBN(await web3.eth.getBalance(C))
    const C_GUSDBalance_Before = toBN(await gusdToken.balanceOf(C))
    const D_GIVEBalance_Before = toBN(await web3.eth.getBalance(D))
    const D_GUSDBalance_Before = toBN(await gusdToken.balanceOf(D))

    // A-D un-stake
    const unstake_A = await gvtyStaking.unstake(dec(100, 18), {from: A, gasPrice: 0})
    const unstake_B = await gvtyStaking.unstake(dec(200, 18), {from: B, gasPrice: 0})
    const unstake_C = await gvtyStaking.unstake(dec(400, 18), {from: C, gasPrice: 0})
    const unstake_D = await gvtyStaking.unstake(dec(50, 18), {from: D, gasPrice: 0})

    // Confirm all depositors could withdraw

    //Confirm pool Size is now 0
    assert.equal((await gvtyToken.balanceOf(gvtyStaking.address)), '0')
    assert.equal((await gvtyStaking.totalGVTYStaked()), '0')

    // Get A-D GIVE and GUSD balances
    const A_GIVEBalance_After = toBN(await web3.eth.getBalance(A))
    const A_GUSDBalance_After = toBN(await gusdToken.balanceOf(A))
    const B_GIVEBalance_After = toBN(await web3.eth.getBalance(B))
    const B_GUSDBalance_After = toBN(await gusdToken.balanceOf(B))
    const C_GIVEBalance_After = toBN(await web3.eth.getBalance(C))
    const C_GUSDBalance_After = toBN(await gusdToken.balanceOf(C))
    const D_GIVEBalance_After = toBN(await web3.eth.getBalance(D))
    const D_GUSDBalance_After = toBN(await gusdToken.balanceOf(D))

    // Get GIVE and GUSD gains
    const A_GIVEGain = A_GIVEBalance_After.sub(A_GIVEBalance_Before)
    const A_GUSDGain = A_GUSDBalance_After.sub(A_GUSDBalance_Before)
    const B_GIVEGain = B_GIVEBalance_After.sub(B_GIVEBalance_Before)
    const B_GUSDGain = B_GUSDBalance_After.sub(B_GUSDBalance_Before)
    const C_GIVEGain = C_GIVEBalance_After.sub(C_GIVEBalance_Before)
    const C_GUSDGain = C_GUSDBalance_After.sub(C_GUSDBalance_Before)
    const D_GIVEGain = D_GIVEBalance_After.sub(D_GIVEBalance_Before)
    const D_GUSDGain = D_GUSDBalance_After.sub(D_GUSDBalance_Before)

    // Check gains match expected amounts
    assert.isAtMost(th.getDifference(expectedGIVEGain_A, A_GIVEGain), 1000)
    assert.isAtMost(th.getDifference(expectedGUSDGain_A, A_GUSDGain), 1000)
    assert.isAtMost(th.getDifference(expectedGIVEGain_B, B_GIVEGain), 1000)
    assert.isAtMost(th.getDifference(expectedGUSDGain_B, B_GUSDGain), 1000)
    assert.isAtMost(th.getDifference(expectedGIVEGain_C, C_GIVEGain), 1000)
    assert.isAtMost(th.getDifference(expectedGUSDGain_C, C_GUSDGain), 1000)
    assert.isAtMost(th.getDifference(expectedGIVEGain_D, D_GIVEGain), 1000)
    assert.isAtMost(th.getDifference(expectedGUSDGain_D, D_GUSDGain), 1000)
  })
 
  it("unstake(): reverts if caller has GIVE gains and can't receive GIVE",  async () => {
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: whale } })  
    await openTrove({ extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: A } })
    await openTrove({ extraGUSDAmount: toBN(dec(30000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: B } })
    await openTrove({ extraGUSDAmount: toBN(dec(40000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: C } })
    await openTrove({ extraGUSDAmount: toBN(dec(50000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: D } })

    await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

    // multisig transfers GVTY to staker A and the non-payable proxy
    await gvtyToken.transfer(A, dec(100, 18), {from: multisig})
    await gvtyToken.transfer(nonPayable.address, dec(100, 18), {from: multisig})

    //  A makes stake
    const A_stakeTx = await gvtyStaking.stake(dec(100, 18), {from: A})
    assert.isTrue(A_stakeTx.receipt.status)

    //  A tells proxy to make a stake
    const proxystakeTxData = await th.getTransactionData('stake(uint256)', ['0x56bc75e2d63100000'])  // proxy stakes 100 GVTY
    await nonPayable.forward(gvtyStaking.address, proxystakeTxData, {from: A})


    // B makes a redemption, creating GIVE gain for proxy
    const redemptionTx_1 = await th.redeemCollateralAndGetTxObject(B, contracts, dec(45, 18))
    
    const proxy_GIVEGain = await gvtyStaking.getPendingGIVEGain(nonPayable.address)
    assert.isTrue(proxy_GIVEGain.gt(toBN('0')))

    // Expect this tx to revert: stake() tries to send nonPayable proxy's accumulated GIVE gain (albeit 0),
    //  A tells proxy to unstake
    const proxyUnStakeTxData = await th.getTransactionData('unstake(uint256)', ['0x56bc75e2d63100000'])  // proxy stakes 100 GVTY
    const proxyUnstakeTxPromise = nonPayable.forward(gvtyStaking.address, proxyUnStakeTxData, {from: A})
   
    // but nonPayable proxy can not accept GIVE - therefore stake() reverts.
    await assertRevert(proxyUnstakeTxPromise)
  })

  it("receive(): reverts when it receives GIVE from an address that is not the Active Pool",  async () => { 
    const ethSendTxPromise1 = web3.eth.sendTransaction({to: gvtyStaking.address, from: A, value: dec(1, 'give')})
    const ethSendTxPromise2 = web3.eth.sendTransaction({to: gvtyStaking.address, from: owner, value: dec(1, 'give')})

    await assertRevert(ethSendTxPromise1)
    await assertRevert(ethSendTxPromise2)
  })

  it("unstake(): reverts if user has no stake",  async () => {  
    const unstakeTxPromise1 = gvtyStaking.unstake(1, {from: A})
    const unstakeTxPromise2 = gvtyStaking.unstake(1, {from: owner})

    await assertRevert(unstakeTxPromise1)
    await assertRevert(unstakeTxPromise2)
  })

  it('Test requireCallerIsTroveManager', async () => {
    const gvtyStakingTester = await GVTYStakingTester.new()
    await assertRevert(gvtyStakingTester.requireCallerIsTroveManager(), 'GVTYStaking: caller is not TroveM')
  })
})
