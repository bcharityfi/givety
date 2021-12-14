// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/CheckContract.sol";
import "../Interfaces/IGVTYStaking.sol";


contract GVTYStakingScript is CheckContract {
    IGVTYStaking immutable GVTYStaking;

    constructor(address _gvtyStakingAddress) public {
        checkContract(_gvtyStakingAddress);
        GVTYStaking = IGVTYStaking(_gvtyStakingAddress);
    }

    function stake(uint _GVTYamount) external {
        GVTYStaking.stake(_GVTYamount);
    }
}
