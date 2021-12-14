// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../GVTY/GVTYStaking.sol";


contract GVTYStakingTester is GVTYStaking {
    function requireCallerIsTroveManager() external view {
        _requireCallerIsTroveManager();
    }
}
