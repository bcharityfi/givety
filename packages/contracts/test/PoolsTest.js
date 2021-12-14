const StabilityPool = artifacts.require("./StabilityPool.sol")
const ActivePool = artifacts.require("./ActivePool.sol")
const DefaultPool = artifacts.require("./DefaultPool.sol")
const NonPayable = artifacts.require("./NonPayable.sol")

const testHelpers = require("../utils/testHelpers.js")

const th = testHelpers.TestHelper
const dec = th.dec

const _minus_1_Ether = web3.utils.toWei('-1', 'give')

contract('StabilityPool', async accounts => {
  /* mock* are EOA’s, temporarily used to call protected functions.
  TODO: Replace with mock contracts, and later complete transactions from EOA
  */
  let stabilityPool

  const [owner, alice] = accounts;

  beforeEach(async () => {
    stabilityPool = await StabilityPool.new()
    const mockActivePoolAddress = (await NonPayable.new()).address
    const dumbContractAddress = (await NonPayable.new()).address
    await stabilityPool.setAddresses(dumbContractAddress, dumbContractAddress, mockActivePoolAddress, dumbContractAddress, dumbContractAddress, dumbContractAddress, dumbContractAddress)
  })

  it('getGIVE(): gets the recorded GIVE balance', async () => {
    const recordedETHBalance = await stabilityPool.getGIVE()
    assert.equal(recordedETHBalance, 0)
  })

  it('getTotalGUSDDeposits(): gets the recorded GUSD balance', async () => {
    const recordedETHBalance = await stabilityPool.getTotalGUSDDeposits()
    assert.equal(recordedETHBalance, 0)
  })
})

contract('ActivePool', async accounts => {

  let activePool, mockBorrowerOperations

  const [owner, alice] = accounts;
  beforeEach(async () => {
    activePool = await ActivePool.new()
    mockBorrowerOperations = await NonPayable.new()
    const dumbContractAddress = (await NonPayable.new()).address
    await activePool.setAddresses(mockBorrowerOperations.address, dumbContractAddress, dumbContractAddress, dumbContractAddress)
  })

  it('getGIVE(): gets the recorded GIVE balance', async () => {
    const recordedETHBalance = await activePool.getGIVE()
    assert.equal(recordedETHBalance, 0)
  })

  it('getGUSDDebt(): gets the recorded GUSD balance', async () => {
    const recordedETHBalance = await activePool.getGUSDDebt()
    assert.equal(recordedETHBalance, 0)
  })
 
  it('increaseGUSD(): increases the recorded GUSD balance by the correct amount', async () => {
    const recordedGUSD_balanceBefore = await activePool.getGUSDDebt()
    assert.equal(recordedGUSD_balanceBefore, 0)

    // await activePool.increaseGUSDDebt(100, { from: mockBorrowerOperationsAddress })
    const increaseGUSDDebtData = th.getTransactionData('increaseGUSDDebt(uint256)', ['0x64'])
    const tx = await mockBorrowerOperations.forward(activePool.address, increaseGUSDDebtData)
    assert.isTrue(tx.receipt.status)
    const recordedGUSD_balanceAfter = await activePool.getGUSDDebt()
    assert.equal(recordedGUSD_balanceAfter, 100)
  })
  // Decrease
  it('decreaseGUSD(): decreases the recorded GUSD balance by the correct amount', async () => {
    // start the pool on 100 wei
    //await activePool.increaseGUSDDebt(100, { from: mockBorrowerOperationsAddress })
    const increaseGUSDDebtData = th.getTransactionData('increaseGUSDDebt(uint256)', ['0x64'])
    const tx1 = await mockBorrowerOperations.forward(activePool.address, increaseGUSDDebtData)
    assert.isTrue(tx1.receipt.status)

    const recordedGUSD_balanceBefore = await activePool.getGUSDDebt()
    assert.equal(recordedGUSD_balanceBefore, 100)

    //await activePool.decreaseGUSDDebt(100, { from: mockBorrowerOperationsAddress })
    const decreaseGUSDDebtData = th.getTransactionData('decreaseGUSDDebt(uint256)', ['0x64'])
    const tx2 = await mockBorrowerOperations.forward(activePool.address, decreaseGUSDDebtData)
    assert.isTrue(tx2.receipt.status)
    const recordedGUSD_balanceAfter = await activePool.getGUSDDebt()
    assert.equal(recordedGUSD_balanceAfter, 0)
  })

  // send raw give
  it('sendGIVE(): decreases the recorded GIVE balance by the correct amount', async () => {
    // setup: give pool 2 give
    const activePool_initialBalance = web3.utils.toBN(await web3.eth.getBalance(activePool.address))
    assert.equal(activePool_initialBalance, 0)
    // start pool with 2 give
    //await web3.eth.sendTransaction({ from: mockBorrowerOperationsAddress, to: activePool.address, value: dec(2, 'give') })
    const tx1 = await mockBorrowerOperations.forward(activePool.address, '0x', { from: owner, value: dec(2, 'give') })
    assert.isTrue(tx1.receipt.status)

    const activePool_BalanceBeforeTx = web3.utils.toBN(await web3.eth.getBalance(activePool.address))
    const alice_Balance_BeforeTx = web3.utils.toBN(await web3.eth.getBalance(alice))

    assert.equal(activePool_BalanceBeforeTx, dec(2, 'give'))

    // send give from pool to alice
    //await activePool.sendGIVE(alice, dec(1, 'give'), { from: mockBorrowerOperationsAddress })
    const sendGIVEData = th.getTransactionData('sendGIVE(address,uint256)', [alice, web3.utils.toHex(dec(1, 'give'))])
    const tx2 = await mockBorrowerOperations.forward(activePool.address, sendGIVEData, { from: owner })
    assert.isTrue(tx2.receipt.status)

    const activePool_BalanceAfterTx = web3.utils.toBN(await web3.eth.getBalance(activePool.address))
    const alice_Balance_AfterTx = web3.utils.toBN(await web3.eth.getBalance(alice))

    const alice_BalanceChange = alice_Balance_AfterTx.sub(alice_Balance_BeforeTx)
    const pool_BalanceChange = activePool_BalanceAfterTx.sub(activePool_BalanceBeforeTx)
    assert.equal(alice_BalanceChange, dec(1, 'give'))
    assert.equal(pool_BalanceChange, _minus_1_Ether)
  })
})

