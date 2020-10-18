//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

/**
@title IAtoken interface
@notice provides the interface to fetch the AToken address
 */

abstract contract IAtoken {
    /**
     * @dev calculates the balance of the user, which is the
     * principal balance + interest generated by the principal balance + interest generated by the redirected balance
     * @param _user the user for which the balance is being calculated
     * @return the total balance of the user
     **/
    function balanceOf(address _user) public virtual view returns (uint256);

    /**
     * @dev redeems aToken for the underlying asset
     * @param _amount the amount being redeemed
     **/
    function redeem(uint256 _amount) external virtual;

    /**
     * @dev Used to validate transfers before actually executing them.
     * @param _user address of the user to check
     * @param _amount the amount to check
     * @return true if the _user can transfer _amount, false otherwise
     **/
    function isTransferAllowed(address _user, uint256 _amount)
        public
        virtual
        view
        returns (bool);
}
