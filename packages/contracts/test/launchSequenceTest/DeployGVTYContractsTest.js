const deploymentHelper = require("../../utils/deploymentHelpers.js")
const testHelpers = require("../../utils/testHelpers.js")
const CommunityIssuance = artifacts.require("./CommunityIssuance.sol")


const th = testHelpers.TestHelper
const timeValues = testHelpers.TimeValues
const assertRevert = th.assertRevert
const toBN = th.toBN
const dec = th.dec

contract('Deploying the GVTY contracts: LCF, CI, GVTYStaking, and GVTYToken ', async accounts => {
  const [givetyAG, A, B] = accounts;
  const [bountyAddress, lpRewardsAddress, multisig] = accounts.slice(997, 1000)

  let GVTYContracts

  const oneMillion = toBN(1000000)
  const digits = toBN(1e18)
  const thirtyTwo = toBN(32)
  const expectedCISupplyCap = thirtyTwo.mul(oneMillion).mul(digits)

  beforeEach(async () => {
    // Deploy all contracts from the first account
    GVTYContracts = await deploymentHelper.deployGVTYContracts(bountyAddress, lpRewardsAddress, multisig)
    await deploymentHelper.connectGVTYContracts(GVTYContracts)

    gvtyStaking = GVTYContracts.gvtyStaking
    gvtyToken = GVTYContracts.gvtyToken
    communityIssuance = GVTYContracts.communityIssuance
    lockupContractFactory = GVTYContracts.lockupContractFactory

    //GVTY Staking and CommunityIssuance have not yet had their setters called, so are not yet
    // connected to the rest of the system
  })


  describe('CommunityIssuance deployment', async accounts => {
    it("Stores the deployer's address", async () => {
      const storedDeployerAddress = await communityIssuance.owner()

      assert.equal(givetyAG, storedDeployerAddress)
    })
  })

  describe('GVTYStaking deployment', async accounts => {
    it("Stores the deployer's address", async () => {
      const storedDeployerAddress = await gvtyStaking.owner()

      assert.equal(givetyAG, storedDeployerAddress)
    })
  })

  describe('GVTYToken deployment', async accounts => {
    it("Stores the multisig's address", async () => {
      const storedMultisigAddress = await gvtyToken.multisigAddress()

      assert.equal(multisig, storedMultisigAddress)
    })

    it("Stores the CommunityIssuance address", async () => {
      const storedCIAddress = await gvtyToken.communityIssuanceAddress()

      assert.equal(communityIssuance.address, storedCIAddress)
    })

    it("Stores the LockupContractFactory address", async () => {
      const storedLCFAddress = await gvtyToken.lockupContractFactory()

      assert.equal(lockupContractFactory.address, storedLCFAddress)
    })

    it("Mints the correct GVTY amount to the multisig's address: (0 million)", async () => {
      const multisigGVTYEntitlement = await gvtyToken.balanceOf(multisig)
     
      const expectedMultisigEntitlement = "6".concat("0".repeat(24))
      assert.equal(multisigGVTYEntitlement, expectedMultisigEntitlement)
    })

    it("Mints the correct GVTY amount to the CommunityIssuance contract address: 9 million", async () => {
      const communityGVTYEntitlement = await gvtyToken.balanceOf(communityIssuance.address)
      // 9 million as 18-digit decimal
      const _9Million = dec(9, 24)

      assert.equal(communityGVTYEntitlement, _9Million)
    })

    it("Mints the correct GVTY amount to the bountyAddress EOA: 1 million", async () => {
      const bountyAddressBal = await gvtyToken.balanceOf(bountyAddress)
      // 3 million as 18-digit decimal
      const _3Million = dec(3, 24)

      assert.equal(bountyAddressBal, _3Million)
    })

    it("Mints the correct GVTY amount to the lpRewardsAddress EOA: 3 million", async () => {
      const lpRewardsAddressBal = await gvtyToken.balanceOf(lpRewardsAddress)
      // 3 million as 18-digit decimal
      const _3Million = "3".concat("0".repeat(24))

      assert.equal(lpRewardsAddressBal, _3Million)
    })
  })

  describe('Community Issuance deployment', async accounts => {
    it("Stores the deployer's address", async () => {

      const storedDeployerAddress = await communityIssuance.owner()

      assert.equal(storedDeployerAddress, givetyAG)
    })

    it("Has a supply cap of 9 million", async () => {
      const supplyCap = await communityIssuance.GVTYSupplyCap()

      assert.isTrue(expectedCISupplyCap.eq(supplyCap))
    })

    it("Givety  can set addresses if CI's GVTY balance is equal or greater than 32 million ", async () => {
      const GVTYBalance = await gvtyToken.balanceOf(communityIssuance.address)
      assert.isTrue(GVTYBalance.eq(expectedCISupplyCap))

      // Deploy core contracts, just to get the Stability Pool address
      const coreContracts = await deploymentHelper.deployGivetyCore()

      const tx = await communityIssuance.setAddresses(
        gvtyToken.address,
        coreContracts.stabilityPool.address,
        { from: givetyAG }
      );
      assert.isTrue(tx.receipt.status)
    })

    it("Givety  can't set addresses if CI's GVTY balance is < 9 million ", async () => {
      const newCI = await CommunityIssuance.new()

      const GVTYBalance = await gvtyToken.balanceOf(newCI.address)
      assert.equal(GVTYBalance, '0')

      // Deploy core contracts, just to get the Stability Pool address
      const coreContracts = await deploymentHelper.deployGivetyCore()

      await th.fastForwardTime(timeValues.SECONDS_IN_ONE_YEAR, web3.currentProvider)
      await gvtyToken.transfer(newCI.address, '8999999999999999999999999', {from: multisig}) // 1e-18 less than CI expects (32 million)

      try {
        const tx = await newCI.setAddresses(
          gvtyToken.address,
          coreContracts.stabilityPool.address,
          { from: givetyAG }
        );
      
        // Check it gives the expected error message for a failed Solidity 'assert'
      } catch (err) {
        assert.include(err.message, "invalid opcode")
      }
    })
  })

  describe('Connecting GVTYToken to LCF, CI and GVTYStaking', async accounts => {
    it('sets the correct GVTYToken address in GVTYStaking', async () => {
      // Deploy core contracts and set the GVTYToken address in the CI and GVTYStaking
      const coreContracts = await deploymentHelper.deployGivetyCore()
      await deploymentHelper.connectGVTYContractsToCore(GVTYContracts, coreContracts)

      const gvtyTokenAddress = gvtyToken.address

      const recordedGVTYTokenAddress = await gvtyStaking.gvtyToken()
      assert.equal(gvtyTokenAddress, recordedGVTYTokenAddress)
    })

    it('sets the correct GVTYToken address in LockupContractFactory', async () => {
      const gvtyTokenAddress = gvtyToken.address

      const recordedGVTYTokenAddress = await lockupContractFactory.gvtyTokenAddress()
      assert.equal(gvtyTokenAddress, recordedGVTYTokenAddress)
    })

    it('sets the correct GVTYToken address in CommunityIssuance', async () => {
      // Deploy core contracts and set the GVTYToken address in the CI and GVTYStaking
      const coreContracts = await deploymentHelper.deployGivetyCore()
      await deploymentHelper.connectGVTYContractsToCore(GVTYContracts, coreContracts)

      const gvtyTokenAddress = gvtyToken.address

      const recordedGVTYTokenAddress = await communityIssuance.gvtyToken()
      assert.equal(gvtyTokenAddress, recordedGVTYTokenAddress)
    })
  })
})
