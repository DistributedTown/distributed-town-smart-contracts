//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import './community/DITOCreditFactory.sol';
import './community/TreasuryFactory.sol';
import './gigs/GigsFactory.sol';

contract AddressProvider {
    address public treasuryFactory;
    address public ditoTokenFactory;
    address public gigsFactory;

    constructor(
    ) public {
        ditoTokenFactory = address(new DiToCreditsFactory());
        gigsFactory = address(new GigsFactory());
        treasuryFactory = address(new TreasuryFactory());
    }
}