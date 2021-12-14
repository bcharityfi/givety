const deploymentHelper = require("../utils/deploymentHelpers.js")

contract('Deployment script - Sets correct contract addresses dependencies after deployment', async accounts => {
  const [owner] = accounts;

  const [bountyAddress, lpRewardsAddress, multisig] = accounts.slice(997, 1000)
  
  let priceFeed
  let gusdToken
  let sortedTroves
  let troveManager
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
    const coreContracts = await deploymentHelper.deployGivetyCore()
    const GVTYContracts = await deploymentHelper.deployGVTYContracts(bountyAddress, lpRewardsAddress, multisig)

    priceFeed = coreContracts.priceFeedTestnet
    gusdToken = coreContracts.gusdToken
    sortedTroves = coreContracts.sortedTroves
    troveManager = coreContracts.troveManager
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
  })

  it('Sets the correct PriceFeed address in TroveManager', async () => {
    const priceFeedAddress = priceFeed.address

    const recordedPriceFeedAddress = await troveManager.priceFeed()

    assert.equal(priceFeedAddress, recordedPriceFeedAddress)
  })

  it('Sets the correct GUSDToken address in TroveManager', async () => {
    const gusdTokenAddress = gusdToken.address

    const recordedClvTokenAddress = await troveManager.gusdToken()

    assert.equal(gusdTokenAddress, recordedClvTokenAddress)
  })

  it('Sets the correct SortedTroves address in TroveManager', async () => {
    const sortedTrovesAddress = sortedTroves.address

    const recordedSortedTrovesAddress = await troveManager.sortedTroves()

    assert.equal(sortedTrovesAddress, recordedSortedTrovesAddress)
  })

  it('Sets the correct BorrowerOperations address in TroveManager', async () => {
    const borrowerOperationsAddress = borrowerOperations.address

    const recordedBorrowerOperationsAddress = await troveManager.borrowerOperationsAddress()

    assert.equal(borrowerOperationsAddress, recordedBorrowerOperationsAddress)
  })

  // ActivePool in TroveM
  it('Sets the correct ActivePool address in TroveManager', async () => {
    const activePoolAddress = activePool.address

    const recordedActivePoolAddresss = await troveManager.activePool()

    assert.equal(activePoolAddress, recordedActivePoolAddresss)
  })

  // DefaultPool in TroveM
  it('Sets the correct DefaultPool address in TroveManager', async () => {
    const defaultPoolAddress = defaultPool.address

    const recordedDefaultPoolAddresss = await troveManager.defaultPool()

    assert.equal(defaultPoolAddress, recordedDefaultPoolAddresss)
  })

  // StabilityPool in TroveM
  it('Sets the correct StabilityPool address in TroveManager', async () => {
    const stabilityPoolAddress = stabilityPool.address

    const recordedStabilityPoolAddresss = await troveManager.stabilityPool()

    assert.equal(stabilityPoolAddress, recordedStabilityPoolAddresss)
  })

  // GVTY Staking in TroveM
  it('Sets the correct GVTYStaking address in TroveManager', async () => {
    const gvtyStakingAddress = gvtyStaking.address

    const recordedGVTYStakingAddress = await troveManager.gvtyStaking()
    assert.equal(gvtyStakingAddress, recordedGVTYStakingAddress)
  })

  // Active Pool

  it('Sets the correct StabilityPool address in ActivePool', async () => {
    const stabilityPoolAddress = stabilityPool.address

    const recordedStabilityPoolAddress = await activePool.stabilityPoolAddress()

    assert.equal(stabilityPoolAddress, recordedStabilityPoolAddress)
  })

  it('Sets the correct DefaultPool address in ActivePool', async () => {
    const defaultPoolAddress = defaultPool.address

    const recordedDefaultPoolAddress = await activePool.defaultPoolAddress()

    assert.equal(defaultPoolAddress, recordedDefaultPoolAddress)
  })

  it('Sets the correct BorrowerOperations address in ActivePool', async () => {
    const borrowerOperationsAddress = borrowerOperations.address

    const recordedBorrowerOperationsAddress = await activePool.borrowerOperationsAddress()

    assert.equal(borrowerOperationsAddress, recordedBorrowerOperationsAddress)
  })

  it('Sets the correct TroveManager address in ActivePool', async () => {
    const troveManagerAddress = troveManager.address

    const recordedTroveManagerAddress = await activePool.troveManagerAddress()
    assert.equal(troveManagerAddress, recordedTroveManagerAddress)
  })

  // Stability Pool

  it('Sets the correct ActivePool address in StabilityPool', async () => {
    const activePoolAddress = activePool.address

    const recordedActivePoolAddress = await stabilityPool.activePool()
    assert.equal(activePoolAddress, recordedActivePoolAddress)
  })

  it('Sets the correct BorrowerOperations address in StabilityPool', async () => {
    const borrowerOperationsAddress = borrowerOperations.address

    const recordedBorrowerOperationsAddress = await stabilityPool.borrowerOperations()

    assert.equal(borrowerOperationsAddress, recordedBorrowerOperationsAddress)
  })

  it('Sets the correct GUSDToken address in StabilityPool', async () => {
    const gusdTokenAddress = gusdToken.address

    const recordedClvTokenAddress = await stabilityPool.gusdToken()

    assert.equal(gusdTokenAddress, recordedClvTokenAddress)
  })

  it('Sets the correct TroveManager address in StabilityPool', async () => {
    const troveManagerAddress = troveManager.address

    const recordedTroveManagerAddress = await stabilityPool.troveManager()
    assert.equal(troveManagerAddress, recordedTroveManagerAddress)
  })

  // Default Pool

  it('Sets the correct TroveManager address in DefaultPool', async () => {
    const troveManagerAddress = troveManager.address

    const recordedTroveManagerAddress = await defaultPool.troveManagerAddress()
    assert.equal(troveManagerAddress, recordedTroveManagerAddress)
  })

  it('Sets the correct ActivePool address in DefaultPool', async () => {
    const activePoolAddress = activePool.address

    const recordedActivePoolAddress = await defaultPool.activePoolAddress()
    assert.equal(activePoolAddress, recordedActivePoolAddress)
  })

  it('Sets the correct TroveManager address in SortedTroves', async () => {
    const borrowerOperationsAddress = borrowerOperations.address

    const recordedBorrowerOperationsAddress = await sortedTroves.borrowerOperationsAddress()
    assert.equal(borrowerOperationsAddress, recordedBorrowerOperationsAddress)
  })

  it('Sets the correct BorrowerOperations address in SortedTroves', async () => {
    const troveManagerAddress = troveManager.address

    const recordedTroveManagerAddress = await sortedTroves.troveManager()
    assert.equal(troveManagerAddress, recordedTroveManagerAddress)
  })

  //--- BorrowerOperations ---

  // TroveManager in BO
  it('Sets the correct TroveManager address in BorrowerOperations', async () => {
    const troveManagerAddress = troveManager.address

    const recordedTroveManagerAddress = await borrowerOperations.troveManager()
    assert.equal(troveManagerAddress, recordedTroveManagerAddress)
  })

  // setPriceFeed in BO
  it('Sets the correct PriceFeed address in BorrowerOperations', async () => {
    const priceFeedAddress = priceFeed.address

    const recordedPriceFeedAddress = await borrowerOperations.priceFeed()
    assert.equal(priceFeedAddress, recordedPriceFeedAddress)
  })

  // setSortedTroves in BO
  it('Sets the correct SortedTroves address in BorrowerOperations', async () => {
    const sortedTrovesAddress = sortedTroves.address

    const recordedSortedTrovesAddress = await borrowerOperations.sortedTroves()
    assert.equal(sortedTrovesAddress, recordedSortedTrovesAddress)
  })

  // setActivePool in BO
  it('Sets the correct ActivePool address in BorrowerOperations', async () => {
    const activePoolAddress = activePool.address

    const recordedActivePoolAddress = await borrowerOperations.activePool()
    assert.equal(activePoolAddress, recordedActivePoolAddress)
  })

  // setDefaultPool in BO
  it('Sets the correct DefaultPool address in BorrowerOperations', async () => {
    const defaultPoolAddress = defaultPool.address

    const recordedDefaultPoolAddress = await borrowerOperations.defaultPool()
    assert.equal(defaultPoolAddress, recordedDefaultPoolAddress)
  })

  // GVTY Staking in BO
  it('Sets the correct GVTYStaking address in BorrowerOperations', async () => {
    const gvtyStakingAddress = gvtyStaking.address

    const recordedGVTYStakingAddress = await borrowerOperations.gvtyStakingAddress()
    assert.equal(gvtyStakingAddress, recordedGVTYStakingAddress)
  })


  // --- GVTY Staking ---

  // Sets GVTYToken in GVTYStaking
  it('Sets the correct GVTYToken address in GVTYStaking', async () => {
    const gvtyTokenAddress = gvtyToken.address

    const recordedGVTYTokenAddress = await gvtyStaking.gvtyToken()
    assert.equal(gvtyTokenAddress, recordedGVTYTokenAddress)
  })

  // Sets ActivePool in GVTYStaking
  it('Sets the correct ActivePool address in GVTYStaking', async () => {
    const activePoolAddress = activePool.address

    const recordedActivePoolAddress = await gvtyStaking.activePoolAddress()
    assert.equal(activePoolAddress, recordedActivePoolAddress)
  })

  // Sets GUSDToken in GVTYStaking
  it('Sets the correct ActivePool address in GVTYStaking', async () => {
    const gusdTokenAddress = gusdToken.address

    const recordedGUSDTokenAddress = await gvtyStaking.gusdToken()
    assert.equal(gusdTokenAddress, recordedGUSDTokenAddress)
  })

  // Sets TroveManager in GVTYStaking
  it('Sets the correct ActivePool address in GVTYStaking', async () => {
    const troveManagerAddress = troveManager.address

    const recordedTroveManagerAddress = await gvtyStaking.troveManagerAddress()
    assert.equal(troveManagerAddress, recordedTroveManagerAddress)
  })

  // Sets BorrowerOperations in GVTYStaking
  it('Sets the correct BorrowerOperations address in GVTYStaking', async () => {
    const borrowerOperationsAddress = borrowerOperations.address

    const recordedBorrowerOperationsAddress = await gvtyStaking.borrowerOperationsAddress()
    assert.equal(borrowerOperationsAddress, recordedBorrowerOperationsAddress)
  })

  // ---  GVTYToken ---

  // Sets CI in GVTYToken
  it('Sets the correct CommunityIssuance address in GVTYToken', async () => {
    const communityIssuanceAddress = communityIssuance.address

    const recordedcommunityIssuanceAddress = await gvtyToken.communityIssuanceAddress()
    assert.equal(communityIssuanceAddress, recordedcommunityIssuanceAddress)
  })

  // Sets GVTYStaking in GVTYToken
  it('Sets the correct GVTYStaking address in GVTYToken', async () => {
    const gvtyStakingAddress = gvtyStaking.address

    const recordedGVTYStakingAddress =  await gvtyToken.gvtyStakingAddress()
    assert.equal(gvtyStakingAddress, recordedGVTYStakingAddress)
  })

  // Sets LCF in GVTYToken
  it('Sets the correct LockupContractFactory address in GVTYToken', async () => {
    const LCFAddress = lockupContractFactory.address

    const recordedLCFAddress =  await gvtyToken.lockupContractFactory()
    assert.equal(LCFAddress, recordedLCFAddress)
  })

  // --- LCF  ---

  // Sets GVTYToken in LockupContractFactory
  it('Sets the correct GVTYToken address in LockupContractFactory', async () => {
    const gvtyTokenAddress = gvtyToken.address

    const recordedGVTYTokenAddress = await lockupContractFactory.gvtyTokenAddress()
    assert.equal(gvtyTokenAddress, recordedGVTYTokenAddress)
  })

  // --- CI ---

  // Sets GVTYToken in CommunityIssuance
  it('Sets the correct GVTYToken address in CommunityIssuance', async () => {
    const gvtyTokenAddress = gvtyToken.address

    const recordedGVTYTokenAddress = await communityIssuance.gvtyToken()
    assert.equal(gvtyTokenAddress, recordedGVTYTokenAddress)
  })

  it('Sets the correct StabilityPool address in CommunityIssuance', async () => {
    const stabilityPoolAddress = stabilityPool.address

    const recordedStabilityPoolAddress = await communityIssuance.stabilityPoolAddress()
    assert.equal(stabilityPoolAddress, recordedStabilityPoolAddress)
  })
})
