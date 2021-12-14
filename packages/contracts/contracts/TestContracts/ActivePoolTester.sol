// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../ActivePool.sol";

contract ActivePoolTester is ActivePool {
    
    function unprotectedIncreaseGUSDDebt(uint _amount) external {
        GUSDDebt  = GUSDDebt.add(_amount);
    }

    function unprotectedPayable() external payable {
        GIVE = GIVE.add(msg.value);
    }
}
