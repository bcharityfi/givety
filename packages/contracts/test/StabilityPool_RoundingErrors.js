
const deploymentHelpers = require("../utils/truffleDeploymentHelpers.js")
const testHelpers = require("../utils/testHelpers.js")

const deployGivety = deploymentHelpers.deployGivety
const getAddresses = deploymentHelpers.getAddresses
const connectContracts = deploymentHelpers.connectContracts

const th  = testHelpers.TestHelper
const dec = th.dec

contract('Pool Manager: Sum-Product rounding errors', async accounts => {

  const whale = accounts[0]

  let contracts

  let priceFeed
  let gusdToken
  let stabilityPool
  let troveManager
  let borrowerOperations

  beforeEach(async () => {
    contracts = await deployGivety()
    
    priceFeed = contracts.priceFeedTestnet
    gusdToken = contracts.gusdToken
    stabilityPool = contracts.stabilityPool
    troveManager = contracts.troveManager
    borrowerOperations = contracts.borrowerOperations

    const contractAddresses = getAddresses(contracts)
    await connectContracts(contracts, contractAddresses)
  })

  // skipped to not slow down CI
  it.skip("Rounding errors: 100 deposits of 100GUSD into SP, then 200 liquidations of 49GUSD", async () => {
    const owner = accounts[0]
    const depositors = accounts.slice(1, 101)
    const defaulters = accounts.slice(101, 301)

    for (let account of depositors) {
      await openTrove({ extraGUSDAmount: toBN(dec(10000, 18)), ICR: toBN(dec(2, 18)), extraParams: { from: account } })
      await stabilityPool.provideToSP(dec(100, 18), { from: account })
    }

    // Defaulter opens trove with 200% ICR
    for (let defaulter of defaulters) {
      await openTrove({ ICR: toBN(dec(2, 18)), extraParams: { from: defaulter } })
      }
    const price = await priceFeed.getPrice()

    // price drops by 50%: defaulter ICR falls to 100%
    await priceFeed.setPrice(dec(105, 18));

    // Defaulters liquidated
    for (let defaulter of defaulters) {
      await troveManager.liquidate(defaulter, { from: owner });
    }

    const SP_TotalDeposits = await stabilityPool.getTotalGUSDDeposits()
    const SP_GIVE = await stabilityPool.getGIVE()
    const compoundedDeposit = await stabilityPool.getCompoundedGUSDDeposit(depositors[0])
    const GIVE_Gain = await stabilityPool.getCurrentGIVEGain(depositors[0])

    // Check depostiors receive their share without too much error
    assert.isAtMost(th.getDifference(SP_TotalDeposits.div(th.toBN(depositors.length)), compoundedDeposit), 100000)
    assert.isAtMost(th.getDifference(SP_GIVE.div(th.toBN(depositors.length)), GIVE_Gain), 100000)
  })
})

contract('Reset chain state', async accounts => { })
