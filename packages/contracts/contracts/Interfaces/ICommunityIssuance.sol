// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface ICommunityIssuance { 
    
    // --- Events ---
    
    event GVTYTokenAddressSet(address _gvtyTokenAddress);
    event StabilityPoolAddressSet(address _stabilityPoolAddress);
    event TotalGVTYIssuedUpdated(uint _totalGVTYIssued);

    // --- Functions ---

    function setAddresses(address _gvtyTokenAddress, address _stabilityPoolAddress) external;

    function issueGVTY() external returns (uint);

    function sendGVTY(address _account, uint _GVTYamount) external;
}
