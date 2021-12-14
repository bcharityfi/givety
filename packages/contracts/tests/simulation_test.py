import pytest

import csv

from brownie import *
from accounts import *
from helpers import *
from simulation_helpers import *

class Contracts: pass


def setAddresses(contracts):
    contracts.sortedTroves.setParams(
        MAX_BYTES_32,
        contracts.troveManager.address,
        contracts.borrowerOperations.address,
        { 'from': accounts[0] }
    )

    contracts.troveManager.setAddresses(
        contracts.borrowerOperations.address,
        contracts.activePool.address,
        contracts.defaultPool.address,
        contracts.stabilityPool.address,
        contracts.gasPool.address,
        contracts.collSurplusPool.address,
        contracts.priceFeedTestnet.address,
        contracts.gusdToken.address,
        contracts.sortedTroves.address,
        contracts.gvtyToken.address,
        contracts.gvtyStaking.address,
        { 'from': accounts[0] }
    )

    contracts.borrowerOperations.setAddresses(
        contracts.troveManager.address,
        contracts.activePool.address,
        contracts.defaultPool.address,
        contracts.stabilityPool.address,
        contracts.gasPool.address,
        contracts.collSurplusPool.address,
        contracts.priceFeedTestnet.address,
        contracts.sortedTroves.address,
        contracts.gusdToken.address,
        contracts.gvtyStaking.address,
        { 'from': accounts[0] }
    )

    contracts.stabilityPool.setAddresses(
        contracts.borrowerOperations.address,
        contracts.troveManager.address,
        contracts.activePool.address,
        contracts.gusdToken.address,
        contracts.sortedTroves.address,
        contracts.priceFeedTestnet.address,
        contracts.communityIssuance.address,
        { 'from': accounts[0] }
    )

    contracts.activePool.setAddresses(
        contracts.borrowerOperations.address,
        contracts.troveManager.address,
        contracts.stabilityPool.address,
        contracts.defaultPool.address,
        { 'from': accounts[0] }
    )

    contracts.defaultPool.setAddresses(
        contracts.troveManager.address,
        contracts.activePool.address,
        { 'from': accounts[0] }
    )

    contracts.collSurplusPool.setAddresses(
        contracts.borrowerOperations.address,
        contracts.troveManager.address,
        contracts.activePool.address,
        { 'from': accounts[0] }
    )

    contracts.hintHelpers.setAddresses(
        contracts.sortedTroves.address,
        contracts.troveManager.address,
        { 'from': accounts[0] }
    )

    # GVTY
    contracts.gvtyStaking.setAddresses(
        contracts.gvtyToken.address,
        contracts.gusdToken.address,
        contracts.troveManager.address,
        contracts.borrowerOperations.address,
        contracts.activePool.address,
        { 'from': accounts[0] }
    )

    contracts.communityIssuance.setAddresses(
        contracts.gvtyToken.address,
        contracts.stabilityPool.address,
        { 'from': accounts[0] }
    )

@pytest.fixture
def add_accounts():
    if network.show_active() != 'development':
        print("Importing accounts...")
        import_accounts(accounts)

