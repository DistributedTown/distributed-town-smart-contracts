//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Community.sol";
import "./SkillStruct.sol";



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
    mapping(uint16 => uint16) positionalValues;

    constructor(Template _template, uint8 positionalValue1, uint8 positionalValue2, uint8 positionalValue3) public {
        communityAddress = msg.sender;
        community = Community(msg.sender);
        template = _template;
        positionalValue[1] = positionalValue1;
        positionalValue[2] = positionalValue2;
        positionalValue[3] = positionalValue3;
    }

    function getPoisitionalValues() public view returns(uint8[3] memory) {
        return positionalValues;
    }

    function getTemplate() public view returns(Template) {
        return template;
    }
}
