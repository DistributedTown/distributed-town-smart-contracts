//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "./CommonTypes.sol";
import "./DITOCredit.sol";
import "./ISkillWallet.sol";
import "./IMilestones.sol";
import "./Milestones.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract Community {
    string public metadataUri;

    uint256 public ownerId;
    uint16 public activeMembersCount;
    uint256 public scarcityScore;
    mapping(uint256 => bool) public isMember;
    uint256[] public skillWalletIds;
    DITOCredit ditoCredit;
    ISkillWallet skillWallet;
    IMilestones milestones;

    /**
     * @dev emitted when a member is added
     * @param _member the user which just joined the community
     * @param _transferredTokens the amount of transferred dito tokens on join
     **/
    event MemberAdded(
        address indexed _member,
        uint256 _skillWalletTokenId,
        uint256 _transferredTokens
    );
    event MemberLeft(address indexed _member);

    modifier onlyMilestones() {
        require(msg.sender == address(milestones), 'Only Milestones can call this function.');
        _;
    }
    // add JSON Schema base URL
    constructor(string memory _url, address skillWalletAddress) {
        skillWallet = ISkillWallet(skillWalletAddress);
        ditoCredit = new DITOCredit();
        milestones = new Milestones();
        metadataUri = _url;

        ditoCredit.addToWhitelist(address(milestones));
        ditoCredit.transfer(address(milestones), 2006 * 1e18);
    }

    // check if it's called only from deployer.
    function joinNewMember(
        address newMemberAddress,
        uint64 displayStringId1,
        uint8 level1,
        uint64 displayStringId2,
        uint8 level2,
        uint64 displayStringId3,
        uint8 level3,
        string calldata uri,
        uint256 credits
    ) public {
        require(
            activeMembersCount <= 25,
            "There are already 24 members, sorry!"
        );

        Types.SkillSet memory skillSet =
            Types.SkillSet(
                Types.Skill(displayStringId1, level1),
                Types.Skill(displayStringId2, level2),
                Types.Skill(displayStringId3, level3)
            );

        skillWallet.create(newMemberAddress, skillSet, uri);
        uint256 tokenId = skillWallet.getSkillWalletIdByOwner(newMemberAddress);

        // get the skills from chainlink
        ditoCredit.addToWhitelist(newMemberAddress);
        ditoCredit.transfer(newMemberAddress, credits);

        skillWalletIds.push(tokenId);
        isMember[tokenId] = true;
        activeMembersCount++;

        emit MemberAdded(newMemberAddress, tokenId, credits);
    }

    function join(uint256 skillWalletTokenId, uint256 credits) public {
        require(
            activeMembersCount <= 24,
            "There are already 24 members, sorry!"
        );
        require(!isMember[skillWalletTokenId], "You have already joined!");

        address skillWalletAddress = skillWallet.ownerOf(skillWalletTokenId);

        // require(
        //     msg.sender == skillWalletAddress,
        //     "Only the skill wallet owner can call this function"
        // );

        isMember[skillWalletTokenId] = true;
        skillWalletIds[activeMembersCount] = skillWalletTokenId;
        skillWalletIds[1] = 123;
        activeMembersCount++;

        ditoCredit.addToWhitelist(skillWalletAddress);
        ditoCredit.transfer(skillWalletAddress, credits);

        emit MemberAdded(skillWalletAddress, skillWalletTokenId, credits);
    }

    function leave(address memberAddress) public {
        emit MemberLeft(memberAddress);
    }   

    function getMembers() public view returns (uint256[] memory) {
        return skillWalletIds;
    }

    function approveMilestoneDiToTransfer(uint256 diToCredits) public onlyMilestones { 
        ditoCredit.approve(address(milestones), diToCredits);
    }
}
