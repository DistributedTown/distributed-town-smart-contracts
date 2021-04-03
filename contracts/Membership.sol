//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Community.sol";
import "./CommonTypes.sol";



/**
 * @title DistributedTown Membership contract
 *
 * @dev Implementation of the Membership contract in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract Membership {

    using SafeMath for uint256;

    address public communityAddress;
    Community community;
    Types.Template public template;
    mapping(uint16 => uint16) public positionalValues;

    constructor(Types.Template _template, uint8 positionalValue1, uint8 positionalValue2, uint8 positionalValue3) public {
        communityAddress = msg.sender;
        community = Community(msg.sender);
        template = _template;
        positionalValues[1] = positionalValue1;
        positionalValues[2] = positionalValue2;
        positionalValues[3] = positionalValue3;
    }

}
