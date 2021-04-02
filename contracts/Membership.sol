//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Community.sol";



/**
 * @title DistributedTown Membership contract
 *
 * @dev Implementation of the Membership contract in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract Membership {

    using SafeMath for uint256;

    enum Template {
        OpenSource, 
        Art, 
        Local,
        Other
    }
    address public communityAddress;
    Community community;
    Template template;
    uint8[3] positionalValues;

    constructor(Template _template, uint8[3] memory _positionalValues) public {
        communityAddress = msg.sender;
        community = Community(msg.sender);
        template = _template;
        positionalValues = _positionalValues;
    }

    function getPoisitionalValues() public view returns(uint8[3] memory) {
        return positionalValues;
    }

    function getTemplate() public view returns(Template) {
        return template;
    }
}
