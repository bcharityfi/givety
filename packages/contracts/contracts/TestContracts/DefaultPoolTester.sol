// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../DefaultPool.sol";

contract DefaultPoolTester is DefaultPool {
    
    function unprotectedIncreaseGUSDDebt(uint _amount) external {
        GUSDDebt  = GUSDDebt.add(_amount);
    }

    function unprotectedPayable() external payable {
        GIVE = GIVE.add(msg.value);
    }
}
