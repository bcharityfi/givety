const deploymentHelper = require("../utils/deploymentHelpers.js")
const testHelpers = require("../utils/testHelpers.js")
const TroveManagerTester = artifacts.require("TroveManagerTester")

const th = testHelpers.TestHelper
const timeValues = testHelpers.TimeValues

const dec = th.dec
const toBN = th.toBN
const assertRevert = th.assertRevert

/* The majority of access control tests are contained in this file. However, tests for restrictions 
on the Givety admin address's capabilities during the first year are found in:

test/launchSequenceTest/DuringLockupPeriodTest.js */

contract('Access Control: Givety functions with the caller restricted to Givety contract(s)', async accounts => {

  const [owner, alice, bob, carol] = accounts;
  const [bountyAddress, lpRewardsAddress, multisig] = accounts.slice(997, 1000)

  let coreContracts

  let priceFeed
  let gusdToken
  let sortedTroves
  let troveManager
  let nameRegistry
  let activePool
  let stabilityPool
  let defaultPool
  let functionCaller
  let borrowerOperations

  let gvtyStaking
  let gvtyToken
  let communityIssuance
  let lockupContractFactory

  before(async () => {
    coreContracts = await deploymentHelper.deployGivetyCore()
    coreContracts.troveManager = await TroveManagerTester.new()
    coreContracts = await deploymentHelper.deployGUSDTokenTester(coreContracts)
    const GVTYContracts = await deploymentHelper.deployGVTYTesterContractsHardhat(bountyAddress, lpRewardsAddress, multisig)
    
    priceFeed = coreContracts.priceFeed
    gusdToken = coreContracts.gusdToken
    sortedTroves = coreContracts.sortedTroves
    troveManager = coreContracts.troveManager
    nameRegistry = coreContracts.nameRegistry
    activePool = coreContracts.activePool
    stabilityPool = coreContracts.stabilityPool
    defaultPool = coreContracts.defaultPool
    functionCaller = coreContracts.functionCaller
    borrowerOperations = coreContracts.borrowerOperations

    gvtyStaking = GVTYContracts.gvtyStaking
    gvtyToken = GVTYContracts.gvtyToken
    communityIssuance = GVTYContracts.communityIssuance
    lockupContractFactory = GVTYContracts.lockupContractFactory

    await deploymentHelper.connectGVTYContracts(GVTYContracts)
    await deploymentHelper.connectCoreContracts(coreContracts, GVTYContracts)
    await deploymentHelper.connectGVTYContractsToCore(GVTYContracts, coreContracts)

    for (account of accounts.slice(0, 10)) {
      await th.openTrove(coreContracts, { extraGUSDAmount: toBN(dec(20000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: account } })
    }

    const expectedCISupplyCap = '9000000000000000000000000' // 32mil

    // Check CI has been properly funded
    const bal = await gvtyToken.balanceOf(communityIssuance.address)
    assert.equal(bal, expectedCISupplyCap)
  })

  describe('BorrowerOperations', async accounts => { 
    it("moveGIVEGainToTrove(): reverts when called by an account that is not StabilityPool", async () => {
      // Attempt call from alice
      try {
        const tx1= await borrowerOperations.moveGIVEGainToTrove(bob, bob, bob, { from: bob })
      } catch (err) {
         assert.include(err.message, "revert")
        // assert.include(err.message, "BorrowerOps: Caller is not Stability Pool")
      }
    })
  })

  describe('TroveManager', async accounts => {
    // applyPendingRewards
    it("applyPendingRewards(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.applyPendingRewards(bob, { from: alice })
        
      } catch (err) {
         assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // updateRewardSnapshots
    it("updateRewardSnapshots(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.updateTroveRewardSnapshots(bob, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert" )
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // removeStake
    it("removeStake(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.removeStake(bob, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // updateStakeAndTotalStakes
    it("updateStakeAndTotalStakes(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.updateStakeAndTotalStakes(bob, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // closeTrove
    it("closeTrove(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.closeTrove(bob, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // addTroveOwnerToArray
    it("addTroveOwnerToArray(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.addTroveOwnerToArray(bob, { from: alice })
        
      } catch (err) {
         assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // setTroveStatus
    it("setTroveStatus(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.setTroveStatus(bob, 1, { from: alice })
        
      } catch (err) {
         assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // increaseTroveColl
    it("increaseTroveColl(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.increaseTroveColl(bob, 100, { from: alice })
        
      } catch (err) {
         assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // decreaseTroveColl
    it("decreaseTroveColl(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.decreaseTroveColl(bob, 100, { from: alice })
        
      } catch (err) {
         assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // increaseTroveDebt
    it("increaseTroveDebt(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.increaseTroveDebt(bob, 100, { from: alice })
        
      } catch (err) {
         assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })

    // decreaseTroveDebt
    it("decreaseTroveDebt(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      try {
        const txAlice = await troveManager.decreaseTroveDebt(bob, 100, { from: alice })
        
      } catch (err) {
         assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is not the BorrowerOperations contract")
      }
    })
  })

  describe('ActivePool', async accounts => {
    // sendGIVE
    it("sendGIVE(): reverts when called by an account that is not BO nor TroveM nor SP", async () => {
      // Attempt call from alice
      try {
        const txAlice = await activePool.sendGIVE(alice, 100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is neither BorrowerOperations nor TroveManager nor StabilityPool")
      }
    })

    // increaseGUSD	
    it("increaseGUSDDebt(): reverts when called by an account that is not BO nor TroveM", async () => {
      // Attempt call from alice
      try {
        const txAlice = await activePool.increaseGUSDDebt(100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is neither BorrowerOperations nor TroveManager")
      }
    })

    // decreaseGUSD
    it("decreaseGUSDDebt(): reverts when called by an account that is not BO nor TroveM nor SP", async () => {
      // Attempt call from alice
      try {
        const txAlice = await activePool.decreaseGUSDDebt(100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is neither BorrowerOperations nor TroveManager nor StabilityPool")
      }
    })

    // fallback (payment)	
    it("fallback(): reverts when called by an account that is not Borrower Operations nor Default Pool", async () => {
      // Attempt call from alice
      try {
        const txAlice = await web3.eth.sendTransaction({ from: alice, to: activePool.address, value: 100 })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "ActivePool: Caller is neither BO nor Default Pool")
      }
    })
  })

  describe('DefaultPool', async accounts => {
    // sendGIVEToActivePool
    it("sendGIVEToActivePool(): reverts when called by an account that is not TroveManager", async () => {
      // Attempt call from alice
      try {
        const txAlice = await defaultPool.sendGIVEToActivePool(100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is not the TroveManager")
      }
    })

    // increaseGUSD	
    it("increaseGUSDDebt(): reverts when called by an account that is not TroveManager", async () => {
      // Attempt call from alice
      try {
        const txAlice = await defaultPool.increaseGUSDDebt(100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is not the TroveManager")
      }
    })

    // decreaseGUSD	
    it("decreaseGUSD(): reverts when called by an account that is not TroveManager", async () => {
      // Attempt call from alice
      try {
        const txAlice = await defaultPool.decreaseGUSDDebt(100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is not the TroveManager")
      }
    })

    // fallback (payment)	
    it("fallback(): reverts when called by an account that is not the Active Pool", async () => {
      // Attempt call from alice
      try {
        const txAlice = await web3.eth.sendTransaction({ from: alice, to: defaultPool.address, value: 100 })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "DefaultPool: Caller is not the ActivePool")
      }
    })
  })

  describe('StabilityPool', async accounts => {
    // --- onlyTroveManager --- 

    // offset
    it("offset(): reverts when called by an account that is not TroveManager", async () => {
      // Attempt call from alice
      try {
        txAlice = await stabilityPool.offset(100, 10, { from: alice })
        assert.fail(txAlice)
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is not TroveManager")
      }
    })

    // --- onlyActivePool ---

    // fallback (payment)	
    it("fallback(): reverts when called by an account that is not the Active Pool", async () => {
      // Attempt call from alice
      try {
        const txAlice = await web3.eth.sendTransaction({ from: alice, to: stabilityPool.address, value: 100 })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "StabilityPool: Caller is not ActivePool")
      }
    })
  })

  describe('GUSDToken', async accounts => {

    //    mint
    it("mint(): reverts when called by an account that is not BorrowerOperations", async () => {
      // Attempt call from alice
      const txAlice = gusdToken.mint(bob, 100, { from: alice })
      await th.assertRevert(txAlice, "Caller is not BorrowerOperations")
    })

    // burn
    it("burn(): reverts when called by an account that is not BO nor TroveM nor SP", async () => {
      // Attempt call from alice
      try {
        const txAlice = await gusdToken.burn(bob, 100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is neither BorrowerOperations nor TroveManager nor StabilityPool")
      }
    })

    // sendToPool
    it("sendToPool(): reverts when called by an account that is not StabilityPool", async () => {
      // Attempt call from alice
      try {
        const txAlice = await gusdToken.sendToPool(bob, activePool.address, 100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is not the StabilityPool")
      }
    })

    // returnFromPool
    it("returnFromPool(): reverts when called by an account that is not TroveManager nor StabilityPool", async () => {
      // Attempt call from alice
      try {
        const txAlice = await gusdToken.returnFromPool(activePool.address, bob, 100, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        // assert.include(err.message, "Caller is neither TroveManager nor StabilityPool")
      }
    })
  })

  describe('SortedTroves', async accounts => {
    // --- onlyBorrowerOperations ---
    //     insert
    it("insert(): reverts when called by an account that is not BorrowerOps or TroveM", async () => {
      // Attempt call from alice
      try {
        const txAlice = await sortedTroves.insert(bob, '150000000000000000000', bob, bob, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, " Caller is neither BO nor TroveM")
      }
    })

    // --- onlyTroveManager ---
    // remove
    it("remove(): reverts when called by an account that is not TroveManager", async () => {
      // Attempt call from alice
      try {
        const txAlice = await sortedTroves.remove(bob, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, " Caller is not the TroveManager")
      }
    })

    // --- onlyTroveMorBM ---
    // reinsert
    it("reinsert(): reverts when called by an account that is neither BorrowerOps nor TroveManager", async () => {
      // Attempt call from alice
      try {
        const txAlice = await sortedTroves.reInsert(bob, '150000000000000000000', bob, bob, { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
        assert.include(err.message, "Caller is neither BO nor TroveM")
      }
    })
  })

  describe('LockupContract', async accounts => {
    it("withdrawGVTY(): reverts when caller is not beneficiary", async () => {
      // deploy new LC with Carol as beneficiary
      const unlockTime = (await gvtyToken.getDeploymentStartTime()).add(toBN(timeValues.SECONDS_IN_ONE_YEAR))
      const deployedLCtx = await lockupContractFactory.deployLockupContract(
        carol, 
        unlockTime,
        { from: owner })

      const LC = await th.getLCFromDeploymentTx(deployedLCtx)

      // GVTY Multisig funds the LC
      await gvtyToken.transfer(LC.address, dec(100, 18), { from: multisig })

      // Fast-forward one year, so that beneficiary can withdraw
      await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

      // Bob attempts to withdraw GVTY
      try {
        const txBob = await LC.withdrawGVTY({ from: bob })
        
      } catch (err) {
        assert.include(err.message, "revert")
      }

      // Confirm beneficiary, Carol, can withdraw
      const txCarol = await LC.withdrawGVTY({ from: carol })
      assert.isTrue(txCarol.receipt.status)
    })
  })

  describe('GVTYStaking', async accounts => {
    it("increaseF_GUSD(): reverts when caller is not TroveManager", async () => {
      try {
        const txAlice = await gvtyStaking.increaseF_GUSD(dec(1, 18), { from: alice })
        
      } catch (err) {
        assert.include(err.message, "revert")
      }
    })
  })

  describe('GVTYToken', async accounts => {
    it("sendToGVTYStaking(): reverts when caller is not the GVTYSstaking", async () => {
      // Check multisig has some GVTY
      assert.isTrue((await gvtyToken.balanceOf(multisig)).gt(toBN('0')))

      // multisig tries to call it
      try {
        const tx = await gvtyToken.sendToGVTYStaking(multisig, 1, { from: multisig })
      } catch (err) {
        assert.include(err.message, "revert")
      }

      // FF >> time one year
      await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)

      // Owner transfers 1 GVTY to bob
      await gvtyToken.transfer(bob, dec(1, 18), { from: multisig })
      assert.equal((await gvtyToken.balanceOf(bob)), dec(1, 18))

      // Bob tries to call it
      try {
        const tx = await gvtyToken.sendToGVTYStaking(bob, dec(1, 18), { from: bob })
      } catch (err) {
        assert.include(err.message, "revert")
      }
    })
  })

  describe('CommunityIssuance', async accounts => {
    it("sendGVTY(): reverts when caller is not the StabilityPool", async () => {
      const tx1 = communityIssuance.sendGVTY(alice, dec(100, 18), {from: alice})
      const tx2 = communityIssuance.sendGVTY(bob, dec(100, 18), {from: alice})
      const tx3 = communityIssuance.sendGVTY(stabilityPool.address, dec(100, 18), {from: alice})
     
      assertRevert(tx1)
      assertRevert(tx2)
      assertRevert(tx3)
    })

    it("issueGVTY(): reverts when caller is not the StabilityPool", async () => {
      const tx1 = communityIssuance.issueGVTY({from: alice})

      assertRevert(tx1)
    })
  })

  
})


