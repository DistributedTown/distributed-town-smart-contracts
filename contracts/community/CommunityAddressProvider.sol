//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

contract CommunityAddressProvider {
    address public distributedTownAddr;
    address public ditoCreditsAddr;
    address public treasuryAddr;
    address public gigsAddr;
    address public ditoCreditsHolder;

    constructor (
        address _distributedTownAddr,
        address _ditoCreditsAddr,
        address _treasuryAddr,
        address _gigsAddr,
        address _ditoCreditsHolder 
    ) public {
        distributedTownAddr = _distributedTownAddr;
        ditoCreditsAddr = _ditoCreditsAddr;
        treasuryAddr = _treasuryAddr;
        gigsAddr = _gigsAddr;
        ditoCreditsHolder = _ditoCreditsHolder;
    }
}