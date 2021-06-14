//SPDX-License-Identifier: MIT
pragma solidity >=0.6.10 <0.8.0;

import "./Gigs.sol";

contract GigsFactory {
    function deploy() public returns (address) {
        Gigs gigs = new Gigs(msg.sender);
        return address(gigs);
    }
}