@pytest.fixture
def contracts():
    contracts = Contracts()

    contracts.priceFeedTestnet = PriceFeedTestnet.deploy({ 'from': accounts[0] })
    contracts.sortedTroves = SortedTroves.deploy({ 'from': accounts[0] })
    contracts.troveManager = TroveManager.deploy({ 'from': accounts[0] })
    contracts.activePool = ActivePool.deploy({ 'from': accounts[0] })
    contracts.stabilityPool = StabilityPool.deploy({ 'from': accounts[0] })
    contracts.gasPool = GasPool.deploy({ 'from': accounts[0] })
    contracts.defaultPool = DefaultPool.deploy({ 'from': accounts[0] })
    contracts.collSurplusPool = CollSurplusPool.deploy({ 'from': accounts[0] })
    contracts.borrowerOperations = BorrowerOperationsTester.deploy({ 'from': accounts[0] })
    contracts.hintHelpers = HintHelpers.deploy({ 'from': accounts[0] })
    contracts.gusdToken = GUSDToken.deploy(
        contracts.troveManager.address,
        contracts.stabilityPool.address,
        contracts.borrowerOperations.address,
        { 'from': accounts[0] }
    )
    # GVTY
    contracts.gvtyStaking = GVTYStaking.deploy({ 'from': accounts[0] })
    contracts.communityIssuance = CommunityIssuance.deploy({ 'from': accounts[0] })
    contracts.lockupContractFactory = LockupContractFactory.deploy({ 'from': accounts[0] })
    contracts.gvtyToken = GVTYToken.deploy(
        contracts.communityIssuance.address,
        contracts.gvtyStaking.address,
        contracts.lockupContractFactory.address,
        accounts[0], # bountyAddress
        accounts[0],  # lpRewardsAddress
        accounts[0],  # multisigAddress
        { 'from': accounts[0] }
    )

    setAddresses(contracts)

    return contracts

@pytest.fixture
def print_expectations():
    # ether_price_one_year = price_ether_initial * (1 + drift_ether)**8760
    # print("Expected give price at the end of the year: $", ether_price_one_year)
    print("Expected GVTY price at the end of first month: $", price_GVTY_initial * (1 + drift_GVTY)**720)

    print("\n Open troves")
    print("E(Q_t^e)    = ", collateral_gamma_k * collateral_gamma_theta)
    print("SD(Q_t^e)   = ", collateral_gamma_k**(0.5) * collateral_gamma_theta)
    print("E(CR^*(i))  = ", (target_cr_a + target_cr_b * target_cr_chi_square_df) * 100, "%")
    print("SD(CR^*(i)) = ", target_cr_b * (2*target_cr_chi_square_df)**(1/2) * 100, "%")
    print("E(tau)      = ", rational_inattention_gamma_k * rational_inattention_gamma_theta * 100, "%")
    print("SD(tau)     = ", rational_inattention_gamma_k**(0.5) * rational_inattention_gamma_theta * 100, "%")
    print("\n")

def _test_test(contracts):
    print(len(accounts))
    contracts.borrowerOperations.openTrove(Wei(1e18), Wei(2000e18), ZERO_ADDRESS, ZERO_ADDRESS,
                                           { 'from': accounts[1], 'value': Wei("100 give") })

    #assert False

