// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

// Common interface for the Pools.
interface IPool {
    
    // --- Events ---
    
    event GIVEBalanceUpdated(uint _newBalance);
    event GUSDBalanceUpdated(uint _newBalance);
    event ActivePoolAddressChanged(address _newActivePoolAddress);
    event DefaultPoolAddressChanged(address _newDefaultPoolAddress);
    event StabilityPoolAddressChanged(address _newStabilityPoolAddress);
    event EtherSent(address _to, uint _amount);

    // --- Functions ---
    
    function getGIVE() external view returns (uint);

    function getGUSDDebt() external view returns (uint);

    function increaseGUSDDebt(uint _amount) external;

    function decreaseGUSDDebt(uint _amount) external;
}
