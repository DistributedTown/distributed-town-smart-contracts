//SPDX-License-Identifier: MIT
pragma solidity >=0.6.10 <0.8.0;

import "./DITOCredit.sol";

contract DiToCreditsFactory {
    function deploy() public returns (address) {
        // community.transferOwnership(msg.sender);
        address[] memory defaultOperators = new address[](1);
        defaultOperators[0] = msg.sender;

        DITOCredit credits = new DITOCredit(defaultOperators);

        return address(credits);
    }
}
