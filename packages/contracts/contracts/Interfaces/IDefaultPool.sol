// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./IPool.sol";


interface IDefaultPool is IPool {
    // --- Events ---
    event TroveManagerAddressChanged(address _newTroveManagerAddress);
    event DefaultPoolGUSDDebtUpdated(uint _GUSDDebt);
    event DefaultPoolGIVEBalanceUpdated(uint _GIVE);

    // --- Functions ---
    function sendGIVEToActivePool(uint _amount) external;
}
