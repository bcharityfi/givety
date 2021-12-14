// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

interface IGVTYStaking {

    // --- Events --
    
    event GVTYTokenAddressSet(address _gvtyTokenAddress);
    event GUSDTokenAddressSet(address _gusdTokenAddress);
    event TroveManagerAddressSet(address _troveManager);
    event BorrowerOperationsAddressSet(address _borrowerOperationsAddress);
    event ActivePoolAddressSet(address _activePoolAddress);

    event StakeChanged(address indexed staker, uint newStake);
    event StakingGainsWithdrawn(address indexed staker, uint GUSDGain, uint GIVEGain);
    event F_GIVEUpdated(uint _F_GIVE);
    event F_GUSDUpdated(uint _F_GUSD);
    event TotalGVTYStakedUpdated(uint _totalGVTYStaked);
    event EtherSent(address _account, uint _amount);
    event StakerSnapshotsUpdated(address _staker, uint _F_GIVE, uint _F_GUSD);

    // --- Functions ---

    function setAddresses
    (
        address _gvtyTokenAddress,
        address _gusdTokenAddress,
        address _troveManagerAddress, 
        address _borrowerOperationsAddress,
        address _activePoolAddress
    )  external;

    function stake(uint _GVTYamount) external;

    function unstake(uint _GVTYamount) external;

    function increaseF_GIVE(uint _GIVEFee) external; 

    function increaseF_GUSD(uint _GVTYFee) external;  

    function getPendingGIVEGain(address _user) external view returns (uint);

    function getPendingGUSDGain(address _user) external view returns (uint);
}
