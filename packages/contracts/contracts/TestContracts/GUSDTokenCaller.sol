// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "../Interfaces/IGUSDToken.sol";

contract GUSDTokenCaller {
    IGUSDToken GUSD;

    function setGUSD(IGUSDToken _GUSD) external {
        GUSD = _GUSD;
    }

    function gusdMint(address _account, uint _amount) external {
        GUSD.mint(_account, _amount);
    }

    function gusdBurn(address _account, uint _amount) external {
        GUSD.burn(_account, _amount);
    }

    function gusdSendToPool(address _sender,  address _poolAddress, uint256 _amount) external {
        GUSD.sendToPool(_sender, _poolAddress, _amount);
    }

    function gusdReturnFromPool(address _poolAddress, address _receiver, uint256 _amount ) external {
        GUSD.returnFromPool(_poolAddress, _receiver, _amount);
    }
}
