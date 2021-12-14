const LockupContract = artifacts.require("./LockupContract.sol")
const LockupContractFactory = artifacts.require("./LockupContractFactory.sol")
const deploymentHelper = require("../../utils/deploymentHelpers.js")

const { TestHelper: th, TimeValues: timeValues } = require("../../utils/testHelpers.js")
const { dec, toBN, assertRevert, ZERO_ADDRESS } = th

contract('During the initial lockup period', async accounts => {
  const [
    givetyAG,
    teamMember_1,
    teamMember_2,
    teamMember_3,
    investor_1,
    investor_2,
    investor_3,
    A,
    B,
    C,
    D,
    E,
    F,
    G,
    H,
    I
  ] = accounts;

  const [bountyAddress, lpRewardsAddress, multisig] = accounts.slice(997, 1000)

  const SECONDS_IN_ONE_MONTH = timeValues.SECONDS_IN_ONE_MONTH
  const SECONDS_IN_364_DAYS = timeValues.SECONDS_IN_ONE_DAY * 364

  let GVTYContracts
  let coreContracts

  // LCs for team members on vesting schedules
  let LC_T1
  let LC_T2
  let LC_T3

  // LCs for investors
  let LC_I1
  let LC_I2
  let LC_I3

  // 1e24 = 1 million tokens with 18 decimal digits
  const teamMemberInitialEntitlement_1 = dec(1, 24)
  const teamMemberInitialEntitlement_2 = dec(2, 24)
  const teamMemberInitialEntitlement_3 = dec(3, 24)
  const investorInitialEntitlement_1 = dec(4, 24)
  const investorInitialEntitlement_2 = dec(5, 24)
  const investorInitialEntitlement_3 = dec(6, 24)

  const GVTYEntitlement_A = dec(1, 24)
  const GVTYEntitlement_B = dec(2, 24)
  const GVTYEntitlement_C = dec(3, 24)
  const GVTYEntitlement_D = dec(4, 24)
  const GVTYEntitlement_E = dec(5, 24)

  let oneYearFromSystemDeployment
  let twoYearsFromSystemDeployment

  beforeEach(async () => {
    // Deploy all contracts from the first account
    coreContracts = await deploymentHelper.deployGivetyCore()
    GVTYContracts = await deploymentHelper.deployGVTYTesterContractsHardhat(bountyAddress, lpRewardsAddress, multisig)

    gvtyStaking = GVTYContracts.gvtyStaking
    gvtyToken = GVTYContracts.gvtyToken
    communityIssuance = GVTYContracts.communityIssuance
    lockupContractFactory = GVTYContracts.lockupContractFactory

    await deploymentHelper.connectGVTYContracts(GVTYContracts)
    await deploymentHelper.connectCoreContracts(coreContracts, GVTYContracts)
    await deploymentHelper.connectGVTYContractsToCore(GVTYContracts, coreContracts)

    oneYearFromSystemDeployment = await th.getTimeFromSystemDeployment(gvtyToken, web3, timeValues.SECONDS_IN_ONE_YEAR)
    const secondsInTwoYears = toBN(timeValues.SECONDS_IN_ONE_YEAR).mul(toBN('2'))
    twoYearsFromSystemDeployment = await th.getTimeFromSystemDeployment(gvtyToken, web3, secondsInTwoYears)

    // Deploy 3 LCs for team members on vesting schedules
    const deployedLCtx_T1 = await lockupContractFactory.deployLockupContract(teamMember_1, oneYearFromSystemDeployment, { from: givetyAG })
    const deployedLCtx_T2 = await lockupContractFactory.deployLockupContract(teamMember_2, oneYearFromSystemDeployment, { from: givetyAG })
    const deployedLCtx_T3 = await lockupContractFactory.deployLockupContract(teamMember_3, oneYearFromSystemDeployment, { from: givetyAG })

    // Deploy 3 LCs for investors
    const deployedLCtx_I1 = await lockupContractFactory.deployLockupContract(investor_1, oneYearFromSystemDeployment, { from: givetyAG })
    const deployedLCtx_I2 = await lockupContractFactory.deployLockupContract(investor_2, oneYearFromSystemDeployment, { from: givetyAG })
    const deployedLCtx_I3 = await lockupContractFactory.deployLockupContract(investor_3, oneYearFromSystemDeployment, { from: givetyAG })

    // LCs for team members on vesting schedules
    LC_T1 = await th.getLCFromDeploymentTx(deployedLCtx_T1)
    LC_T2 = await th.getLCFromDeploymentTx(deployedLCtx_T2)
    LC_T3 = await th.getLCFromDeploymentTx(deployedLCtx_T3)

    // LCs for investors
    LC_I1 = await th.getLCFromDeploymentTx(deployedLCtx_I1)
    LC_I2 = await th.getLCFromDeploymentTx(deployedLCtx_I2)
    LC_I3 = await th.getLCFromDeploymentTx(deployedLCtx_I3)

    // Multisig transfers initial GVTY entitlements to LCs
    await gvtyToken.transfer(LC_T1.address, teamMemberInitialEntitlement_1, { from: multisig })
    await gvtyToken.transfer(LC_T2.address, teamMemberInitialEntitlement_2, { from: multisig })
    await gvtyToken.transfer(LC_T3.address, teamMemberInitialEntitlement_3, { from: multisig })

    await gvtyToken.transfer(LC_I1.address, investorInitialEntitlement_1, { from: multisig })
    await gvtyToken.transfer(LC_I2.address, investorInitialEntitlement_2, { from: multisig })
    await gvtyToken.transfer(LC_I3.address, investorInitialEntitlement_3, { from: multisig })

    // Fast forward time 364 days, so that still less than 1 year since launch has passed
    await th.fastForwardTime(SECONDS_IN_364_DAYS, web3.currentProvider)
  })

  describe('GVTY transfer during first year after GVTY deployment', async accounts => {
    // --- Givety  transfer restriction, 1st year ---
    it("Givety multisig can not transfer GVTY to a LC that was deployed directly", async () => {
      // Givety multisig deploys LC_A
      const LC_A = await LockupContract.new(gvtyToken.address, A, oneYearFromSystemDeployment, { from: multisig })

      // Account F deploys LC_B
      const LC_B = await LockupContract.new(gvtyToken.address, B, oneYearFromSystemDeployment, { from: F })

      // GVTY deployer deploys LC_C
      const LC_C = await LockupContract.new(gvtyToken.address, A, oneYearFromSystemDeployment, { from: givetyAG })

      // Givety multisig attempts GVTY transfer to LC_A
      try {
        const GVTYtransferTx_A = await gvtyToken.transfer(LC_A.address, dec(1, 18), { from: multisig })
        assert.isFalse(GVTYtransferTx_A.receipt.status)
      } catch (error) {
        assert.include(error.message, "GVTYToken: recipient must be a LockupContract registered in the Factory")
      }

      // Givety multisig attempts GVTY transfer to LC_B
      try {
        const GVTYtransferTx_B = await gvtyToken.transfer(LC_B.address, dec(1, 18), { from: multisig })
        assert.isFalse(GVTYtransferTx_B.receipt.status)
      } catch (error) {
        assert.include(error.message, "GVTYToken: recipient must be a LockupContract registered in the Factory")
      }

      try {
        const GVTYtransferTx_C = await gvtyToken.transfer(LC_C.address, dec(1, 18), { from: multisig })
        assert.isFalse(GVTYtransferTx_C.receipt.status)
      } catch (error) {
        assert.include(error.message, "GVTYToken: recipient must be a LockupContract registered in the Factory")
      }
    })

    it("Givety multisig can not transfer to an EOA or Givety system contracts", async () => {
      // Multisig attempts GVTY transfer to EOAs
      const GVTYtransferTxPromise_1 = gvtyToken.transfer(A, dec(1, 18), { from: multisig })
      const GVTYtransferTxPromise_2 = gvtyToken.transfer(B, dec(1, 18), { from: multisig })
      await assertRevert(GVTYtransferTxPromise_1)
      await assertRevert(GVTYtransferTxPromise_2)

      // Multisig attempts GVTY transfer to core Givety contracts
      for (const contract of Object.keys(coreContracts)) {
        const GVTYtransferTxPromise = gvtyToken.transfer(coreContracts[contract].address, dec(1, 18), { from: multisig })
        await assertRevert(GVTYtransferTxPromise, "GVTYToken: recipient must be a LockupContract registered in the Factory")
      }

      // Multisig attempts GVTY transfer to GVTY contracts (excluding LCs)
      for (const contract of Object.keys(GVTYContracts)) {
        const GVTYtransferTxPromise = gvtyToken.transfer(GVTYContracts[contract].address, dec(1, 18), { from: multisig })
        await assertRevert(GVTYtransferTxPromise, "GVTYToken: recipient must be a LockupContract registered in the Factory")
      }
    })

    // --- Givety  approval restriction, 1st year ---
    it("Givety multisig can not approve any EOA or Givety system contract to spend their GVTY", async () => {
      // Multisig attempts to approve EOAs to spend GVTY
      const GVTYApproveTxPromise_1 = gvtyToken.approve(A, dec(1, 18), { from: multisig })
      const GVTYApproveTxPromise_2 = gvtyToken.approve(B, dec(1, 18), { from: multisig })
      await assertRevert(GVTYApproveTxPromise_1, "GVTYToken: caller must not be the multisig")
      await assertRevert(GVTYApproveTxPromise_2, "GVTYToken: caller must not be the multisig")

      // Multisig attempts to approve Givety contracts to spend GVTY
      for (const contract of Object.keys(coreContracts)) {
        const GVTYApproveTxPromise = gvtyToken.approve(coreContracts[contract].address, dec(1, 18), { from: multisig })
        await assertRevert(GVTYApproveTxPromise, "GVTYToken: caller must not be the multisig")
      }

      // Multisig attempts to approve GVTY contracts to spend GVTY (excluding LCs)
      for (const contract of Object.keys(GVTYContracts)) {
        const GVTYApproveTxPromise = gvtyToken.approve(GVTYContracts[contract].address, dec(1, 18), { from: multisig })
        await assertRevert(GVTYApproveTxPromise, "GVTYToken: caller must not be the multisig")
      }
    })

    // --- Givety  increaseAllowance restriction, 1st year ---
    it("Givety multisig can not increaseAllowance for any EOA or Givety contract", async () => {
      // Multisig attempts to approve EOAs to spend GVTY
      const GVTYIncreaseAllowanceTxPromise_1 = gvtyToken.increaseAllowance(A, dec(1, 18), { from: multisig })
      const GVTYIncreaseAllowanceTxPromise_2 = gvtyToken.increaseAllowance(B, dec(1, 18), { from: multisig })
      await assertRevert(GVTYIncreaseAllowanceTxPromise_1, "GVTYToken: caller must not be the multisig")
      await assertRevert(GVTYIncreaseAllowanceTxPromise_2, "GVTYToken: caller must not be the multisig")

      // Multisig attempts to approve Givety contracts to spend GVTY
      for (const contract of Object.keys(coreContracts)) {
        const GVTYIncreaseAllowanceTxPromise = gvtyToken.increaseAllowance(coreContracts[contract].address, dec(1, 18), { from: multisig })
        await assertRevert(GVTYIncreaseAllowanceTxPromise, "GVTYToken: caller must not be the multisig")
      }

      // Multisig attempts to approve GVTY contracts to spend GVTY (excluding LCs)
      for (const contract of Object.keys(GVTYContracts)) {
        const GVTYIncreaseAllowanceTxPromise = gvtyToken.increaseAllowance(GVTYContracts[contract].address, dec(1, 18), { from: multisig })
        await assertRevert(GVTYIncreaseAllowanceTxPromise, "GVTYToken: caller must not be the multisig")
      }
    })

    // --- Givety  decreaseAllowance restriction, 1st year ---
    it("Givety multisig can not decreaseAllowance for any EOA or Givety contract", async () => {
      // Multisig attempts to decreaseAllowance on EOAs 
      const GVTYDecreaseAllowanceTxPromise_1 = gvtyToken.decreaseAllowance(A, dec(1, 18), { from: multisig })
      const GVTYDecreaseAllowanceTxPromise_2 = gvtyToken.decreaseAllowance(B, dec(1, 18), { from: multisig })
      await assertRevert(GVTYDecreaseAllowanceTxPromise_1, "GVTYToken: caller must not be the multisig")
      await assertRevert(GVTYDecreaseAllowanceTxPromise_2, "GVTYToken: caller must not be the multisig")

      // Multisig attempts to decrease allowance on Givety contracts
      for (const contract of Object.keys(coreContracts)) {
        const GVTYDecreaseAllowanceTxPromise = gvtyToken.decreaseAllowance(coreContracts[contract].address, dec(1, 18), { from: multisig })
        await assertRevert(GVTYDecreaseAllowanceTxPromise, "GVTYToken: caller must not be the multisig")
      }

      // Multisig attempts to decrease allowance on GVTY contracts (excluding LCs)
      for (const contract of Object.keys(GVTYContracts)) {
        const GVTYDecreaseAllowanceTxPromise = gvtyToken.decreaseAllowance(GVTYContracts[contract].address, dec(1, 18), { from: multisig })
        await assertRevert(GVTYDecreaseAllowanceTxPromise, "GVTYToken: caller must not be the multisig")
      }
    })

    // --- Givety multisig transferFrom restriction, 1st year ---
    it("Givety multisig can not be the sender in a transferFrom() call", async () => {
      // EOAs attempt to use multisig as sender in a transferFrom()
      const GVTYtransferFromTxPromise_1 = gvtyToken.transferFrom(multisig, A, dec(1, 18), { from: A })
      const GVTYtransferFromTxPromise_2 = gvtyToken.transferFrom(multisig, C, dec(1, 18), { from: B })
      await assertRevert(GVTYtransferFromTxPromise_1, "GVTYToken: sender must not be the multisig")
      await assertRevert(GVTYtransferFromTxPromise_2, "GVTYToken: sender must not be the multisig")
    })

    //  --- staking, 1st year ---
    it("Givety multisig can not stake their GVTY in the staking contract", async () => {
      const GVTYStakingTxPromise_1 = gvtyStaking.stake(dec(1, 18), { from: multisig })
      await assertRevert(GVTYStakingTxPromise_1, "GVTYToken: sender must not be the multisig")
    })

    // --- Anyone else ---

    it("Anyone (other than Givety multisig) can transfer GVTY to LCs deployed by anyone through the Factory", async () => {
      // Start D, E, F with some GVTY
      await gvtyToken.unprotectedMint(D, dec(1, 24))
      await gvtyToken.unprotectedMint(E, dec(2, 24))
      await gvtyToken.unprotectedMint(F, dec(3, 24))

      // H, I, and Givety  deploy lockup contracts with A, B, C as beneficiaries, respectively
      const deployedLCtx_A = await lockupContractFactory.deployLockupContract(A, oneYearFromSystemDeployment, { from: H })
      const deployedLCtx_B = await lockupContractFactory.deployLockupContract(B, oneYearFromSystemDeployment, { from: I })
      const deployedLCtx_C = await lockupContractFactory.deployLockupContract(C, oneYearFromSystemDeployment, { from: multisig })

      // Grab contract addresses from deployment tx events
      const LCAddress_A = await th.getLCAddressFromDeploymentTx(deployedLCtx_A)
      const LCAddress_B = await th.getLCAddressFromDeploymentTx(deployedLCtx_B)
      const LCAddress_C = await th.getLCAddressFromDeploymentTx(deployedLCtx_C)

      // Check balances of LCs are 0
      assert.equal(await gvtyToken.balanceOf(LCAddress_A), '0')
      assert.equal(await gvtyToken.balanceOf(LCAddress_B), '0')
      assert.equal(await gvtyToken.balanceOf(LCAddress_C), '0')

      // D, E, F transfer GVTY to LCs
      await gvtyToken.transfer(LCAddress_A, dec(1, 24), { from: D })
      await gvtyToken.transfer(LCAddress_B, dec(2, 24), { from: E })
      await gvtyToken.transfer(LCAddress_C, dec(3, 24), { from: F })

      // Check balances of LCs has increased
      assert.equal(await gvtyToken.balanceOf(LCAddress_A), dec(1, 24))
      assert.equal(await gvtyToken.balanceOf(LCAddress_B), dec(2, 24))
      assert.equal(await gvtyToken.balanceOf(LCAddress_C), dec(3, 24))
    })

    it("Anyone (other than Givety multisig) can transfer GVTY to LCs deployed by anyone directly", async () => {
      // Start D, E, F with some GVTY
      await gvtyToken.unprotectedMint(D, dec(1, 24))
      await gvtyToken.unprotectedMint(E, dec(2, 24))
      await gvtyToken.unprotectedMint(F, dec(3, 24))

      // H, I, LiqAG deploy lockup contracts with A, B, C as beneficiaries, respectively
      const LC_A = await LockupContract.new(gvtyToken.address, A, oneYearFromSystemDeployment, { from: H })
      const LC_B = await LockupContract.new(gvtyToken.address, B, oneYearFromSystemDeployment, { from: I })
      const LC_C = await LockupContract.new(gvtyToken.address, C, oneYearFromSystemDeployment, { from: multisig })

      // Check balances of LCs are 0
      assert.equal(await gvtyToken.balanceOf(LC_A.address), '0')
      assert.equal(await gvtyToken.balanceOf(LC_B.address), '0')
      assert.equal(await gvtyToken.balanceOf(LC_C.address), '0')

      // D, E, F transfer GVTY to LCs
      await gvtyToken.transfer(LC_A.address, dec(1, 24), { from: D })
      await gvtyToken.transfer(LC_B.address, dec(2, 24), { from: E })
      await gvtyToken.transfer(LC_C.address, dec(3, 24), { from: F })

      // Check balances of LCs has increased
      assert.equal(await gvtyToken.balanceOf(LC_A.address), dec(1, 24))
      assert.equal(await gvtyToken.balanceOf(LC_B.address), dec(2, 24))
      assert.equal(await gvtyToken.balanceOf(LC_C.address), dec(3, 24))
    })

    it("Anyone (other than givety multisig) can transfer to an EOA", async () => {
      // Start D, E, F with some GVTY
      await gvtyToken.unprotectedMint(D, dec(1, 24))
      await gvtyToken.unprotectedMint(E, dec(2, 24))
      await gvtyToken.unprotectedMint(F, dec(3, 24))

      // GVTY holders transfer to other transfer to EOAs
      const GVTYtransferTx_1 = await gvtyToken.transfer(A, dec(1, 18), { from: D })
      const GVTYtransferTx_2 = await gvtyToken.transfer(B, dec(1, 18), { from: E })
      const GVTYtransferTx_3 = await gvtyToken.transfer(multisig, dec(1, 18), { from: F })

      assert.isTrue(GVTYtransferTx_1.receipt.status)
      assert.isTrue(GVTYtransferTx_2.receipt.status)
      assert.isTrue(GVTYtransferTx_3.receipt.status)
    })

    it("Anyone (other than givety multisig) can approve any EOA or to spend their GVTY", async () => {
      // EOAs approve EOAs to spend GVTY
      const GVTYapproveTx_1 = await gvtyToken.approve(A, dec(1, 18), { from: F })
      const GVTYapproveTx_2 = await gvtyToken.approve(B, dec(1, 18), { from: G })
      await assert.isTrue(GVTYapproveTx_1.receipt.status)
      await assert.isTrue(GVTYapproveTx_2.receipt.status)
    })

    it("Anyone (other than givety multisig) can increaseAllowance for any EOA or Givety contract", async () => {
      // Anyone can increaseAllowance of EOAs to spend GVTY
      const GVTYIncreaseAllowanceTx_1 = await gvtyToken.increaseAllowance(A, dec(1, 18), { from: F })
      const GVTYIncreaseAllowanceTx_2 = await gvtyToken.increaseAllowance(B, dec(1, 18), { from: G })
      await assert.isTrue(GVTYIncreaseAllowanceTx_1.receipt.status)
      await assert.isTrue(GVTYIncreaseAllowanceTx_2.receipt.status)

      // Increase allowance of core Givety contracts
      for (const contract of Object.keys(coreContracts)) {
        const GVTYIncreaseAllowanceTx = await gvtyToken.increaseAllowance(coreContracts[contract].address, dec(1, 18), { from: F })
        await assert.isTrue(GVTYIncreaseAllowanceTx.receipt.status)
      }

      // Increase allowance of GVTY contracts
      for (const contract of Object.keys(GVTYContracts)) {
        const GVTYIncreaseAllowanceTx = await gvtyToken.increaseAllowance(GVTYContracts[contract].address, dec(1, 18), { from: F })
        await assert.isTrue(GVTYIncreaseAllowanceTx.receipt.status)
      }
    })

    it("Anyone (other than givety multisig) can decreaseAllowance for any EOA or Givety contract", async () => {
      //First, increase allowance of A, B and coreContracts and GVTY contracts
      const GVTYIncreaseAllowanceTx_1 = await gvtyToken.increaseAllowance(A, dec(1, 18), { from: F })
      const GVTYIncreaseAllowanceTx_2 = await gvtyToken.increaseAllowance(B, dec(1, 18), { from: G })
      await assert.isTrue(GVTYIncreaseAllowanceTx_1.receipt.status)
      await assert.isTrue(GVTYIncreaseAllowanceTx_2.receipt.status)

      for (const contract of Object.keys(coreContracts)) {
        const GVTYtransferTx = await gvtyToken.increaseAllowance(coreContracts[contract].address, dec(1, 18), { from: F })
        await assert.isTrue(GVTYtransferTx.receipt.status)
      }

      for (const contract of Object.keys(GVTYContracts)) {
        const GVTYtransferTx = await gvtyToken.increaseAllowance(GVTYContracts[contract].address, dec(1, 18), { from: F })
        await assert.isTrue(GVTYtransferTx.receipt.status)
      }

      // Decrease allowance of A, B
      const GVTYDecreaseAllowanceTx_1 = await gvtyToken.decreaseAllowance(A, dec(1, 18), { from: F })
      const GVTYDecreaseAllowanceTx_2 = await gvtyToken.decreaseAllowance(B, dec(1, 18), { from: G })
      await assert.isTrue(GVTYDecreaseAllowanceTx_1.receipt.status)
      await assert.isTrue(GVTYDecreaseAllowanceTx_2.receipt.status)

      // Decrease allowance of core contracts
      for (const contract of Object.keys(coreContracts)) {
        const GVTYDecreaseAllowanceTx = await gvtyToken.decreaseAllowance(coreContracts[contract].address, dec(1, 18), { from: F })
        await assert.isTrue(GVTYDecreaseAllowanceTx.receipt.status)
      }

      // Decrease allowance of GVTY contracts
      for (const contract of Object.keys(GVTYContracts)) {
        const GVTYDecreaseAllowanceTx = await gvtyToken.decreaseAllowance(GVTYContracts[contract].address, dec(1, 18), { from: F })
        await assert.isTrue(GVTYDecreaseAllowanceTx.receipt.status)
      }
    })

    it("Anyone (other than givety multisig) can be the sender in a transferFrom() call", async () => {
      // Fund A, B
      await gvtyToken.unprotectedMint(A, dec(1, 18))
      await gvtyToken.unprotectedMint(B, dec(1, 18))

      // A, B approve F, G
      await gvtyToken.approve(F, dec(1, 18), { from: A })
      await gvtyToken.approve(G, dec(1, 18), { from: B })

      const GVTYtransferFromTx_1 = await gvtyToken.transferFrom(A, F, dec(1, 18), { from: F })
      const GVTYtransferFromTx_2 = await gvtyToken.transferFrom(B, C, dec(1, 18), { from: G })
      await assert.isTrue(GVTYtransferFromTx_1.receipt.status)
      await assert.isTrue(GVTYtransferFromTx_2.receipt.status)
    })

    it("Anyone (other than givety ) can stake their GVTY in the staking contract", async () => {
      // Fund F
      await gvtyToken.unprotectedMint(F, dec(1, 18))

      const GVTYStakingTx_1 = await gvtyStaking.stake(dec(1, 18), { from: F })
      await assert.isTrue(GVTYStakingTx_1.receipt.status)
    })

  })
  // --- LCF ---

  describe('Lockup Contract Factory negative tests', async accounts => {
    it("deployLockupContract(): reverts when GVTY token address is not set", async () => {
      // Fund F
      await gvtyToken.unprotectedMint(F, dec(20, 24))

      // deploy new LCF
      const LCFNew = await LockupContractFactory.new()

      // Check GVTYToken address not registered
      const registeredGVTYTokenAddr = await LCFNew.gvtyTokenAddress()
      assert.equal(registeredGVTYTokenAddr, ZERO_ADDRESS)

      const tx = LCFNew.deployLockupContract(A, oneYearFromSystemDeployment, { from: F })
      await assertRevert(tx)
    })
  })

  // --- LCs ---
  describe('Transferring GVTY to LCs', async accounts => {
    it("Givety multisig can transfer GVTY (vesting) to lockup contracts they deployed", async () => {
      const initialGVTYBalanceOfLC_T1 = await gvtyToken.balanceOf(LC_T1.address)
      const initialGVTYBalanceOfLC_T2 = await gvtyToken.balanceOf(LC_T2.address)
      const initialGVTYBalanceOfLC_T3 = await gvtyToken.balanceOf(LC_T3.address)

      // Check initial LC balances == entitlements
      assert.equal(initialGVTYBalanceOfLC_T1, teamMemberInitialEntitlement_1)
      assert.equal(initialGVTYBalanceOfLC_T2, teamMemberInitialEntitlement_2)
      assert.equal(initialGVTYBalanceOfLC_T3, teamMemberInitialEntitlement_3)

      // One month passes
      await th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider)

      // Givety multisig transfers vesting amount
      await gvtyToken.transfer(LC_T1.address, dec(1, 24), { from: multisig })
      await gvtyToken.transfer(LC_T2.address, dec(1, 24), { from: multisig })
      await gvtyToken.transfer(LC_T3.address, dec(1, 24), { from: multisig })

      // Get new LC GVTY balances
      const GVTYBalanceOfLC_T1_1 = await gvtyToken.balanceOf(LC_T1.address)
      const GVTYBalanceOfLC_T2_1 = await gvtyToken.balanceOf(LC_T2.address)
      const GVTYBalanceOfLC_T3_1 = await gvtyToken.balanceOf(LC_T3.address)

      // // Check team member LC balances have increased 
      assert.isTrue(GVTYBalanceOfLC_T1_1.eq(th.toBN(initialGVTYBalanceOfLC_T1).add(th.toBN(dec(1, 24)))))
      assert.isTrue(GVTYBalanceOfLC_T2_1.eq(th.toBN(initialGVTYBalanceOfLC_T2).add(th.toBN(dec(1, 24)))))
      assert.isTrue(GVTYBalanceOfLC_T3_1.eq(th.toBN(initialGVTYBalanceOfLC_T3).add(th.toBN(dec(1, 24)))))

      // Another month passes
      await th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider)

      // Givety multisig transfers vesting amount
      await gvtyToken.transfer(LC_T1.address, dec(1, 24), { from: multisig })
      await gvtyToken.transfer(LC_T2.address, dec(1, 24), { from: multisig })
      await gvtyToken.transfer(LC_T3.address, dec(1, 24), { from: multisig })

      // Get new LC GVTY balances
      const GVTYBalanceOfLC_T1_2 = await gvtyToken.balanceOf(LC_T1.address)
      const GVTYBalanceOfLC_T2_2 = await gvtyToken.balanceOf(LC_T2.address)
      const GVTYBalanceOfLC_T3_2 = await gvtyToken.balanceOf(LC_T3.address)

      // Check team member LC balances have increased again
      assert.isTrue(GVTYBalanceOfLC_T1_2.eq(GVTYBalanceOfLC_T1_1.add(th.toBN(dec(1, 24)))))
      assert.isTrue(GVTYBalanceOfLC_T2_2.eq(GVTYBalanceOfLC_T2_1.add(th.toBN(dec(1, 24)))))
      assert.isTrue(GVTYBalanceOfLC_T3_2.eq(GVTYBalanceOfLC_T3_1.add(th.toBN(dec(1, 24)))))
    })

    it("Givety multisig can transfer GVTY to lockup contracts deployed by anyone", async () => {
      // A, B, C each deploy a lockup contract with themself as beneficiary
      const deployedLCtx_A = await lockupContractFactory.deployLockupContract(A, twoYearsFromSystemDeployment, { from: A })
      const deployedLCtx_B = await lockupContractFactory.deployLockupContract(B, twoYearsFromSystemDeployment, { from: B })
      const deployedLCtx_C = await lockupContractFactory.deployLockupContract(C, twoYearsFromSystemDeployment, { from: C })

      // LCs for team members on vesting schedules
      const LC_A = await th.getLCFromDeploymentTx(deployedLCtx_A)
      const LC_B = await th.getLCFromDeploymentTx(deployedLCtx_B)
      const LC_C = await th.getLCFromDeploymentTx(deployedLCtx_C)

      // Check balances of LCs are 0
      assert.equal(await gvtyToken.balanceOf(LC_A.address), '0')
      assert.equal(await gvtyToken.balanceOf(LC_B.address), '0')
      assert.equal(await gvtyToken.balanceOf(LC_C.address), '0')

      // One month passes
      await th.fastForwardTime(SECONDS_IN_ONE_MONTH, web3.currentProvider)

      // Givety multisig transfers GVTY to LCs deployed by other accounts
      await gvtyToken.transfer(LC_A.address, dec(1, 24), { from: multisig })
      await gvtyToken.transfer(LC_B.address, dec(2, 24), { from: multisig })
      await gvtyToken.transfer(LC_C.address, dec(3, 24), { from: multisig })

      // Check balances of LCs have increased
      assert.equal(await gvtyToken.balanceOf(LC_A.address), dec(1, 24))
      assert.equal(await gvtyToken.balanceOf(LC_B.address), dec(2, 24))
      assert.equal(await gvtyToken.balanceOf(LC_C.address), dec(3, 24))
    })
  })

  describe('Deploying new LCs', async accounts => {
    it("GVTY Deployer can deploy LCs through the Factory", async () => {
      // GVTY deployer deploys LCs
      const LCDeploymentTx_A = await lockupContractFactory.deployLockupContract(A, oneYearFromSystemDeployment, { from: givetyAG })
      const LCDeploymentTx_B = await lockupContractFactory.deployLockupContract(B, twoYearsFromSystemDeployment, { from: givetyAG })
      const LCDeploymentTx_C = await lockupContractFactory.deployLockupContract(C, '9595995999999900000023423234', { from: givetyAG })

      assert.isTrue(LCDeploymentTx_A.receipt.status)
      assert.isTrue(LCDeploymentTx_B.receipt.status)
      assert.isTrue(LCDeploymentTx_C.receipt.status)
    })

    it("Givety multisig can deploy LCs through the Factory", async () => {
      // GVTY deployer deploys LCs
      const LCDeploymentTx_A = await lockupContractFactory.deployLockupContract(A, oneYearFromSystemDeployment, { from: multisig })
      const LCDeploymentTx_B = await lockupContractFactory.deployLockupContract(B, twoYearsFromSystemDeployment, { from: multisig })
      const LCDeploymentTx_C = await lockupContractFactory.deployLockupContract(C, '9595995999999900000023423234', { from: multisig })

      assert.isTrue(LCDeploymentTx_A.receipt.status)
      assert.isTrue(LCDeploymentTx_B.receipt.status)
      assert.isTrue(LCDeploymentTx_C.receipt.status)
    })

    it("Anyone can deploy LCs through the Factory", async () => {
      // Various EOAs deploy LCs
      const LCDeploymentTx_1 = await lockupContractFactory.deployLockupContract(A, oneYearFromSystemDeployment, { from: teamMember_1 })
      const LCDeploymentTx_2 = await lockupContractFactory.deployLockupContract(C, twoYearsFromSystemDeployment, { from: investor_2 })
      const LCDeploymentTx_3 = await lockupContractFactory.deployLockupContract(givetyAG, '9595995999999900000023423234', { from: A })
      const LCDeploymentTx_4 = await lockupContractFactory.deployLockupContract(D, twoYearsFromSystemDeployment, { from: B })

      assert.isTrue(LCDeploymentTx_1.receipt.status)
      assert.isTrue(LCDeploymentTx_2.receipt.status)
      assert.isTrue(LCDeploymentTx_3.receipt.status)
      assert.isTrue(LCDeploymentTx_4.receipt.status)
    })

    it("GVTY Deployer can deploy LCs directly", async () => {
      // GVTY deployer deploys LCs
      const LC_A = await LockupContract.new(gvtyToken.address, A, oneYearFromSystemDeployment, { from: givetyAG })
      const LC_A_txReceipt = await web3.eth.getTransactionReceipt(LC_A.transactionHash)

      const LC_B = await LockupContract.new(gvtyToken.address, B, twoYearsFromSystemDeployment, { from: givetyAG })
      const LC_B_txReceipt = await web3.eth.getTransactionReceipt(LC_B.transactionHash)

      const LC_C = await LockupContract.new(gvtyToken.address, C, twoYearsFromSystemDeployment, { from: givetyAG })
      const LC_C_txReceipt = await web3.eth.getTransactionReceipt(LC_C.transactionHash)

      // Check deployment succeeded
      assert.isTrue(LC_A_txReceipt.status)
      assert.isTrue(LC_B_txReceipt.status)
      assert.isTrue(LC_C_txReceipt.status)
    })

    it("Givety multisig can deploy LCs directly", async () => {
      // GVTY deployer deploys LCs
      const LC_A = await LockupContract.new(gvtyToken.address, A, oneYearFromSystemDeployment, { from: multisig })
      const LC_A_txReceipt = await web3.eth.getTransactionReceipt(LC_A.transactionHash)

      const LC_B = await LockupContract.new(gvtyToken.address, B, twoYearsFromSystemDeployment, { from: multisig })
      const LC_B_txReceipt = await web3.eth.getTransactionReceipt(LC_B.transactionHash)

      const LC_C = await LockupContract.new(gvtyToken.address, C, twoYearsFromSystemDeployment, { from: multisig })
      const LC_C_txReceipt = await web3.eth.getTransactionReceipt(LC_C.transactionHash)

      // Check deployment succeeded
      assert.isTrue(LC_A_txReceipt.status)
      assert.isTrue(LC_B_txReceipt.status)
      assert.isTrue(LC_C_txReceipt.status)
    })

    it("Anyone can deploy LCs directly", async () => {
      // Various EOAs deploy LCs
      const LC_A = await LockupContract.new(gvtyToken.address, A, oneYearFromSystemDeployment, { from: D })
      const LC_A_txReceipt = await web3.eth.getTransactionReceipt(LC_A.transactionHash)

      const LC_B = await LockupContract.new(gvtyToken.address, B, twoYearsFromSystemDeployment, { from: E })
      const LC_B_txReceipt = await web3.eth.getTransactionReceipt(LC_B.transactionHash)

      const LC_C = await LockupContract.new(gvtyToken.address, C, twoYearsFromSystemDeployment, { from: F })
      const LC_C_txReceipt = await web3.eth.getTransactionReceipt(LC_C.transactionHash)

      // Check deployment succeeded
      assert.isTrue(LC_A_txReceipt.status)
      assert.isTrue(LC_B_txReceipt.status)
      assert.isTrue(LC_C_txReceipt.status)
    })

    it("Anyone can deploy LCs with unlockTime = one year from deployment, directly and through factory", async () => {
      // Deploy directly
      const LC_1 = await LockupContract.new(gvtyToken.address, A, oneYearFromSystemDeployment, { from: D })
      const LCTxReceipt_1 = await web3.eth.getTransactionReceipt(LC_1.transactionHash)

      const LC_2 = await LockupContract.new(gvtyToken.address, B, oneYearFromSystemDeployment, { from: givetyAG })
      const LCTxReceipt_2 = await web3.eth.getTransactionReceipt(LC_2.transactionHash)

      const LC_3 = await LockupContract.new(gvtyToken.address, C, oneYearFromSystemDeployment, { from: multisig })
      const LCTxReceipt_3 = await web3.eth.getTransactionReceipt(LC_2.transactionHash)

      // Deploy through factory
      const LCDeploymentTx_4 = await lockupContractFactory.deployLockupContract(A, oneYearFromSystemDeployment, { from: E })
      const LCDeploymentTx_5 = await lockupContractFactory.deployLockupContract(C, twoYearsFromSystemDeployment, { from: givetyAG })
      const LCDeploymentTx_6 = await lockupContractFactory.deployLockupContract(D, twoYearsFromSystemDeployment, { from: multisig })

      // Check deployments succeeded
      assert.isTrue(LCTxReceipt_1.status)
      assert.isTrue(LCTxReceipt_2.status)
      assert.isTrue(LCTxReceipt_3.status)
      assert.isTrue(LCDeploymentTx_4.receipt.status)
      assert.isTrue(LCDeploymentTx_5.receipt.status)
      assert.isTrue(LCDeploymentTx_6.receipt.status)
    })

    it("Anyone can deploy LCs with unlockTime > one year from deployment, directly and through factory", async () => {
      const justOverOneYear = oneYearFromSystemDeployment.add(toBN('1'))
      const _17YearsFromDeployment = oneYearFromSystemDeployment.add(toBN(timeValues.SECONDS_IN_ONE_YEAR).mul(toBN('2')))
      
      // Deploy directly
      const LC_1 = await LockupContract.new(gvtyToken.address, A, twoYearsFromSystemDeployment, { from: D })
      const LCTxReceipt_1 = await web3.eth.getTransactionReceipt(LC_1.transactionHash)

      const LC_2 = await LockupContract.new(gvtyToken.address, B, justOverOneYear, { from: multisig })
      const LCTxReceipt_2 = await web3.eth.getTransactionReceipt(LC_2.transactionHash)

      const LC_3 = await LockupContract.new(gvtyToken.address, E, _17YearsFromDeployment, { from: E })
      const LCTxReceipt_3 = await web3.eth.getTransactionReceipt(LC_3.transactionHash)

      // Deploy through factory
      const LCDeploymentTx_4 = await lockupContractFactory.deployLockupContract(A, oneYearFromSystemDeployment, { from: E })
      const LCDeploymentTx_5 = await lockupContractFactory.deployLockupContract(C, twoYearsFromSystemDeployment, { from: multisig })
      const LCDeploymentTx_6 = await lockupContractFactory.deployLockupContract(D, twoYearsFromSystemDeployment, { from: teamMember_2 })

      // Check deployments succeeded
      assert.isTrue(LCTxReceipt_1.status)
      assert.isTrue(LCTxReceipt_2.status)
      assert.isTrue(LCTxReceipt_3.status)
      assert.isTrue(LCDeploymentTx_4.receipt.status)
      assert.isTrue(LCDeploymentTx_5.receipt.status)
      assert.isTrue(LCDeploymentTx_6.receipt.status)
    })

    it("No one can deploy LCs with unlockTime < one year from deployment, directly or through factory", async () => {
      const justUnderOneYear = oneYearFromSystemDeployment.sub(toBN('1'))
     
      // Attempt to deploy directly
      const directDeploymentTxPromise_1 = LockupContract.new(gvtyToken.address, A, justUnderOneYear, { from: D })
      const directDeploymentTxPromise_2 = LockupContract.new(gvtyToken.address, B, '43200', { from: multisig })
      const directDeploymentTxPromise_3 =  LockupContract.new(gvtyToken.address, E, '354534', { from: E })
  
      // Attempt to deploy through factory
      const factoryDploymentTxPromise_1 = lockupContractFactory.deployLockupContract(A, justUnderOneYear, { from: E })
      const factoryDploymentTxPromise_2 = lockupContractFactory.deployLockupContract(C, '43200', { from: multisig })
      const factoryDploymentTxPromise_3 = lockupContractFactory.deployLockupContract(D, '354534', { from: teamMember_2 })

      // Check deployments reverted
      await assertRevert(directDeploymentTxPromise_1, "LockupContract: unlock time must be at least one year after system deployment")
      await assertRevert(directDeploymentTxPromise_2, "LockupContract: unlock time must be at least one year after system deployment")
      await assertRevert(directDeploymentTxPromise_3, "LockupContract: unlock time must be at least one year after system deployment")
      await assertRevert(factoryDploymentTxPromise_1, "LockupContract: unlock time must be at least one year after system deployment")
      await assertRevert(factoryDploymentTxPromise_2, "LockupContract: unlock time must be at least one year after system deployment")
      await assertRevert(factoryDploymentTxPromise_3, "LockupContract: unlock time must be at least one year after system deployment")
    })


    describe('Withdrawal Attempts on LCs before unlockTime has passed ', async accounts => {
      it("Givety multisig can't withdraw from a funded LC they deployed for another beneficiary through the Factory before the unlockTime", async () => {

        // Check currentTime < unlockTime
        const currentTime = toBN(await th.getLatestBlockTimestamp(web3))
        const unlockTime = await LC_T1.unlockTime()
        assert.isTrue(currentTime.lt(unlockTime))

        // Givety multisig attempts withdrawal from LC they deployed through the Factory
        try {
          const withdrawalAttempt = await LC_T1.withdrawGVTY({ from: multisig })
          assert.isFalse(withdrawalAttempt.receipt.status)
        } catch (error) {
          assert.include(error.message, "LockupContract: caller is not the beneficiary")
        }
      })

      it("Givety multisig can't withdraw from a funded LC that someone else deployed before the unlockTime", async () => {
        // Account D deploys a new LC via the Factory
        const deployedLCtx_B = await lockupContractFactory.deployLockupContract(B, oneYearFromSystemDeployment, { from: D })
        const LC_B = await th.getLCFromDeploymentTx(deployedLCtx_B)

        //GVTY multisig fund the newly deployed LCs
        await gvtyToken.transfer(LC_B.address, dec(2, 18), { from: multisig })

        // Check currentTime < unlockTime
        const currentTime = toBN(await th.getLatestBlockTimestamp(web3))
        const unlockTime = await LC_B.unlockTime()
        assert.isTrue(currentTime.lt(unlockTime))

        // Givety multisig attempts withdrawal from LCs
        try {
          const withdrawalAttempt_B = await LC_B.withdrawGVTY({ from: multisig })
          assert.isFalse(withdrawalAttempt_B.receipt.status)
        } catch (error) {
          assert.include(error.message, "LockupContract: caller is not the beneficiary")
        }
      })

      it("Beneficiary can't withdraw from their funded LC before the unlockTime", async () => {
        // Account D deploys a new LC via the Factory
        const deployedLCtx_B = await lockupContractFactory.deployLockupContract(B, oneYearFromSystemDeployment, { from: D })
        const LC_B = await th.getLCFromDeploymentTx(deployedLCtx_B)

        // Givety multisig funds contracts
        await gvtyToken.transfer(LC_B.address, dec(2, 18), { from: multisig })

        // Check currentTime < unlockTime
        const currentTime = toBN(await th.getLatestBlockTimestamp(web3))
        const unlockTime = await LC_B.unlockTime()
        assert.isTrue(currentTime.lt(unlockTime))

        /* Beneficiaries of all LCS - team, investor, and newly created LCs - 
        attempt to withdraw from their respective funded contracts */
        const LCs = [
          LC_T1,
          LC_T2,
          LC_T3,
          LC_I1,
          LC_I2,
          LC_T3,
          LC_B
        ]

        for (LC of LCs) {
          try {
            const beneficiary = await LC.beneficiary()
            const withdrawalAttempt = await LC.withdrawGVTY({ from: beneficiary })
            assert.isFalse(withdrawalAttempt.receipt.status)
          } catch (error) {
            assert.include(error.message, "LockupContract: The lockup duration must have passed")
          }
        }
      })

      it("No one can withdraw from a beneficiary's funded LC before the unlockTime", async () => {
        // Account D deploys a new LC via the Factory
        const deployedLCtx_B = await lockupContractFactory.deployLockupContract(B, oneYearFromSystemDeployment, { from: D })
        const LC_B = await th.getLCFromDeploymentTx(deployedLCtx_B)

        // Givety multisig funds contract
        await gvtyToken.transfer(LC_B.address, dec(2, 18), { from: multisig })

        // Check currentTime < unlockTime
        const currentTime = toBN(await th.getLatestBlockTimestamp(web3))
        const unlockTime = await LC_B.unlockTime()
        assert.isTrue(currentTime.lt(unlockTime))

        const variousEOAs = [teamMember_2, givetyAG, multisig, investor_1, A, C, D, E]

        // Several EOAs attempt to withdraw from LC deployed by D
        for (account of variousEOAs) {
          try {
            const withdrawalAttempt = await LC_B.withdrawGVTY({ from: account })
            assert.isFalse(withdrawalAttempt.receipt.status)
          } catch (error) {
            assert.include(error.message, "LockupContract: caller is not the beneficiary")
          }
        }

        // Several EOAs attempt to withdraw from LC_T1 deployed by GVTY deployer
        for (account of variousEOAs) {
          try {
            const withdrawalAttempt = await LC_T1.withdrawGVTY({ from: account })
            assert.isFalse(withdrawalAttempt.receipt.status)
          } catch (error) {
            assert.include(error.message, "LockupContract: caller is not the beneficiary")
          }
        }
      })
    })
  })
})