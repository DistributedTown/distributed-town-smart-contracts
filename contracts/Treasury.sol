//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "./DITOCredit.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract Treasury {
    DITOCredit private ditoCredits;
    address private communityAddress;

    constructor(address ditoCreditsAddress) {
        ditoCredits = DITOCredit(ditoCreditsAddress);
        communityAddress = msg.sender;
    }

    function returnCreditsIfThresholdReached() public {
        uint256 balance = ditoCredit.balanceOf(address(this));
        uint256 threshold = 3840 * 1e18;
        if (balance >= threshold) {
            ditoCredit.transfer(communityAddress, balance - 2006 * 1e18);
        }
    }
}
