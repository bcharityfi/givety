// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../GVTY/CommunityIssuance.sol";

contract CommunityIssuanceTester is CommunityIssuance {
    function obtainGVTY(uint _amount) external {
        gvtyToken.transfer(msg.sender, _amount);
    }

    function getCumulativeIssuanceFraction() external view returns (uint) {
       return _getCumulativeIssuanceFraction();
    }

    function unprotectedIssueGVTY() external returns (uint) {
        // No checks on caller address
       
        uint latestTotalGVTYIssued = GVTYSupplyCap.mul(_getCumulativeIssuanceFraction()).div(DECIMAL_PRECISION);
        uint issuance = latestTotalGVTYIssued.sub(totalGVTYIssued);
      
        totalGVTYIssued = latestTotalGVTYIssued;
        return issuance;
    }
}
