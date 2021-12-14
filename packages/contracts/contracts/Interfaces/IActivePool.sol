// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./IPool.sol";


interface IActivePool is IPool {
    // --- Events ---
    event BorrowerOperationsAddressChanged(address _newBorrowerOperationsAddress);
    event TroveManagerAddressChanged(address _newTroveManagerAddress);
    event ActivePoolGUSDDebtUpdated(uint _GUSDDebt);
    event ActivePoolGIVEBalanceUpdated(uint _GIVE);

    // --- Functions ---
    function sendGIVE(address _account, uint _amount) external;
}
