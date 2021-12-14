const { GiveSwapFactory } = require("./ABIs/GiveSwapFactory.js")
const { GiveSwapPair } = require("./ABIs/GiveSwapPair.js")
const { GiveSwapRouter } = require("./ABIs/GiveSwapRouter.js")
const { ChainlinkAggregatorV3Interface } = require("./ABIs/ChainlinkAggregatorV3Interface.js")
const { TestHelper: th, TimeValues: timeVals } = require("../utils/testHelpers.js")
const { dec } = th
const MainnetDeploymentHelper = require("../utils/mainnetDeploymentHelpers.js")
const toBigNum = ethers.BigNumber.from

async function mainnetDeploy(configParams) {
  const date = new Date()
  console.log(date.toUTCString())
  const deployerWallet = (await ethers.getSigners())[0]
  // const account2Wallet = (await ethers.getSigners())[1]
  const mdh = new MainnetDeploymentHelper(configParams, deployerWallet)
  const gasPrice = configParams.GAS_PRICE

  const deploymentState = mdh.loadPreviousDeployment()

  console.log(`deployer address: ${deployerWallet.address}`)
  assert.equal(deployerWallet.address, configParams.givetyAddrs.DEPLOYER)
  // assert.equal(account2Wallet.address, configParams.beneficiaries.ACCOUNT_2)
  let deployerETHBalance = await ethers.provider.getBalance(deployerWallet.address)
  console.log(`deployerETHBalance before: ${deployerETHBalance}`)

  // Get GiveSwapFactory instance at its deployed address
  const giveSwapFactory = new ethers.Contract(
    configParams.externalAddrs.GIVESWAP_FACTORY,
    GiveSwapFactory.abi,
    deployerWallet
  )

  console.log(`GiveSwap addr: ${giveSwapFactory.address}`)
  const givAllPairsLength = await giveSwapFactory.allPairsLength()
  console.log(`GiveSwap Factory number of pairs: ${givAllPairsLength}`)

  deployerETHBalance = await ethers.provider.getBalance(deployerWallet.address)
  console.log(`deployer's GIVE balance before deployments: ${deployerETHBalance}`)

  // Deploy core logic contracts
  const givetyCore = await mdh.deployGivetyCoreMainnet(configParams.externalAddrs.TELLOR_MASTER, deploymentState)
  await mdh.logContractObjects(givetyCore)

  // Check GiveSwap Pair GUSD-GIVE pair before pair creation
  let GUSDGIVEPairAddr = await giveSwapFactory.getPair(givetyCore.gusdToken.address, configParams.externalAddrs.GIVE_ERC20)
  let GIVEGUSDPairAddr = await giveSwapFactory.getPair(configParams.externalAddrs.GIVE_ERC20, givetyCore.gusdToken.address)
  assert.equal(GUSDGIVEPairAddr, GIVEGUSDPairAddr)


  if (GUSDGIVEPairAddr == th.ZERO_ADDRESS) {
    // Deploy Givpool for GUSD-GIVE
    await mdh.sendAndWaitForTransaction(giveSwapFactory.createPair(
      configParams.externalAddrs.GIVE_ERC20,
      givetyCore.gusdToken.address,
      { gasPrice }
    ))

    // Check GiveSwap Pair GUSD-GIVE pair after pair creation (forwards and backwards should have same address)
    GUSDGIVEPairAddr = await giveSwapFactory.getPair(givetyCore.gusdToken.address, configParams.externalAddrs.GIVE_ERC20)
    assert.notEqual(GUSDGIVEPairAddr, th.ZERO_ADDRESS)
    GIVEGUSDPairAddr = await giveSwapFactory.getPair(configParams.externalAddrs.GIVE_ERC20, givetyCore.gusdToken.address)
    console.log(`GUSD-GIVE pair contract address after GiveSwap pair creation: ${GUSDGIVEPairAddr}`)
    assert.equal(GIVEGUSDPairAddr, GUSDGIVEPairAddr)
  }

  // Deploy Givpool
  const Givpool = await mdh.deployGivpoolMainnet(deploymentState)

  // Deploy GVTY Contracts
  const GVTYContracts = await mdh.deployGVTYContractsMainnet(
    configParams.givetyAddrs.GENERAL_SAFE, // bounty address
    Givpool.address,  // lp rewards address
    configParams.givetyAddrs.GVTY_SAFE, // multisig GVTY endowment address
    deploymentState,
  )

  // Connect all core contracts up
  await mdh.connectCoreContractsMainnet(givetyCore, GVTYContracts, configParams.externalAddrs.CHAINLINK_GIVEUSD_PROXY)
  await mdh.connectGVTYContractsMainnet(GVTYContracts)
  await mdh.connectGVTYContractsToCoreMainnet(GVTYContracts, givetyCore)

  // Deploy a read-only multi-trove getter
  const multiTroveGetter = await mdh.deployMultiTroveGetterMainnet(givetyCore, deploymentState)

  // Connect Givpool to GVTYToken and the GUSD-GIVE pair address, with a 6 week duration
  const LPRewardsDuration = timeVals.SECONDS_IN_SIX_WEEKS
  await mdh.connectGivpoolMainnet(Givpool, GVTYContracts, GUSDGIVEPairAddr, LPRewardsDuration)

  // Log GVTY and Givpool addresses
  await mdh.logContractObjects(GVTYContracts)
  console.log(`Givpool address: ${Givpool.address}`)
  
  // let latestBlock = await ethers.provider.getBlockNumber()
  let deploymentStartTime = await GVTYContracts.gvtyToken.getDeploymentStartTime()

  console.log(`deployment start time: ${deploymentStartTime}`)
  const oneYearFromDeployment = (Number(deploymentStartTime) + timeVals.SECONDS_IN_ONE_YEAR).toString()
  console.log(`time oneYearFromDeployment: ${oneYearFromDeployment}`)

  // Deploy LockupContracts - one for each beneficiary
  const lockupContracts = {}

  for (const [investor, investorAddr] of Object.entries(configParams.beneficiaries)) {
    const lockupContractEthersFactory = await ethers.getContractFactory("LockupContract", deployerWallet)
    if (deploymentState[investor] && deploymentState[investor].address) {
      console.log(`Using previously deployed ${investor} lockup contract at address ${deploymentState[investor].address}`)
      lockupContracts[investor] = new ethers.Contract(
        deploymentState[investor].address,
        lockupContractEthersFactory.interface,
        deployerWallet
      )
    } else {
      const txReceipt = await mdh.sendAndWaitForTransaction(GVTYContracts.lockupContractFactory.deployLockupContract(investorAddr, oneYearFromDeployment, { gasPrice }))

      const address = await txReceipt.logs[0].address // The deployment event emitted from the LC itself is is the first of two events, so this is its address 
      lockupContracts[investor] = new ethers.Contract(
        address,
        lockupContractEthersFactory.interface,
        deployerWallet
      )

      deploymentState[investor] = {
        address: address,
        txHash: txReceipt.transactionHash
      }

      mdh.saveDeployment(deploymentState)
    }

    const gvtyTokenAddr = GVTYContracts.gvtyToken.address
    // verify
    if (configParams.ETHERSCAN_BASE_URL) {
      await mdh.verifyContract(investor, deploymentState, [gvtyTokenAddr, investorAddr, oneYearFromDeployment])
    }
  }

  // // --- TESTS AND CHECKS  ---

  // Deployer repay GUSD
  // console.log(`deployer trove debt before repaying: ${await givetyCore.troveManager.getTroveDebt(deployerWallet.address)}`)
 // await mdh.sendAndWaitForTransaction(givetyCore.borrowerOperations.repayGUSD(dec(800, 18), th.ZERO_ADDRESS, th.ZERO_ADDRESS, {gasPrice, gasLimit: 1000000}))
  // console.log(`deployer trove debt after repaying: ${await givetyCore.troveManager.getTroveDebt(deployerWallet.address)}`)
  
  // Deployer add coll
  // console.log(`deployer trove coll before adding coll: ${await givetyCore.troveManager.getTroveColl(deployerWallet.address)}`)
  // await mdh.sendAndWaitForTransaction(givetyCore.borrowerOperations.addColl(th.ZERO_ADDRESS, th.ZERO_ADDRESS, {value: dec(2, 'give'), gasPrice, gasLimit: 1000000}))
  // console.log(`deployer trove coll after addingColl: ${await givetyCore.troveManager.getTroveColl(deployerWallet.address)}`)
  
  // Check chainlink proxy price ---

  const chainlinkProxy = new ethers.Contract(
    configParams.externalAddrs.CHAINLINK_GIVEUSD_PROXY,
    ChainlinkAggregatorV3Interface,
    deployerWallet
  )

  // Get latest price
  let chainlinkPrice = await chainlinkProxy.latestAnswer()
  console.log(`current Chainlink price: ${chainlinkPrice}`)

  // Check Tellor price directly (through our TellorCaller)
  let tellorPriceResponse = await givetyCore.tellorCaller.getTellorCurrentValue(1) // id == 1: the GIVE-USD request ID
  console.log(`current Tellor price: ${tellorPriceResponse[1]}`)
  console.log(`current Tellor timestamp: ${tellorPriceResponse[2]}`)

  // // --- Lockup Contracts ---
  console.log("LOCKUP CONTRACT CHECKS")
  // Check lockup contracts exist for each beneficiary with correct unlock time
  for (investor of Object.keys(lockupContracts)) {
    const lockupContract = lockupContracts[investor]
    // check LC references correct GVTYToken 
    const storedGVTYTokenAddr = await lockupContract.gvtyToken()
    assert.equal(GVTYContracts.gvtyToken.address, storedGVTYTokenAddr)
    // Check contract has stored correct beneficary
    const onChainBeneficiary = await lockupContract.beneficiary()
    assert.equal(configParams.beneficiaries[investor].toLowerCase(), onChainBeneficiary.toLowerCase())
    // Check correct unlock time (1 yr from deployment)
    const unlockTime = await lockupContract.unlockTime()
    assert.equal(oneYearFromDeployment, unlockTime)

    console.log(
      `lockupContract addr: ${lockupContract.address},
            stored GVTYToken addr: ${storedGVTYTokenAddr}
            beneficiary: ${investor},
            beneficiary addr: ${configParams.beneficiaries[investor]},
            on-chain beneficiary addr: ${onChainBeneficiary},
            unlockTime: ${unlockTime}
            `
    )
  }

  // // --- Check correct addresses set in GVTYToken
  // console.log("STORED ADDRESSES IN GVTY TOKEN")
  // const storedMultisigAddress = await GVTYContracts.gvtyToken.multisigAddress()
  // assert.equal(configParams.givetyAddrs.GVTY_SAFE.toLowerCase(), storedMultisigAddress.toLowerCase())
  // console.log(`multi-sig address stored in GVTYToken : ${th.squeezeAddr(storedMultisigAddress)}`)
  // console.log(`GVTY Safe address: ${th.squeezeAddr(configParams.givetyAddrs.GVTY_SAFE)}`)

  // // --- GVTY allowances of different addresses ---
  // console.log("INITIAL GVTY BALANCES")
  // // Givpool
  // const givpoolGVTYBal = await GVTYContracts.gvtyToken.balanceOf(Givpool.address)
  // // assert.equal(givpoolGVTYBal.toString(), '1333333333333333333333333')
  // th.logBN('Givpool GVTY balance       ', givpoolGVTYBal)

  // // GVTY Safe
  // const gvtySafeBal = await GVTYContracts.gvtyToken.balanceOf(configParams.givetyAddrs.GVTY_SAFE)
  // assert.equal(gvtySafeBal.toString(), '64666666666666666666666667')
  // th.logBN('GVTY Safe balance     ', gvtySafeBal)

  // // Bounties/hackathons (General Safe)
  // const generalSafeBal = await GVTYContracts.gvtyToken.balanceOf(configParams.givetyAddrs.GENERAL_SAFE)
  // assert.equal(generalSafeBal.toString(), '2000000000000000000000000')
  // th.logBN('General Safe balance       ', generalSafeBal)

  // // CommunityIssuance contract
  // const communityIssuanceBal = await GVTYContracts.gvtyToken.balanceOf(GVTYContracts.communityIssuance.address)
  // // assert.equal(communityIssuanceBal.toString(), '32000000000000000000000000')
  // th.logBN('Community Issuance balance', communityIssuanceBal)

  // // --- PriceFeed ---
  // console.log("PRICEFEED CHECKS")
  // // Check Pricefeed's status and last good price
  // const lastGoodPrice = await givetyCore.priceFeed.lastGoodPrice()
  // const priceFeedInitialStatus = await givetyCore.priceFeed.status()
  // th.logBN('PriceFeed first stored price', lastGoodPrice)
  // console.log(`PriceFeed initial status: ${priceFeedInitialStatus}`)

  // // Check PriceFeed's & TellorCaller's stored addresses
  // const priceFeedCLAddress = await givetyCore.priceFeed.priceAggregator()
  // const priceFeedTellorCallerAddress = await givetyCore.priceFeed.tellorCaller()
  // assert.equal(priceFeedCLAddress, configParams.externalAddrs.CHAINLINK_GIVEUSD_PROXY)
  // assert.equal(priceFeedTellorCallerAddress, givetyCore.tellorCaller.address)

  // // Check Tellor address
  // const tellorCallerTellorMasterAddress = await givetyCore.tellorCaller.tellor()
  // assert.equal(tellorCallerTellorMasterAddress, configParams.externalAddrs.TELLOR_MASTER)

  // // --- Givpool ---

  // // Check Givpool's GUSD-GIVE GiveSwap Pair address
  // const givpoolGiveSwapPairAddr = await Givpool.givToken()
  // console.log(`Givpool's stored GUSD-GIVE GiveSwap Pair address: ${givpoolGiveSwapPairAddr}`)

  // console.log("SYSTEM GLOBAL VARS CHECKS")
  // // --- Sorted Troves ---

  // // Check max size
  // const sortedTrovesMaxSize = (await givetyCore.sortedTroves.data())[2]
  // assert.equal(sortedTrovesMaxSize, '115792089237316195423570985008687907853269984665640564039457584007913129639935')

  // // --- TroveManager ---

  // const liqReserve = await givetyCore.troveManager.GUSD_GAS_COMPENSATION()
  // const minNetDebt = await givetyCore.troveManager.MIN_NET_DEBT()

  // th.logBN('system liquidation reserve', liqReserve)
  // th.logBN('system min net debt      ', minNetDebt)

  // // --- Make first GUSD-GIVE liquidity provision ---

  // // Open trove if not yet opened
  // const troveStatus = await givetyCore.troveManager.getTroveStatus(deployerWallet.address)
  // if (troveStatus.toString() != '1') {
  //   let _3kGUSDWithdrawal = th.dec(3000, 18) // 3000 GUSD
  //   let _3ETHcoll = th.dec(3, 'give') // 3 GIVE
  //   console.log('Opening trove...')
  //   await mdh.sendAndWaitForTransaction(
  //     givetyCore.borrowerOperations.openTrove(
  //       th._100pct,
  //       _3kGUSDWithdrawal,
  //       th.ZERO_ADDRESS,
  //       th.ZERO_ADDRESS,
  //       { value: _3ETHcoll, gasPrice }
  //     )
  //   )
  // } else {
  //   console.log('Deployer already has an active trove')
  // }

  // // Check deployer now has an open trove
  // console.log(`deployer is in sorted list after making trove: ${await givetyCore.sortedTroves.contains(deployerWallet.address)}`)

  // const deployerTrove = await givetyCore.troveManager.Troves(deployerWallet.address)
  // th.logBN('deployer debt', deployerTrove[0])
  // th.logBN('deployer coll', deployerTrove[1])
  // th.logBN('deployer stake', deployerTrove[2])
  // console.log(`deployer's trove status: ${deployerTrove[3]}`)

  // // Check deployer has GUSD
  // let deployerGUSDBal = await givetyCore.gusdToken.balanceOf(deployerWallet.address)
  // th.logBN("deployer's GUSD balance", deployerGUSDBal)

  // // Check GiveSwap pool has GUSD and GIVE tokens
  const GUSDETHPair = await new ethers.Contract(
    GUSDGIVEPairAddr,
    GiveSwapPair.abi,
    deployerWallet
  )

  // const token0Addr = await GUSDETHPair.token0()
  // const token1Addr = await GUSDETHPair.token1()
  // console.log(`GUSD-GIVE Pair token 0: ${th.squeezeAddr(token0Addr)},
  //       GUSDToken contract addr: ${th.squeezeAddr(givetyCore.gusdToken.address)}`)
  // console.log(`GUSD-GIVE Pair token 1: ${th.squeezeAddr(token1Addr)},
  //       GIVE ERC20 contract addr: ${th.squeezeAddr(configParams.externalAddrs.GIVE_ERC20)}`)

  // // Check initial GUSD-GIVE pair reserves before provision
  // let reserves = await GUSDETHPair.getReserves()
  // th.logBN("GUSD-GIVE Pair's GUSD reserves before provision", reserves[0])
  // th.logBN("GUSD-GIVE Pair's GIVE reserves before provision", reserves[1])

  // // Get the GiveSwapRouter contract
  // const giveswapRouter = new ethers.Contract(
  //   configParams.externalAddrs.GIVESWAP_ROUTER,
  //   GiveSwapRouter.abi,
  //   deployerWallet
  // )

  // // --- Provide liquidity to GUSD-GIVE pair if not yet done so ---
  // let deployerLPTokenBal = await GUSDETHPair.balanceOf(deployerWallet.address)
  // if (deployerLPTokenBal.toString() == '0') {
  //   console.log('Providing liquidity to GiveSwap...')
  //   // Give router an allowance for GUSD
  //   await givetyCore.gusdToken.increaseAllowance(giveswapRouter.address, dec(10000, 18))

  //   // Check Router's spending allowance
  //   const routerGUSDAllowanceFromDeployer = await givetyCore.gusdToken.allowance(deployerWallet.address, giveswapRouter.address)
  //   th.logBN("router's spending allowance for deployer's GUSD", routerGUSDAllowanceFromDeployer)

  //   // Get amounts for liquidity provision
  //   const LP_GIVE = dec(1, 'give')

  //   // Convert 8-digit CL price to 18 and multiply by GIVE amount
  //   const GUSDAmount = toBigNum(chainlinkPrice)
  //     .mul(toBigNum(dec(1, 10)))
  //     .mul(toBigNum(LP_GIVE))
  //     .div(toBigNum(dec(1, 18)))

  //   const minGUSDAmount = GUSDAmount.sub(toBigNum(dec(100, 18)))

  //   latestBlock = await ethers.provider.getBlockNumber()
  //   now = (await ethers.provider.getBlock(latestBlock)).timestamp
  //   let tenMinsFromNow = now + (60 * 60 * 10)

  //   // Provide liquidity to GUSD-GIVE pair
  //   await mdh.sendAndWaitForTransaction(
  //     giveswapRouter.addLiquidityETH(
  //       givetyCore.gusdToken.address, // address of GUSD token
  //       GUSDAmount, // GUSD provision
  //       minGUSDAmount, // minimum GUSD provision
  //       LP_GIVE, // minimum GIVE provision
  //       deployerWallet.address, // address to send LP tokens to
  //       tenMinsFromNow, // deadline for this tx
  //       {
  //         value: dec(1, 'give'),
  //         gasPrice,
  //         gasLimit: 5000000 // For some reason, ethers can't estimate gas for this tx
  //       }
  //     )
  //   )
  // } else {
  //   console.log('Liquidity already provided to GiveSwap')
  // }
  // // Check GUSD-GIVE reserves after liquidity provision:
  // reserves = await GUSDETHPair.getReserves()
  // th.logBN("GUSD-GIVE Pair's GUSD reserves after provision", reserves[0])
  // th.logBN("GUSD-GIVE Pair's GIVE reserves after provision", reserves[1])



  // // ---  Check LP staking  ---
  // console.log("CHECK LP STAKING EARNS GVTY")

  // // Check deployer's LP tokens
  // deployerLPTokenBal = await GUSDETHPair.balanceOf(deployerWallet.address)
  // th.logBN("deployer's LP token balance", deployerLPTokenBal)

  // // Stake LP tokens in Givpool
  // console.log(`GUSDETHPair addr: ${GUSDETHPair.address}`)
  // console.log(`Pair addr stored in Givpool: ${await Givpool.givToken()}`)

  // earnedGVTY = await Givpool.earned(deployerWallet.address)
  // th.logBN("deployer's farmed GVTY before staking LP tokens", earnedGVTY)

  // const deployerGivpoolStake = await Givpool.balanceOf(deployerWallet.address)
  // if (deployerGivpoolStake.toString() == '0') {
  //   console.log('Staking to Givpool...')
  //   // Deployer approves Givpool
  //   await mdh.sendAndWaitForTransaction(
  //     GUSDETHPair.approve(Givpool.address, deployerLPTokenBal, { gasPrice })
  //   )

  //   await mdh.sendAndWaitForTransaction(Givpool.stake(1, { gasPrice }))
  // } else {
  //   console.log('Already staked in Givpool')
  // }

  // console.log("wait 90 seconds before checking earnings... ")
  // await configParams.waitFunction()

  // earnedGVTY = await Givpool.earned(deployerWallet.address)
  // th.logBN("deployer's farmed GVTY from Givpool after waiting ~1.5mins", earnedGVTY)

  // let deployerGVTYBal = await GVTYContracts.gvtyToken.balanceOf(deployerWallet.address)
  // th.logBN("deployer GVTY Balance Before SP deposit", deployerGVTYBal)



  // // --- Make SP deposit and earn GVTY ---
  // console.log("CHECK DEPLOYER MAKING DEPOSIT AND EARNING GVTY")

  // let SPDeposit = await givetyCore.stabilityPool.getCompoundedGUSDDeposit(deployerWallet.address)
  // th.logBN("deployer SP deposit before making deposit", SPDeposit)

  // // Provide to SP
  // await mdh.sendAndWaitForTransaction(givetyCore.stabilityPool.provideToSP(dec(15, 18), th.ZERO_ADDRESS, { gasPrice, gasLimit: 400000 }))

  // // Get SP deposit 
  // SPDeposit = await givetyCore.stabilityPool.getCompoundedGUSDDeposit(deployerWallet.address)
  // th.logBN("deployer SP deposit after depositing 15 GUSD", SPDeposit)

  // console.log("wait 90 seconds before withdrawing...")
  // // wait 90 seconds
  // await configParams.waitFunction()

  // // Withdraw from SP
  // // await mdh.sendAndWaitForTransaction(givetyCore.stabilityPool.withdrawFromSP(dec(1000, 18), { gasPrice, gasLimit: 400000 }))

  // // SPDeposit = await givetyCore.stabilityPool.getCompoundedGUSDDeposit(deployerWallet.address)
  // // th.logBN("deployer SP deposit after full withdrawal", SPDeposit)

  // // deployerGVTYBal = await GVTYContracts.gvtyToken.balanceOf(deployerWallet.address)
  // // th.logBN("deployer GVTY Balance after SP deposit withdrawal", deployerGVTYBal)



  // // ---  Attempt withdrawal from LC  ---
  // console.log("CHECK BENEFICIARY ATTEMPTING WITHDRAWAL FROM LC")

  // // connect Acct2 wallet to the LC they are beneficiary of
  // let account2LockupContract = await lockupContracts["ACCOUNT_2"].connect(account2Wallet)

  // // Deployer funds LC with 10 GVTY
  // // await mdh.sendAndWaitForTransaction(GVTYContracts.gvtyToken.transfer(account2LockupContract.address, dec(10, 18), { gasPrice }))

  // // account2 GVTY bal
  // let account2bal = await GVTYContracts.gvtyToken.balanceOf(account2Wallet.address)
  // th.logBN("account2 GVTY bal before withdrawal attempt", account2bal)

  // // Check LC GVTY bal 
  // let account2LockupContractBal = await GVTYContracts.gvtyToken.balanceOf(account2LockupContract.address)
  // th.logBN("account2's LC GVTY bal before withdrawal attempt", account2LockupContractBal)

  // // Acct2 attempts withdrawal from  LC
  // await mdh.sendAndWaitForTransaction(account2LockupContract.withdrawGVTY({ gasPrice, gasLimit: 1000000 }))

  // // Acct GVTY bal
  // account2bal = await GVTYContracts.gvtyToken.balanceOf(account2Wallet.address)
  // th.logBN("account2's GVTY bal after LC withdrawal attempt", account2bal)

  // // Check LC bal 
  // account2LockupContractBal = await GVTYContracts.gvtyToken.balanceOf(account2LockupContract.address)
  // th.logBN("account2's LC GVTY bal LC withdrawal attempt", account2LockupContractBal)

  // // --- Stake GVTY ---
  // console.log("CHECK DEPLOYER STAKING GVTY")

  // // Log deployer GVTY bal and stake before staking
  // deployerGVTYBal = await GVTYContracts.gvtyToken.balanceOf(deployerWallet.address)
  // th.logBN("deployer GVTY bal before staking", deployerGVTYBal)
  // let deployerGVTYStake = await GVTYContracts.gvtyStaking.stakes(deployerWallet.address)
  // th.logBN("deployer stake before staking", deployerGVTYStake)

  // // stake 13 GVTY
  // await mdh.sendAndWaitForTransaction(GVTYContracts.gvtyStaking.stake(dec(13, 18), { gasPrice, gasLimit: 1000000 }))

  // // Log deployer GVTY bal and stake after staking
  // deployerGVTYBal = await GVTYContracts.gvtyToken.balanceOf(deployerWallet.address)
  // th.logBN("deployer GVTY bal after staking", deployerGVTYBal)
  // deployerGVTYStake = await GVTYContracts.gvtyStaking.stakes(deployerWallet.address)
  // th.logBN("deployer stake after staking", deployerGVTYStake)

  // // Log deployer rev share immediately after staking
  // let deployerGUSDRevShare = await GVTYContracts.gvtyStaking.getPendingGUSDGain(deployerWallet.address)
  // th.logBN("deployer pending GUSD revenue share", deployerGUSDRevShare)



  // // --- 2nd Account opens trove ---
  // const trove2Status = await givetyCore.troveManager.getTroveStatus(account2Wallet.address)
  // if (trove2Status.toString() != '1') {
  //   console.log("Acct 2 opens a trove ...")
  //   let _2kGUSDWithdrawal = th.dec(2000, 18) // 2000 GUSD
  //   let _1pt5_GIVEcoll = th.dec(15, 17) // 1.5 GIVE
  //   const borrowerOpsEthersFactory = await ethers.getContractFactory("BorrowerOperations", account2Wallet)
  //   const borrowerOpsAcct2 = await new ethers.Contract(givetyCore.borrowerOperations.address, borrowerOpsEthersFactory.interface, account2Wallet)

  //   await mdh.sendAndWaitForTransaction(borrowerOpsAcct2.openTrove(th._100pct, _2kGUSDWithdrawal, th.ZERO_ADDRESS, th.ZERO_ADDRESS, { value: _1pt5_GIVEcoll, gasPrice, gasLimit: 1000000 }))
  // } else {
  //   console.log('Acct 2 already has an active trove')
  // }

  // const acct2Trove = await givetyCore.troveManager.Troves(account2Wallet.address)
  // th.logBN('acct2 debt', acct2Trove[0])
  // th.logBN('acct2 coll', acct2Trove[1])
  // th.logBN('acct2 stake', acct2Trove[2])
  // console.log(`acct2 trove status: ${acct2Trove[3]}`)

  // // Log deployer's pending GUSD gain - check fees went to staker (deloyer)
  // deployerGUSDRevShare = await GVTYContracts.gvtyStaking.getPendingGUSDGain(deployerWallet.address)
  // th.logBN("deployer pending GUSD revenue share from staking, after acct 2 opened trove", deployerGUSDRevShare)

  // //  --- deployer withdraws staking gains ---
  // console.log("CHECK DEPLOYER WITHDRAWING STAKING GAINS")

  // // check deployer's GUSD balance before withdrawing staking gains
  // deployerGUSDBal = await givetyCore.gusdToken.balanceOf(deployerWallet.address)
  // th.logBN('deployer GUSD bal before withdrawing staking gains', deployerGUSDBal)

  // // Deployer withdraws staking gains
  // await mdh.sendAndWaitForTransaction(GVTYContracts.gvtyStaking.unstake(0, { gasPrice, gasLimit: 1000000 }))

  // // check deployer's GUSD balance after withdrawing staking gains
  // deployerGUSDBal = await givetyCore.gusdToken.balanceOf(deployerWallet.address)
  // th.logBN('deployer GUSD bal after withdrawing staking gains', deployerGUSDBal)


  // // --- System stats  ---

  // GiveSwap GUSD-GIVE pool size
  reserves = await GUSDETHPair.getReserves()
  th.logBN("GUSD-GIVE Pair's current GUSD reserves", reserves[0])
  th.logBN("GUSD-GIVE Pair's current GIVE reserves", reserves[1])

  // Number of troves
  const numTroves = await givetyCore.troveManager.getTroveOwnersCount()
  console.log(`number of troves: ${numTroves} `)

  // Sorted list size
  const listSize = await givetyCore.sortedTroves.getSize()
  console.log(`Trove list size: ${listSize} `)

  // Total system debt and coll
  const entireSystemDebt = await givetyCore.troveManager.getEntireSystemDebt()
  const entireSystemColl = await givetyCore.troveManager.getEntireSystemColl()
  th.logBN("Entire system debt", entireSystemDebt)
  th.logBN("Entire system coll", entireSystemColl)
  
  // TCR
  const TCR = await givetyCore.troveManager.getTCR(chainlinkPrice)
  console.log(`TCR: ${TCR}`)

  // current borrowing rate
  const baseRate = await givetyCore.troveManager.baseRate()
  const currentBorrowingRate = await givetyCore.troveManager.getBorrowingRateWithDecay()
  th.logBN("Base rate", baseRate)
  th.logBN("Current borrowing rate", currentBorrowingRate)

  // total SP deposits
  const totalSPDeposits = await givetyCore.stabilityPool.getTotalGUSDDeposits()
  th.logBN("Total GUSD SP deposits", totalSPDeposits)

  // total GVTY Staked in GVTYStaking
  const totalGVTYStaked = await GVTYContracts.gvtyStaking.totalGVTYStaked()
  th.logBN("Total GVTY staked", totalGVTYStaked)

  // total LP tokens staked in Givpool
  const totalLPTokensStaked = await Givpool.totalSupply()
  th.logBN("Total LP (GUSD-GIVE) tokens staked in Givpool", totalLPTokensStaked)

  // --- State variables ---

  // TroveManager 
  console.log("TroveManager state variables:")
  const totalStakes = await givetyCore.troveManager.totalStakes()
  const totalStakesSnapshot = await givetyCore.troveManager.totalStakesSnapshot()
  const totalCollateralSnapshot = await givetyCore.troveManager.totalCollateralSnapshot()
  th.logBN("Total trove stakes", totalStakes)
  th.logBN("Snapshot of total trove stakes before last liq. ", totalStakesSnapshot)
  th.logBN("Snapshot of total trove collateral before last liq. ", totalCollateralSnapshot)

  const L_GIVE = await givetyCore.troveManager.L_GIVE()
  const L_GUSDDebt = await givetyCore.troveManager.L_GUSDDebt()
  th.logBN("L_GIVE", L_GIVE)
  th.logBN("L_GUSDDebt", L_GUSDDebt)

  // StabilityPool
  console.log("StabilityPool state variables:")
  const P = await givetyCore.stabilityPool.P()
  const currentScale = await givetyCore.stabilityPool.currentScale()
  const currentEpoch = await givetyCore.stabilityPool.currentEpoch()
  const S = await givetyCore.stabilityPool.epochToScaleToSum(currentEpoch, currentScale)
  const G = await givetyCore.stabilityPool.epochToScaleToG(currentEpoch, currentScale)
  th.logBN("Product P", P)
  th.logBN("Current epoch", currentEpoch)
  th.logBN("Current scale", currentScale)
  th.logBN("Sum S, at current epoch and scale", S)
  th.logBN("Sum G, at current epoch and scale", G)

  // GVTYStaking
  console.log("GVTYStaking state variables:")
  const F_GUSD = await GVTYContracts.gvtyStaking.F_GUSD()
  const F_GIVE = await GVTYContracts.gvtyStaking.F_GIVE()
  th.logBN("F_GUSD", F_GUSD)
  th.logBN("F_GIVE", F_GIVE)


  // CommunityIssuance
  console.log("CommunityIssuance state variables:")
  const totalGVTYIssued = await GVTYContracts.communityIssuance.totalGVTYIssued()
  th.logBN("Total GVTY issued to depositors / front ends", totalGVTYIssued)


  // TODO: GiveSwap *GVTY-GIVE* pool size (check it's deployed?)















  // ************************
  // --- NOT FOR APRIL 5: Deploy a GVTYToken2 with General Safe as beneficiary to test minting GVTY showing up in Gnosis App  ---

  // // General Safe GVTY bal before:
  // const realGeneralSafeAddr = "0xF06016D822943C42e3Cb7FC3a6A3B1889C1045f8"

  //   const GVTYToken2EthersFactory = await ethers.getContractFactory("GVTYToken2", deployerWallet)
  //   const gvtyToken2 = await GVTYToken2EthersFactory.deploy( 
  //     "0xF41E0DD45d411102ed74c047BdA544396cB71E27",  // CI param: LC1 
  //     "0x9694a04263593AC6b895Fc01Df5929E1FC7495fA", // GVTY Staking param: LC2
  //     "0x98f95E112da23c7b753D8AE39515A585be6Fb5Ef", // LCF param: LC3
  //     realGeneralSafeAddr,  // bounty/hackathon param: REAL general safe addr
  //     "0x98f95E112da23c7b753D8AE39515A585be6Fb5Ef", // LP rewards param: LC3
  //     deployerWallet.address, // multisig param: deployer wallet
  //     {gasPrice, gasLimit: 10000000}
  //   )

  //   console.log(`gvty2 address: ${gvtyToken2.address}`)

  //   let generalSafeGVTYBal = await gvtyToken2.balanceOf(realGeneralSafeAddr)
  //   console.log(`generalSafeGVTYBal: ${generalSafeGVTYBal}`)



  // ************************
  // --- NOT FOR APRIL 5: Test short-term lockup contract GVTY withdrawal on mainnet ---

  // now = (await ethers.provider.getBlock(latestBlock)).timestamp

  // const LCShortTermEthersFactory = await ethers.getContractFactory("LockupContractShortTerm", deployerWallet)

  // new deployment
  // const LCshortTerm = await LCShortTermEthersFactory.deploy(
  //   GVTYContracts.gvtyToken.address,
  //   deployerWallet.address,
  //   now, 
  //   {gasPrice, gasLimit: 1000000}
  // )

  // LCshortTerm.deployTransaction.wait()

  // existing deployment
  // const deployedShortTermLC = await new ethers.Contract(
  //   "0xbA8c3C09e9f55dA98c5cF0C28d15Acb927792dC7", 
  //   LCShortTermEthersFactory.interface,
  //   deployerWallet
  // )

  // new deployment
  // console.log(`Short term LC Address:  ${LCshortTerm.address}`)
  // console.log(`recorded beneficiary in short term LC:  ${await LCshortTerm.beneficiary()}`)
  // console.log(`recorded short term LC name:  ${await LCshortTerm.NAME()}`)

  // existing deployment
  //   console.log(`Short term LC Address:  ${deployedShortTermLC.address}`)
  //   console.log(`recorded beneficiary in short term LC:  ${await deployedShortTermLC.beneficiary()}`)
  //   console.log(`recorded short term LC name:  ${await deployedShortTermLC.NAME()}`)
  //   console.log(`recorded short term LC name:  ${await deployedShortTermLC.unlockTime()}`)
  //   now = (await ethers.provider.getBlock(latestBlock)).timestamp
  //   console.log(`time now: ${now}`)

  //   // check deployer GVTY bal
  //   let deployerGVTYBal = await GVTYContracts.gvtyToken.balanceOf(deployerWallet.address)
  //   console.log(`deployerGVTYBal before he withdraws: ${deployerGVTYBal}`)

  //   // check LC GVTY bal
  //   let LC_GVTYBal = await GVTYContracts.gvtyToken.balanceOf(deployedShortTermLC.address)
  //   console.log(`LC GVTY bal before withdrawal: ${LC_GVTYBal}`)

  // // withdraw from LC
  // const withdrawFromShortTermTx = await deployedShortTermLC.withdrawGVTY( {gasPrice, gasLimit: 1000000})
  // withdrawFromShortTermTx.wait()

  // // check deployer bal after LC withdrawal
  // deployerGVTYBal = await GVTYContracts.gvtyToken.balanceOf(deployerWallet.address)
  // console.log(`deployerGVTYBal after he withdraws: ${deployerGVTYBal}`)

  //   // check LC GVTY bal
  //   LC_GVTYBal = await GVTYContracts.gvtyToken.balanceOf(deployedShortTermLC.address)
  //   console.log(`LC GVTY bal after withdrawal: ${LC_GVTYBal}`)
}

module.exports = {
  mainnetDeploy
}
