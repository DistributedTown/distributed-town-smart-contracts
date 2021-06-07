//SPDX-License-Identifier: MIT
pragma solidity >=0.6.10 <0.8.0;

import "./DITOCredit.sol";

contract DiToCreditsFactory {
    function deploy() public returns (address) {
        address[] memory defaultOperators = new address[](1);
        defaultOperators[0] = msg.sender;

        DITOCredit credits = new DITOCredit(msg.sender, defaultOperators);
        credits.transferOwnership(msg.sender);
        return address(credits);
    }
}
