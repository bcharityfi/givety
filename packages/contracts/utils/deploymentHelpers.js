const SortedTroves = artifacts.require("./SortedTroves.sol")
const TroveManager = artifacts.require("./TroveManager.sol")
const PriceFeedTestnet = artifacts.require("./PriceFeedTestnet.sol")
const GUSDToken = artifacts.require("./GUSDToken.sol")
const ActivePool = artifacts.require("./ActivePool.sol");
const DefaultPool = artifacts.require("./DefaultPool.sol");
const StabilityPool = artifacts.require("./StabilityPool.sol")
const GasPool = artifacts.require("./GasPool.sol")
const CollSurplusPool = artifacts.require("./CollSurplusPool.sol")
const FunctionCaller = artifacts.require("./TestContracts/FunctionCaller.sol")
const BorrowerOperations = artifacts.require("./BorrowerOperations.sol")
const HintHelpers = artifacts.require("./HintHelpers.sol")

const GVTYStaking = artifacts.require("./GVTYStaking.sol")
const GVTYToken = artifacts.require("./GVTYToken.sol")
const LockupContractFactory = artifacts.require("./LockupContractFactory.sol")
const CommunityIssuance = artifacts.require("./CommunityIssuance.sol")

const Givpool =  artifacts.require("./Givpool.sol")

const GVTYTokenTester = artifacts.require("./GVTYTokenTester.sol")
const CommunityIssuanceTester = artifacts.require("./CommunityIssuanceTester.sol")
const StabilityPoolTester = artifacts.require("./StabilityPoolTester.sol")
const ActivePoolTester = artifacts.require("./ActivePoolTester.sol")
const DefaultPoolTester = artifacts.require("./DefaultPoolTester.sol")
const GivetyMathTester = artifacts.require("./GivetyMathTester.sol")
const BorrowerOperationsTester = artifacts.require("./BorrowerOperationsTester.sol")
const TroveManagerTester = artifacts.require("./TroveManagerTester.sol")
const GUSDTokenTester = artifacts.require("./GUSDTokenTester.sol")

// Proxy scripts
const BorrowerOperationsScript = artifacts.require('BorrowerOperationsScript')
const BorrowerWrappersScript = artifacts.require('BorrowerWrappersScript')
const TroveManagerScript = artifacts.require('TroveManagerScript')
const StabilityPoolScript = artifacts.require('StabilityPoolScript')
const TokenScript = artifacts.require('TokenScript')
const GVTYStakingScript = artifacts.require('GVTYStakingScript')
const {
  buildUserProxies,
  BorrowerOperationsProxy,
  BorrowerWrappersProxy,
  TroveManagerProxy,
  StabilityPoolProxy,
  SortedTrovesProxy,
  TokenProxy,
  GVTYStakingProxy
} = require('../utils/proxyHelpers.js')

/* "Givety core" consists of all contracts in the core Givety system.

GVTY contracts consist of only those contracts related to the GVTY Token:

-the GVTY token
-the Lockup factory and lockup contracts
-the GVTYStaking contract
-the CommunityIssuance contract 
*/

const ZERO_ADDRESS = '0x' + '0'.repeat(40)
const maxBytes32 = '0x' + 'f'.repeat(64)

class DeploymentHelper {

  static async deployGivetyCore() {
    const cmdLineArgs = process.argv
    const frameworkPath = cmdLineArgs[1]
    // console.log(`Framework used:  ${frameworkPath}`)

    if (frameworkPath.includes("hardhat")) {
      return this.deployGivetyCoreHardhat()
    } else if (frameworkPath.includes("truffle")) {
      return this.deployGivetyCoreTruffle()
    }
  }

