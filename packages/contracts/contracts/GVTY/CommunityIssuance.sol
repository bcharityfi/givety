// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Interfaces/IGVTYToken.sol";
import "../Interfaces/ICommunityIssuance.sol";
import "../Dependencies/BaseMath.sol";
import "../Dependencies/GivetyMath.sol";
import "../Dependencies/Ownable.sol";
import "../Dependencies/CheckContract.sol";
import "../Dependencies/SafeMath.sol";


contract CommunityIssuance is ICommunityIssuance, Ownable, CheckContract, BaseMath {
    using SafeMath for uint;

    // --- Data ---

    string constant public NAME = "CommunityIssuance";

    uint constant public SECONDS_IN_ONE_MINUTE = 60;

   /* The issuance factor F determines the curvature of the issuance curve.
    *
    * Minutes in one year: 60*24*365 = 525600
    *
    * For 50% of remaining tokens issued each year, with minutes as time units, we have:
    * 
    * F ** 525600 = 0.5
    * 
    * Re-arranging:
    * 
    * 525600 * ln(F) = ln(0.5)
    * F = 0.5 ** (1/525600)
    * F = 0.999998681227695000 
    */
    uint constant public ISSUANCE_FACTOR = 999998681227695000;

    /* 
    * The community GVTY supply cap is the starting balance of the Community Issuance contract.
    * It should be minted to this contract by GVTYToken, when the token is deployed.
    * 
    * Set to 9M (slightly less than 1/3) of total GVTY supply.
    */
    uint constant public GVTYSupplyCap = 9e24; // 9 million

    IGVTYToken public gvtyToken;

    address public stabilityPoolAddress;

    uint public totalGVTYIssued;
    uint public immutable deploymentTime;

    // --- Events ---

    event GVTYTokenAddressSet(address _gvtyTokenAddress);
    event StabilityPoolAddressSet(address _stabilityPoolAddress);
    event TotalGVTYIssuedUpdated(uint _totalGVTYIssued);

    // --- Functions ---

    constructor() public {
        deploymentTime = block.timestamp;
    }

    function setAddresses
    (
        address _gvtyTokenAddress, 
        address _stabilityPoolAddress
    ) 
        external 
        onlyOwner 
        override 
    {
        checkContract(_gvtyTokenAddress);
        checkContract(_stabilityPoolAddress);

        gvtyToken = IGVTYToken(_gvtyTokenAddress);
        stabilityPoolAddress = _stabilityPoolAddress;

        // When GVTYToken deployed, it should have transferred CommunityIssuance's GVTY entitlement
        uint GVTYBalance = gvtyToken.balanceOf(address(this));
        assert(GVTYBalance >= GVTYSupplyCap);

        emit GVTYTokenAddressSet(_gvtyTokenAddress);
        emit StabilityPoolAddressSet(_stabilityPoolAddress);

        _renounceOwnership();
    }

    function issueGVTY() external override returns (uint) {
        _requireCallerIsStabilityPool();

        uint latestTotalGVTYIssued = GVTYSupplyCap.mul(_getCumulativeIssuanceFraction()).div(DECIMAL_PRECISION);
        uint issuance = latestTotalGVTYIssued.sub(totalGVTYIssued);

        totalGVTYIssued = latestTotalGVTYIssued;
        emit TotalGVTYIssuedUpdated(latestTotalGVTYIssued);
        
        return issuance;
    }

    /* Gets 1-f^t    where: f < 1

    f: issuance factor that determines the shape of the curve
    t:  time passed since last GVTY issuance event  */
    function _getCumulativeIssuanceFraction() internal view returns (uint) {
        // Get the time passed since deployment
        uint timePassedInMinutes = block.timestamp.sub(deploymentTime).div(SECONDS_IN_ONE_MINUTE);

        // f^t
        uint power = GivetyMath._decPow(ISSUANCE_FACTOR, timePassedInMinutes);

        //  (1 - f^t)
        uint cumulativeIssuanceFraction = (uint(DECIMAL_PRECISION).sub(power));
        assert(cumulativeIssuanceFraction <= DECIMAL_PRECISION); // must be in range [0,1]

        return cumulativeIssuanceFraction;
    }

    function sendGVTY(address _account, uint _GVTYamount) external override {
        _requireCallerIsStabilityPool();

        gvtyToken.transfer(_account, _GVTYamount);
    }

    // --- 'require' functions ---

    function _requireCallerIsStabilityPool() internal view {
        require(msg.sender == stabilityPoolAddress, "CommunityIssuance: caller is not SP");
    }
}
