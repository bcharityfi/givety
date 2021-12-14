// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Dependencies/BaseMath.sol";
import "../Dependencies/SafeMath.sol";
import "../Dependencies/Ownable.sol";
import "../Dependencies/CheckContract.sol";
import "../Dependencies/console.sol";
import "../Interfaces/IGVTYToken.sol";
import "../Interfaces/IGVTYStaking.sol";
import "../Dependencies/GivetyMath.sol";
import "../Interfaces/IGUSDToken.sol";

contract GVTYStaking is IGVTYStaking, Ownable, CheckContract, BaseMath {
    using SafeMath for uint;

    // --- Data ---
    string constant public NAME = "GVTYStaking";

    mapping( address => uint) public stakes;
    uint public totalGVTYStaked;

    uint public F_GIVE;  // Running sum of GIVE fees per-GVTY-staked
    uint public F_GUSD; // Running sum of GVTY fees per-GVTY-staked

    // User snapshots of F_GIVE and F_GUSD, taken at the point at which their latest deposit was made
    mapping (address => Snapshot) public snapshots; 

    struct Snapshot {
        uint F_GIVE_Snapshot;
        uint F_GUSD_Snapshot;
    }
    
    IGVTYToken public gvtyToken;
    IGUSDToken public gusdToken;

    address public troveManagerAddress;
    address public borrowerOperationsAddress;
    address public activePoolAddress;

    // --- Events ---

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
    ) 
        external 
        onlyOwner 
        override 
    {
        checkContract(_gvtyTokenAddress);
        checkContract(_gusdTokenAddress);
        checkContract(_troveManagerAddress);
        checkContract(_borrowerOperationsAddress);
        checkContract(_activePoolAddress);

        gvtyToken = IGVTYToken(_gvtyTokenAddress);
        gusdToken = IGUSDToken(_gusdTokenAddress);
        troveManagerAddress = _troveManagerAddress;
        borrowerOperationsAddress = _borrowerOperationsAddress;
        activePoolAddress = _activePoolAddress;

        emit GVTYTokenAddressSet(_gvtyTokenAddress);
        emit GVTYTokenAddressSet(_gusdTokenAddress);
        emit TroveManagerAddressSet(_troveManagerAddress);
        emit BorrowerOperationsAddressSet(_borrowerOperationsAddress);
        emit ActivePoolAddressSet(_activePoolAddress);

        _renounceOwnership();
    }

    // If caller has a pre-existing stake, send any accumulated GIVE and GUSD gains to them. 
    function stake(uint _GVTYamount) external override {
        _requireNonZeroAmount(_GVTYamount);

        uint currentStake = stakes[msg.sender];

        uint GIVEGain;
        uint GUSDGain;
        // Grab any accumulated GIVE and GUSD gains from the current stake
        if (currentStake != 0) {
            GIVEGain = _getPendingGIVEGain(msg.sender);
            GUSDGain = _getPendingGUSDGain(msg.sender);
        }
    
       _updateUserSnapshots(msg.sender);

        uint newStake = currentStake.add(_GVTYamount);

        // Increase user’s stake and total GVTY staked
        stakes[msg.sender] = newStake;
        totalGVTYStaked = totalGVTYStaked.add(_GVTYamount);
        emit TotalGVTYStakedUpdated(totalGVTYStaked);

        // Transfer GVTY from caller to this contract
        gvtyToken.sendToGVTYStaking(msg.sender, _GVTYamount);

        emit StakeChanged(msg.sender, newStake);
        emit StakingGainsWithdrawn(msg.sender, GUSDGain, GIVEGain);

         // Send accumulated GUSD and GIVE gains to the caller
        if (currentStake != 0) {
            gusdToken.transfer(msg.sender, GUSDGain);
            _sendGIVEGainToUser(GIVEGain);
        }
    }

    // Unstake the GVTY and send the it back to the caller, along with their accumulated GUSD & GIVE gains. 
    // If requested amount > stake, send their entire stake.
    function unstake(uint _GVTYamount) external override {
        uint currentStake = stakes[msg.sender];
        _requireUserHasStake(currentStake);

        // Grab any accumulated GIVE and GUSD gains from the current stake
        uint GIVEGain = _getPendingGIVEGain(msg.sender);
        uint GUSDGain = _getPendingGUSDGain(msg.sender);
        
        _updateUserSnapshots(msg.sender);

        if (_GVTYamount > 0) {
            uint GVTYToWithdraw = GivetyMath._min(_GVTYamount, currentStake);

            uint newStake = currentStake.sub(GVTYToWithdraw);

            // Decrease user's stake and total GVTY staked
            stakes[msg.sender] = newStake;
            totalGVTYStaked = totalGVTYStaked.sub(GVTYToWithdraw);
            emit TotalGVTYStakedUpdated(totalGVTYStaked);

            // Transfer unstaked GVTY to user
            gvtyToken.transfer(msg.sender, GVTYToWithdraw);

            emit StakeChanged(msg.sender, newStake);
        }

        emit StakingGainsWithdrawn(msg.sender, GUSDGain, GIVEGain);

        // Send accumulated GUSD and GIVE gains to the caller
        gusdToken.transfer(msg.sender, GUSDGain);
        _sendGIVEGainToUser(GIVEGain);
    }

    // --- Reward-per-unit-staked increase functions. Called by Givety core contracts ---

    function increaseF_GIVE(uint _GIVEFee) external override {
        _requireCallerIsTroveManager();
        uint ETHFeePerGVTYStaked;
     
        if (totalGVTYStaked > 0) {ETHFeePerGVTYStaked = _GIVEFee.mul(DECIMAL_PRECISION).div(totalGVTYStaked);}

        F_GIVE = F_GIVE.add(ETHFeePerGVTYStaked); 
        emit F_GIVEUpdated(F_GIVE);
    }

    function increaseF_GUSD(uint _GUSDFee) external override {
        _requireCallerIsBorrowerOperations();
        uint GUSDFeePerGVTYStaked;
        
        if (totalGVTYStaked > 0) {GUSDFeePerGVTYStaked = _GUSDFee.mul(DECIMAL_PRECISION).div(totalGVTYStaked);}
        
        F_GUSD = F_GUSD.add(GUSDFeePerGVTYStaked);
        emit F_GUSDUpdated(F_GUSD);
    }

    // --- Pending reward functions ---

    function getPendingGIVEGain(address _user) external view override returns (uint) {
        return _getPendingGIVEGain(_user);
    }

    function _getPendingGIVEGain(address _user) internal view returns (uint) {
        uint F_GIVE_Snapshot = snapshots[_user].F_GIVE_Snapshot;
        uint GIVEGain = stakes[_user].mul(F_GIVE.sub(F_GIVE_Snapshot)).div(DECIMAL_PRECISION);
        return GIVEGain;
    }

    function getPendingGUSDGain(address _user) external view override returns (uint) {
        return _getPendingGUSDGain(_user);
    }

    function _getPendingGUSDGain(address _user) internal view returns (uint) {
        uint F_GUSD_Snapshot = snapshots[_user].F_GUSD_Snapshot;
        uint GUSDGain = stakes[_user].mul(F_GUSD.sub(F_GUSD_Snapshot)).div(DECIMAL_PRECISION);
        return GUSDGain;
    }

    // --- Internal helper functions ---

    function _updateUserSnapshots(address _user) internal {
        snapshots[_user].F_GIVE_Snapshot = F_GIVE;
        snapshots[_user].F_GUSD_Snapshot = F_GUSD;
        emit StakerSnapshotsUpdated(_user, F_GIVE, F_GUSD);
    }

    function _sendGIVEGainToUser(uint GIVEGain) internal {
        emit EtherSent(msg.sender, GIVEGain);
        (bool success, ) = msg.sender.call{value: GIVEGain}("");
        require(success, "GVTYStaking: Failed to send accumulated GIVEGain");
    }

    // --- 'require' functions ---

    function _requireCallerIsTroveManager() internal view {
        require(msg.sender == troveManagerAddress, "GVTYStaking: caller is not TroveM");
    }

    function _requireCallerIsBorrowerOperations() internal view {
        require(msg.sender == borrowerOperationsAddress, "GVTYStaking: caller is not BorrowerOps");
    }

     function _requireCallerIsActivePool() internal view {
        require(msg.sender == activePoolAddress, "GVTYStaking: caller is not ActivePool");
    }

    function _requireUserHasStake(uint currentStake) internal pure {  
        require(currentStake > 0, 'GVTYStaking: User must have a non-zero stake');  
    }

    function _requireNonZeroAmount(uint _amount) internal pure {
        require(_amount > 0, 'GVTYStaking: Amount must be non-zero');
    }

    receive() external payable {
        _requireCallerIsActivePool();
    }
}
