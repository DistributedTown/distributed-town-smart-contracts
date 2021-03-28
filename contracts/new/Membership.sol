//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/math/SafeMath.sol";

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
    uint8 public numOfMembers;
    mapping(address => Member) public members;


    /**
     * @dev emitted when a member is added
     * @param _member the user which just joined the community
     * @param _transferredTokens the amount of transferred dito tokens on join
     **/
    event MemberAdded(address _member, uint256 _transferredTokens);

    struct Member {
        Skill[] skills;
    }

    struct Skill {
        uint8 value;
        uint8 level;
    }

    constructor(address _communityAddress) {
        numOfMembers = 0;
        community = Community(_communityAddress);
        communityAddress = _communityAddress;
        // add treasury
    }

    function join(address memberAddress, Member memory member) public onlyOwner {
        require(numOfMembers < 24, "There are already 24 members, sorry!");
        require(
            members[memberAddress] != address(0x0),
            "You have already joined!"
        );

        members.push(member);
        enabledMembers[memberAddress] = true;
        numOfMembers++;
        uint16 credits = calculateCredits(member);
        community.transferDiToCredits(msg.sender, memberAddress, credits);
        emit MemberAdded(memberAddress, credits);
    }

    function calculateCredits(Member memory member) private returns (uint16) {
        uint16 result = 2000;
        for(uint16 i = 0; i < skills.length; i++) {
            result += value * level;
        }
        return result;
    }
}
