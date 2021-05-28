//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "./CommonTypes.sol";
import "./DITOCredit.sol";
import "./ISkillWallet.sol";
import "./Treasury.sol";
import "./DistributedTown.sol";
import "./Projects.sol";

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
    mapping(address => bool) public isMember;
    uint256[] public skillWalletIds;
    uint256 public tokenId;

    DistributedTown distributedTown;
    DITOCredit ditoCredit;
    Treasury treasury;
    uint256[] projectIds;

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

    // add JSON Schema base URL
    constructor(string memory _url) public {
        metadataUri = _url;
        distributedTown = DistributedTown(msg.sender);
        address[] memory defaultOperators = new address[](1);
        defaultOperators[0] = address(this); 
        ditoCredit = new DITOCredit(defaultOperators);
        treasury = new Treasury(address(ditoCredit));
        joinNewMember(0, 0, 0, 0, 0, 0, _url, 2006 * 1e18);
    }

    // check if it's called only from deployer.
    function joinNewMember(
        uint64 displayStringId1,
        uint8 level1,
        uint64 displayStringId2,
        uint8 level2,
        uint64 displayStringId3,
        uint8 level3,
        string memory uri,
        uint256 credits
    ) public {
        require(
            activeMembersCount <= 24,
            "There are already 24 members, sorry!"
        );

        // the DiTo contract can only join the treasury as a member of the community
        address newMemberAddress =
            msg.sender == address(distributedTown)
                ? address(treasury)
                : msg.sender;

        Types.SkillSet memory skillSet =
            Types.SkillSet(
                Types.Skill(displayStringId1, level1),
                Types.Skill(displayStringId2, level2),
                Types.Skill(displayStringId3, level3)
            );

        ISkillWallet skillWallet =
            ISkillWallet(distributedTown.skillWalletAddress());
        skillWallet.create(newMemberAddress, skillSet, uri);
        uint256 token = skillWallet.getSkillWalletIdByOwner(newMemberAddress);

        // get the skills from chainlink
        ditoCredit.addToWhitelist(newMemberAddress);
        ditoCredit.transfer(newMemberAddress, credits);

        skillWalletIds.push(token);
        isMember[newMemberAddress] = true;
        activeMembersCount++;

        emit MemberAdded(newMemberAddress, token, credits);
    }

    function join(uint256 skillWalletTokenId, uint256 credits) public {
        require(
            activeMembersCount <= 24,
            "There are already 24 members, sorry!"
        );

        ISkillWallet skillWallet =
            ISkillWallet(distributedTown.skillWalletAddress());
        address skillWalletAddress = skillWallet.ownerOf(skillWalletTokenId);

        require(!isMember[skillWalletAddress], "You have already joined!");

        // require(
        //     msg.sender == skillWalletAddress,
        //     "Only the skill wallet owner can call this function"
        // );

        isMember[skillWalletAddress] = true;
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

    // TODO: check called only by milestones!
    function transferToTreasury(uint256 amount) public {
        ditoCredit.transfer(address(treasury), amount);
        treasury.returnCreditsIfThresholdReached();
    }

    function getTokenId() public view returns (uint256) {
        uint256 token =
            distributedTown.communityAddressToTokenID(address(this));
        return token;
    }

    function getTemplate() public view returns (uint256) {
        uint256 token =
            distributedTown.communityAddressToTokenID(address(this));
        uint256 templateId = distributedTown.communityToTemplate(token);
        return templateId;
    }

    function getTreasuryBalance() public view returns (uint256) {
        return ditoCredit.balanceOf(address(treasury));
    }

    function getProjects() public view returns (uint256[] memory) {
        return projectIds;
    }

    // Called only by project (or create project from Community.sol (better))
    function addProjectId(uint256 projectId) public {
        projectIds.push(projectId);
    }

    function getProjectTreasuryAddress(uint256 projectId)
        public
        view
        returns (address)
    {
        Projects projects = Projects(distributedTown.projectsAddress());
        return projects.getProjectTreasuryAddress(projectId);
    }
}
