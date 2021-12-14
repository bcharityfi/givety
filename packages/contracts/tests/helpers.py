from brownie import Wei

ZERO_ADDRESS = '0x' + '0'.zfill(40)
MAX_BYTES_32 = '0x' + 'F' * 64

def floatToWei(amount):
    return Wei(amount * 1e18)

# Subtracts the borrowing fee
def get_gusd_amount_from_net_debt(contracts, net_debt):
    borrowing_rate = contracts.troveManager.getBorrowingRateWithDecay()
    return Wei(net_debt * Wei(1e18) / (Wei(1e18) + borrowing_rate))

def logGlobalState(contracts):
    print('\n ---- Global state ----')
    num_troves = contracts.sortedTroves.getSize()
    print('Num troves      ', num_troves)
    activePoolColl = contracts.activePool.getGIVE()
    activePoolDebt = contracts.activePool.getGUSDDebt()
    defaultPoolColl = contracts.defaultPool.getGIVE()
    defaultPoolDebt = contracts.defaultPool.getGUSDDebt()
    total_debt = (activePoolDebt + defaultPoolDebt).to("give")
    total_coll = (activePoolColl + defaultPoolColl).to("give")
    print('Total Debt      ', total_debt)
    print('Total Coll      ', total_coll)
    SP_GUSD = contracts.stabilityPool.getTotalGUSDDeposits().to("give")
    SP_GIVE = contracts.stabilityPool.getGIVE().to("give")
    print('SP GUSD         ', SP_GUSD)
    print('SP GIVE          ', SP_GIVE)
    price_ether_current = contracts.priceFeedTestnet.getPrice()
    GIVE_price = price_ether_current.to("give")
    print('GIVE price       ', GIVE_price)
    TCR = contracts.troveManager.getTCR(price_ether_current).to("give")
    print('TCR             ', TCR)
    recovery_mode = contracts.troveManager.checkRecoveryMode(price_ether_current)
    print('Rec. Mode       ', recovery_mode)
    stakes_snapshot = contracts.troveManager.totalStakesSnapshot()
    coll_snapshot = contracts.troveManager.totalCollateralSnapshot()
    print('Stake snapshot  ', stakes_snapshot.to("give"))
    print('Coll snapshot   ', coll_snapshot.to("give"))
    if stakes_snapshot > 0:
        print('Snapshot ratio  ', coll_snapshot / stakes_snapshot)
    last_trove = contracts.sortedTroves.getLast()
    last_ICR = contracts.troveManager.getCurrentICR(last_trove, price_ether_current).to("give")
    #print('Last trove      ', last_trove)
    print('Last trove’s ICR', last_ICR)
    print(' ----------------------\n')

    return [GIVE_price, num_troves, total_coll, total_debt, TCR, recovery_mode, last_ICR, SP_GUSD, SP_GIVE]
