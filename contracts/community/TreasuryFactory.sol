//SPDX-License-Identifier: MIT
pragma solidity >=0.6.10 <0.8.0;

import "./Treasury.sol";

contract TreasuryFactory {
    function deploy(address ditoCredit) public returns (address) {
        Treasury treasury = new Treasury(ditoCredit);
        // community.transferOwnership(msg.sender);

        return address(treasury);
    }
}