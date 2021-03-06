//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "skill-wallet/contracts/main/ISkillWallet.sol";

import "./ICommunity.sol";
import "./Treasury.sol";
import "./TreasuryFactory.sol";
import "./DITOCredit.sol";
import "./DITOCreditFactory.sol";
import "../gigs/Gigs.sol";
import "../gigs/GigsFactory.sol";
// import "../CommonTypes.sol";
import "../DistributedTown.sol";
import "../projects/Projects.sol";
import "../AddressProvider.sol";
import "./DiToCreditCommunityHolder.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract Community is ICommunity {
    string public metadataUri;

    uint16 public activeMembersCount;
    uint256 public scarcityScore;
    uint256[] public skillWalletIds;
    uint256 public tokenId;
    mapping(address => bool) public isMember;

    address distributedTownAddr;
    address public ditoCreditsAddr;
    address public treasuryAddr;
    address public gigsAddr;
    address public ditoCreditsHolder;
    uint256[] projectIds;
    uint totalMembersAllowed;

    // add JSON Schema base URL
    constructor(string memory _url, address _addrProvider, uint _totalMembersAllowed) public {
        metadataUri = _url;
        distributedTownAddr = msg.sender;

        AddressProvider provider = AddressProvider(_addrProvider);
        ditoCreditsHolder = address(new DiToCreditCommunityHolder());
        DiToCreditsFactory creditsFactory =
            DiToCreditsFactory(provider.ditoTokenFactory());
        ditoCreditsAddr = creditsFactory.deploy(ditoCreditsHolder);
        treasuryAddr = TreasuryFactory(provider.treasuryFactory()).deploy(
            ditoCreditsAddr
        );
        gigsAddr = GigsFactory(provider.gigsFactory()).deploy();
        totalMembersAllowed = _totalMembersAllowed;
        joinNewMember(0, 0, 0, 0, 0, 0, _url, 2000 * 1e18);
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
    ) public override {
        require(
            activeMembersCount <= totalMembersAllowed,
            "No free spots left!"
        );
        require(!isMember[msg.sender], "Already a member");

        // the DiTo contract can only join the treasury as a member of the community
        address newMemberAddress =
            msg.sender == distributedTownAddr ? treasuryAddr : msg.sender;

        Types.SkillSet memory skillSet =
            Types.SkillSet(
                Types.Skill(displayStringId1, level1),
                Types.Skill(displayStringId2, level2),
                Types.Skill(displayStringId3, level3)
            );

        ISkillWallet skillWallet =
            ISkillWallet(
                DistributedTown(distributedTownAddr).skillWalletAddress()
            );
        skillWallet.create(newMemberAddress, skillSet, uri);
        uint256 token = skillWallet.getSkillWalletIdByOwner(newMemberAddress);

        // get the skills from chainlink
        DITOCredit(ditoCreditsAddr).addToWhitelist(newMemberAddress);
        DITOCredit(ditoCreditsAddr).operatorSend(
            ditoCreditsHolder,
            newMemberAddress,
            credits,
            "",
            ""
        );

        skillWalletIds.push(token);
        isMember[newMemberAddress] = true;
        activeMembersCount++;

        emit MemberAdded(newMemberAddress, token, credits);
    }

    function join(uint256 skillWalletTokenId, uint256 credits) public override {
        require(
            activeMembersCount <= totalMembersAllowed,
            "No free spots left!"
        );

        ISkillWallet skillWallet =
            ISkillWallet(
                DistributedTown(distributedTownAddr).skillWalletAddress()
            );
        address skillWalletAddress = skillWallet.ownerOf(skillWalletTokenId);

        require(!isMember[skillWalletAddress], "You have already joined!");

        // require(
        //     msg.sender == skillWalletAddress,
        //     "Only the skill wallet owner can call this function"
        // );

        isMember[skillWalletAddress] = true;
        skillWalletIds[activeMembersCount] = skillWalletTokenId;
        // skillWalletIds[1] = 123;
        activeMembersCount++;

        DITOCredit(ditoCreditsAddr).addToWhitelist(skillWalletAddress);
        DITOCredit(ditoCreditsAddr).transfer(skillWalletAddress, credits);

        emit MemberAdded(skillWalletAddress, skillWalletTokenId, credits);
    }

    function leave(address memberAddress) public override {
        emit MemberLeft(memberAddress);
    }

    function getMembers() public view override returns (uint256[] memory) {
        return skillWalletIds;
    }

    // TODO: check called only by milestones!
    function transferCredits(address to, uint256 amount) public override {
        // if milestones
        if (msg.sender == address(0)) {
            DITOCredit(ditoCreditsAddr).transfer(treasuryAddr, amount);
            Treasury(treasuryAddr).returnCreditsIfThresholdReached();
        }
        // if gigs
        else if (msg.sender == gigsAddr) {
            DITOCredit(ditoCreditsAddr).operatorSend(
                ditoCreditsHolder,
                to,
                amount,
                "",
                ""
            );
        }
    }

    function transferToCommunity(address from, uint256 amount) public override {
        require(
            msg.sender == gigsAddr,
            "The caller must be the gigs contract."
        );
        DITOCredit(ditoCreditsAddr).operatorSend(
            from,
            ditoCreditsHolder,
            amount,
            "",
            ""
        );
    }

    function getTokenId() public view override returns (uint256) {
        uint256 token =
            DistributedTown(distributedTownAddr).communityAddressToTokenID(
                address(this)
            );
        return token;
    }

    function getTemplate() public view override returns (uint256) {
        uint256 token =
            DistributedTown(distributedTownAddr).communityAddressToTokenID(
                address(this)
            );
        uint256 templateId =
            DistributedTown(distributedTownAddr).communityToTemplate(token);
        return templateId;
    }

    function getTreasuryBalance() public view override returns (uint256) {
        return DITOCredit(ditoCreditsAddr).balanceOf(treasuryAddr);
    }

    function balanceOf(address member) public view override returns (uint256) {
        require(
            isMember[member] || ditoCreditsHolder == member,
            "Not a member of the community"
        );
        return DITOCredit(ditoCreditsAddr).balanceOf(member);
    }

    function getProjects() public view override returns (uint256[] memory) {
        return projectIds;
    }

    // Called only by project (or create project from Community.sol (better))
    function addProjectId(uint256 projectId) public override {
        projectIds.push(projectId);
    }

    function getProjectTreasuryAddress(uint256 projectId)
        public
        view
        override
        returns (address)
    {
        Projects projects =
            Projects(DistributedTown(distributedTownAddr).projectsAddress());
        return projects.getProjectTreasuryAddress(projectId);
    }

    function getSkillWalletAddress() public override returns(address) {
        return DistributedTown(distributedTownAddr).skillWalletAddress();
    }
}