  static async deployGVTYContracts(bountyAddress, lpRewardsAddress, multisigAddress) {
    const cmdLineArgs = process.argv
    const frameworkPath = cmdLineArgs[1]
    // console.log(`Framework used:  ${frameworkPath}`)

    if (frameworkPath.includes("hardhat")) {
      return this.deployGVTYContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress)
    } else if (frameworkPath.includes("truffle")) {
      return this.deployGVTYContractsTruffle(bountyAddress, lpRewardsAddress, multisigAddress)
    }
  }

  static async deployGivetyCoreHardhat() {
    const priceFeedTestnet = await PriceFeedTestnet.new()
    const sortedTroves = await SortedTroves.new()
    const troveManager = await TroveManager.new()
    const activePool = await ActivePool.new()
    const stabilityPool = await StabilityPool.new()
    const gasPool = await GasPool.new()
    const defaultPool = await DefaultPool.new()
    const collSurplusPool = await CollSurplusPool.new()
    const functionCaller = await FunctionCaller.new()
    const borrowerOperations = await BorrowerOperations.new()
    const hintHelpers = await HintHelpers.new()
    const gusdToken = await GUSDToken.new(
      troveManager.address,
      stabilityPool.address,
      borrowerOperations.address
    )
    GUSDToken.setAsDeployed(gusdToken)
    DefaultPool.setAsDeployed(defaultPool)
    PriceFeedTestnet.setAsDeployed(priceFeedTestnet)
    SortedTroves.setAsDeployed(sortedTroves)
    TroveManager.setAsDeployed(troveManager)
    ActivePool.setAsDeployed(activePool)
    StabilityPool.setAsDeployed(stabilityPool)
    GasPool.setAsDeployed(gasPool)
    CollSurplusPool.setAsDeployed(collSurplusPool)
    FunctionCaller.setAsDeployed(functionCaller)
    BorrowerOperations.setAsDeployed(borrowerOperations)
    HintHelpers.setAsDeployed(hintHelpers)

    const coreContracts = {
      priceFeedTestnet,
      gusdToken,
      sortedTroves,
      troveManager,
      activePool,
      stabilityPool,
      gasPool,
      defaultPool,
      collSurplusPool,
      functionCaller,
      borrowerOperations,
      hintHelpers
    }
    return coreContracts
  }

  static async deployTesterContractsHardhat() {
    const testerContracts = {}

    // Contract without testers (yet)
    testerContracts.priceFeedTestnet = await PriceFeedTestnet.new()
    testerContracts.sortedTroves = await SortedTroves.new()
    // Actual tester contracts
    testerContracts.communityIssuance = await CommunityIssuanceTester.new()
    testerContracts.activePool = await ActivePoolTester.new()
    testerContracts.defaultPool = await DefaultPoolTester.new()
    testerContracts.stabilityPool = await StabilityPoolTester.new()
    testerContracts.gasPool = await GasPool.new()
    testerContracts.collSurplusPool = await CollSurplusPool.new()
    testerContracts.math = await GivetyMathTester.new()
    testerContracts.borrowerOperations = await BorrowerOperationsTester.new()
    testerContracts.troveManager = await TroveManagerTester.new()
    testerContracts.functionCaller = await FunctionCaller.new()
    testerContracts.hintHelpers = await HintHelpers.new()
    testerContracts.gusdToken =  await GUSDTokenTester.new(
      testerContracts.troveManager.address,
      testerContracts.stabilityPool.address,
      testerContracts.borrowerOperations.address
    )
    return testerContracts
  }

  static async deployGVTYContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress) {
    const gvtyStaking = await GVTYStaking.new()
    const lockupContractFactory = await LockupContractFactory.new()
    const communityIssuance = await CommunityIssuance.new()

    GVTYStaking.setAsDeployed(gvtyStaking)
    LockupContractFactory.setAsDeployed(lockupContractFactory)
    CommunityIssuance.setAsDeployed(communityIssuance)

    // Deploy GVTY Token, passing Community Issuance and Factory addresses to the constructor 
    const gvtyToken = await GVTYToken.new(
      communityIssuance.address, 
      gvtyStaking.address,
      lockupContractFactory.address,
      bountyAddress,
      lpRewardsAddress,
      multisigAddress
    )
    GVTYToken.setAsDeployed(gvtyToken)

    const GVTYContracts = {
      gvtyStaking,
      lockupContractFactory,
      communityIssuance,
      gvtyToken
    }
    return GVTYContracts
  }

  static async deployGVTYTesterContractsHardhat(bountyAddress, lpRewardsAddress, multisigAddress) {
    const gvtyStaking = await GVTYStaking.new()
    const lockupContractFactory = await LockupContractFactory.new()
    const communityIssuance = await CommunityIssuanceTester.new()

    GVTYStaking.setAsDeployed(gvtyStaking)
    LockupContractFactory.setAsDeployed(lockupContractFactory)
    CommunityIssuanceTester.setAsDeployed(communityIssuance)

    // Deploy GVTY Token, passing Community Issuance and Factory addresses to the constructor 
    const gvtyToken = await GVTYTokenTester.new(
      communityIssuance.address, 
      gvtyStaking.address,
      lockupContractFactory.address,
      bountyAddress,
      lpRewardsAddress,
      multisigAddress
    )
    GVTYTokenTester.setAsDeployed(gvtyToken)

    const GVTYContracts = {
      gvtyStaking,
      lockupContractFactory,
      communityIssuance,
      gvtyToken
    }
    return GVTYContracts
  }

  static async deployGivetyCoreTruffle() {
    const priceFeedTestnet = await PriceFeedTestnet.new()
    const sortedTroves = await SortedTroves.new()
    const troveManager = await TroveManager.new()
    const activePool = await ActivePool.new()
    const stabilityPool = await StabilityPool.new()
    const gasPool = await GasPool.new()
    const defaultPool = await DefaultPool.new()
    const collSurplusPool = await CollSurplusPool.new()
    const functionCaller = await FunctionCaller.new()
    const borrowerOperations = await BorrowerOperations.new()
    const hintHelpers = await HintHelpers.new()
    const gusdToken = await GUSDToken.new(
      troveManager.address,
      stabilityPool.address,
      borrowerOperations.address
    )
    const coreContracts = {
      priceFeedTestnet,
      gusdToken,
      sortedTroves,
      troveManager,
      activePool,
      stabilityPool,
      gasPool,
      defaultPool,
      collSurplusPool,
      functionCaller,
      borrowerOperations,
      hintHelpers
    }
    return coreContracts
  }

  static async deployGVTYContractsTruffle(bountyAddress, lpRewardsAddress, multisigAddress) {
    const gvtyStaking = await gvtyStaking.new()
    const lockupContractFactory = await LockupContractFactory.new()
    const communityIssuance = await CommunityIssuance.new()

    /* Deploy GVTY Token, passing Community Issuance,  GVTYStaking, and Factory addresses 
    to the constructor  */
    const gvtyToken = await GVTYToken.new(
      communityIssuance.address, 
      gvtyStaking.address,
      lockupContractFactory.address,
      bountyAddress,
      lpRewardsAddress, 
      multisigAddress
    )

    const GVTYContracts = {
      gvtyStaking,
      lockupContractFactory,
      communityIssuance,
      gvtyToken
    }
    return GVTYContracts
  }

  static async deployGUSDToken(contracts) {
    contracts.gusdToken = await GUSDToken.new(
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.borrowerOperations.address
    )
    return contracts
  }

  static async deployGUSDTokenTester(contracts) {
    contracts.gusdToken = await GUSDTokenTester.new(
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.borrowerOperations.address
    )
    return contracts
  }

  static async deployProxyScripts(contracts, GVTYContracts, owner, users) {
    const proxies = await buildUserProxies(users)

    const borrowerWrappersScript = await BorrowerWrappersScript.new(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      GVTYContracts.gvtyStaking.address
    )
    contracts.borrowerWrappers = new BorrowerWrappersProxy(owner, proxies, borrowerWrappersScript.address)

    const borrowerOperationsScript = await BorrowerOperationsScript.new(contracts.borrowerOperations.address)
    contracts.borrowerOperations = new BorrowerOperationsProxy(owner, proxies, borrowerOperationsScript.address, contracts.borrowerOperations)

    const troveManagerScript = await TroveManagerScript.new(contracts.troveManager.address)
    contracts.troveManager = new TroveManagerProxy(owner, proxies, troveManagerScript.address, contracts.troveManager)

    const stabilityPoolScript = await StabilityPoolScript.new(contracts.stabilityPool.address)
    contracts.stabilityPool = new StabilityPoolProxy(owner, proxies, stabilityPoolScript.address, contracts.stabilityPool)

    contracts.sortedTroves = new SortedTrovesProxy(owner, proxies, contracts.sortedTroves)

    const gusdTokenScript = await TokenScript.new(contracts.gusdToken.address)
    contracts.gusdToken = new TokenProxy(owner, proxies, gusdTokenScript.address, contracts.gusdToken)

    const gvtyTokenScript = await TokenScript.new(GVTYContracts.gvtyToken.address)
    GVTYContracts.gvtyToken = new TokenProxy(owner, proxies, gvtyTokenScript.address, GVTYContracts.gvtyToken)

    const gvtyStakingScript = await GVTYStakingScript.new(GVTYContracts.gvtyStaking.address)
    GVTYContracts.gvtyStaking = new GVTYStakingProxy(owner, proxies, gvtyStakingScript.address, GVTYContracts.gvtyStaking)
  }

  // Connect contracts to their dependencies
  static async connectCoreContracts(contracts, GVTYContracts) {

    // set TroveManager addr in SortedTroves
    await contracts.sortedTroves.setParams(
      maxBytes32,
      contracts.troveManager.address,
      contracts.borrowerOperations.address
    )

    // set contract addresses in the FunctionCaller 
    await contracts.functionCaller.setTroveManagerAddress(contracts.troveManager.address)
    await contracts.functionCaller.setSortedTrovesAddress(contracts.sortedTroves.address)

    // set contracts in the Trove Manager
    await contracts.troveManager.setAddresses(
      contracts.borrowerOperations.address,
      contracts.activePool.address,
      contracts.defaultPool.address,
      contracts.stabilityPool.address,
      contracts.gasPool.address,
      contracts.collSurplusPool.address,
      contracts.priceFeedTestnet.address,
      contracts.gusdToken.address,
      contracts.sortedTroves.address,
      GVTYContracts.gvtyToken.address,
      GVTYContracts.gvtyStaking.address
    )

    // set contracts in BorrowerOperations 
    await contracts.borrowerOperations.setAddresses(
      contracts.troveManager.address,
      contracts.activePool.address,
      contracts.defaultPool.address,
      contracts.stabilityPool.address,
      contracts.gasPool.address,
      contracts.collSurplusPool.address,
      contracts.priceFeedTestnet.address,
      contracts.sortedTroves.address,
      contracts.gusdToken.address,
      GVTYContracts.gvtyStaking.address
    )

    // set contracts in the Pools
    await contracts.stabilityPool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.activePool.address,
      contracts.gusdToken.address,
      contracts.sortedTroves.address,
      contracts.priceFeedTestnet.address,
      GVTYContracts.communityIssuance.address
    )

    await contracts.activePool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.stabilityPool.address,
      contracts.defaultPool.address
    )

    await contracts.defaultPool.setAddresses(
      contracts.troveManager.address,
      contracts.activePool.address,
    )

    await contracts.collSurplusPool.setAddresses(
      contracts.borrowerOperations.address,
      contracts.troveManager.address,
      contracts.activePool.address,
    )

    // set contracts in HintHelpers
    await contracts.hintHelpers.setAddresses(
      contracts.sortedTroves.address,
      contracts.troveManager.address
    )
  }

  static async connectGVTYContracts(GVTYContracts) {
    // Set GVTYToken address in LCF
    await GVTYContracts.lockupContractFactory.setGVTYTokenAddress(GVTYContracts.gvtyToken.address)
  }

  static async connectGVTYContractsToCore(GVTYContracts, coreContracts) {
    await GVTYContracts.gvtyStaking.setAddresses(
      GVTYContracts.gvtyToken.address,
      coreContracts.gusdToken.address,
      coreContracts.troveManager.address, 
      coreContracts.borrowerOperations.address,
      coreContracts.activePool.address
    )
  
    await GVTYContracts.communityIssuance.setAddresses(
      GVTYContracts.gvtyToken.address,
      coreContracts.stabilityPool.address
    )
  }

  static async connectGivpool(Givpool, GVTYContracts, giveswapPairAddr, duration) {
    await Givpool.setParams(GVTYContracts.gvtyToken.address, giveswapPairAddr, duration)
  }
}
module.exports = DeploymentHelper