contract('DefaultPool', async accounts => {
 
  let defaultPool, mockTroveManager, mockActivePool

  const [owner, alice] = accounts;
  beforeEach(async () => {
    defaultPool = await DefaultPool.new()
    mockTroveManager = await NonPayable.new()
    mockActivePool = await NonPayable.new()
    await defaultPool.setAddresses(mockTroveManager.address, mockActivePool.address)
  })

  it('getGIVE(): gets the recorded GUSD balance', async () => {
    const recordedETHBalance = await defaultPool.getGIVE()
    assert.equal(recordedETHBalance, 0)
  })

  it('getGUSDDebt(): gets the recorded GUSD balance', async () => {
    const recordedETHBalance = await defaultPool.getGUSDDebt()
    assert.equal(recordedETHBalance, 0)
  })
 
  it('increaseGUSD(): increases the recorded GUSD balance by the correct amount', async () => {
    const recordedGUSD_balanceBefore = await defaultPool.getGUSDDebt()
    assert.equal(recordedGUSD_balanceBefore, 0)

    // await defaultPool.increaseGUSDDebt(100, { from: mockTroveManagerAddress })
    const increaseGUSDDebtData = th.getTransactionData('increaseGUSDDebt(uint256)', ['0x64'])
    const tx = await mockTroveManager.forward(defaultPool.address, increaseGUSDDebtData)
    assert.isTrue(tx.receipt.status)

    const recordedGUSD_balanceAfter = await defaultPool.getGUSDDebt()
    assert.equal(recordedGUSD_balanceAfter, 100)
  })
  
  it('decreaseGUSD(): decreases the recorded GUSD balance by the correct amount', async () => {
    // start the pool on 100 wei
    //await defaultPool.increaseGUSDDebt(100, { from: mockTroveManagerAddress })
    const increaseGUSDDebtData = th.getTransactionData('increaseGUSDDebt(uint256)', ['0x64'])
    const tx1 = await mockTroveManager.forward(defaultPool.address, increaseGUSDDebtData)
    assert.isTrue(tx1.receipt.status)

    const recordedGUSD_balanceBefore = await defaultPool.getGUSDDebt()
    assert.equal(recordedGUSD_balanceBefore, 100)

    // await defaultPool.decreaseGUSDDebt(100, { from: mockTroveManagerAddress })
    const decreaseGUSDDebtData = th.getTransactionData('decreaseGUSDDebt(uint256)', ['0x64'])
    const tx2 = await mockTroveManager.forward(defaultPool.address, decreaseGUSDDebtData)
    assert.isTrue(tx2.receipt.status)

    const recordedGUSD_balanceAfter = await defaultPool.getGUSDDebt()
    assert.equal(recordedGUSD_balanceAfter, 0)
  })

  // send raw give
  it('sendGIVEToActivePool(): decreases the recorded GIVE balance by the correct amount', async () => {
    // setup: give pool 2 give
    const defaultPool_initialBalance = web3.utils.toBN(await web3.eth.getBalance(defaultPool.address))
    assert.equal(defaultPool_initialBalance, 0)

    // start pool with 2 give
    //await web3.eth.sendTransaction({ from: mockActivePool.address, to: defaultPool.address, value: dec(2, 'give') })
    const tx1 = await mockActivePool.forward(defaultPool.address, '0x', { from: owner, value: dec(2, 'give') })
    assert.isTrue(tx1.receipt.status)

    const defaultPool_BalanceBeforeTx = web3.utils.toBN(await web3.eth.getBalance(defaultPool.address))
    const activePool_Balance_BeforeTx = web3.utils.toBN(await web3.eth.getBalance(mockActivePool.address))

    assert.equal(defaultPool_BalanceBeforeTx, dec(2, 'give'))

    // send give from pool to alice
    //await defaultPool.sendGIVEToActivePool(dec(1, 'give'), { from: mockTroveManagerAddress })
    const sendGIVEData = th.getTransactionData('sendGIVEToActivePool(uint256)', [web3.utils.toHex(dec(1, 'give'))])
    await mockActivePool.setPayable(true)
    const tx2 = await mockTroveManager.forward(defaultPool.address, sendGIVEData, { from: owner })
    assert.isTrue(tx2.receipt.status)

    const defaultPool_BalanceAfterTx = web3.utils.toBN(await web3.eth.getBalance(defaultPool.address))
    const activePool_Balance_AfterTx = web3.utils.toBN(await web3.eth.getBalance(mockActivePool.address))

    const activePool_BalanceChange = activePool_Balance_AfterTx.sub(activePool_Balance_BeforeTx)
    const defaultPool_BalanceChange = defaultPool_BalanceAfterTx.sub(defaultPool_BalanceBeforeTx)
    assert.equal(activePool_BalanceChange, dec(1, 'give'))
    assert.equal(defaultPool_BalanceChange, _minus_1_Ether)
  })
})

contract('Reset chain state', async accounts => {})