"""# Simulation Program
**Sequence of events**

> In each period, the following events occur sequentially


* exogenous give price input
* trove liquidation
* return of the previous period's stability pool determined (liquidation gain & airdropped GVTY gain)
* trove closure
* trove adjustment
* open troves
* issuance fee
* trove pool formed
* GUSD supply determined
* GUSD stability pool demand determined
* GUSD liquidity pool demand determined
* GUSD price determined
* redemption & redemption fee
* GVTY pool return determined
"""
def test_run_simulation(add_accounts, contracts, print_expectations):
    GUSD_GAS_COMPENSATION = contracts.troveManager.GUSD_GAS_COMPENSATION() / 1e18
    MIN_NET_DEBT = contracts.troveManager.MIN_NET_DEBT() / 1e18

    contracts.priceFeedTestnet.setPrice(floatToWei(price_ether[0]), { 'from': accounts[0] })
    # whale
    whale_coll = 30000.0
    contracts.borrowerOperations.openTrove(MAX_FEE, Wei(10e24), ZERO_ADDRESS, ZERO_ADDRESS,
                                           { 'from': accounts[0], 'value': floatToWei(whale_coll) })
    contracts.stabilityPool.provideToSP(floatToWei(stability_initial), ZERO_ADDRESS, { 'from': accounts[0] })

    active_accounts = []
    inactive_accounts = [*range(1, len(accounts))]

    price_GUSD = 1
    price_GVTY_current = price_GVTY_initial

    data = {"airdrop_gain": [0] * n_sim, "liquidation_gain": [0] * n_sim, "issuance_fee": [0] * n_sim, "redemption_fee": [0] * n_sim}
    total_gusd_redempted = 0
    total_coll_added = whale_coll
    total_coll_liquidated = 0

    print(f"Accounts: {len(accounts)}")
    print(f"Network: {network.show_active()}")

    logGlobalState(contracts)

    with open('tests/simulation.csv', 'w', newline='') as csvfile:
        datawriter = csv.writer(csvfile, delimiter=',')
        datawriter.writerow(['iteration', 'GIVE_price', 'price_GUSD', 'price_GVTY', 'num_troves', 'total_coll', 'total_debt', 'TCR', 'recovery_mode', 'last_ICR', 'SP_GUSD', 'SP_GIVE', 'total_coll_added', 'total_coll_liquidated', 'total_gusd_redempted'])

        #Simulation Process
        for index in range(1, n_sim):
            print('\n  --> Iteration', index)
            print('  -------------------\n')
            #exogenous give price input
            price_ether_current = price_ether[index]
            contracts.priceFeedTestnet.setPrice(floatToWei(price_ether_current), { 'from': accounts[0] })

            #trove liquidation & return of stability pool
            result_liquidation = liquidate_troves(accounts, contracts, active_accounts, inactive_accounts, price_ether_current, price_GUSD, price_GVTY_current, data, index)
            total_coll_liquidated = total_coll_liquidated + result_liquidation[0]
            return_stability = result_liquidation[1]

            #close troves
            result_close = close_troves(accounts, contracts, active_accounts, inactive_accounts, price_ether_current, price_GUSD, index)

            #adjust troves
            [coll_added_adjust, issuance_GUSD_adjust] = adjust_troves(accounts, contracts, active_accounts, inactive_accounts, price_ether_current, index)

            #open troves
            [coll_added_open, issuance_GUSD_open] = open_troves(accounts, contracts, active_accounts, inactive_accounts, price_ether_current, price_GUSD, index)
            total_coll_added = total_coll_added + coll_added_adjust + coll_added_open
            #active_accounts.sort(key=lambda a : a.get('CR_initial'))

            #Stability Pool
            stability_update(accounts, contracts, active_accounts, return_stability, index)

            #Calculating Price, Liquidity Pool, and Redemption
            [price_GUSD, redemption_pool, redemption_fee, issuance_GUSD_stabilizer] = price_stabilizer(accounts, contracts, active_accounts, inactive_accounts, price_ether_current, price_GUSD, index)
            total_gusd_redempted = total_gusd_redempted + redemption_pool
            print('GUSD price', price_GUSD)
            print('GVTY price', price_GVTY_current)

            issuance_fee = price_GUSD * (issuance_GUSD_adjust + issuance_GUSD_open + issuance_GUSD_stabilizer)
            data['issuance_fee'][index] = issuance_fee
            data['redemption_fee'][index] = redemption_fee

            #GVTY Market
            result_GVTY = GVTY_market(index, data)
            price_GVTY_current = result_GVTY[0]
            #annualized_earning = result_GVTY[1]
            #MC_GVTY_current = result_GVTY[2]

            [GIVE_price, num_troves, total_coll, total_debt, TCR, recovery_mode, last_ICR, SP_GUSD, SP_GIVE] = logGlobalState(contracts)
            print('Total redempted ', total_gusd_redempted)
            print('Total GIVE added ', total_coll_added)
            print('Total GIVE liquid', total_coll_liquidated)
            print(f'Ratio GIVE liquid {100 * total_coll_liquidated / total_coll_added}%')
            print(' ----------------------\n')

            datawriter.writerow([index, GIVE_price, price_GUSD, price_GVTY_current, num_troves, total_coll, total_debt, TCR, recovery_mode, last_ICR, SP_GUSD, SP_GIVE, total_coll_added, total_coll_liquidated, total_gusd_redempted])

            assert price_GUSD > 0
