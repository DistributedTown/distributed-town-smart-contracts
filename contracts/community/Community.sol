//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "skill-wallet/contracts/main/ISkillWallet.sol";
import "skill-wallet/contracts/main/utils/RoleUtils.sol";

import "./ICommunity.sol";
import "./Treasury.sol";
import "./TreasuryFactory.sol";
import "./DITOCredit.sol";
import "./DITOCreditFactory.sol";
import "../gigs/Gigs.sol";
import "../gigs/GigsFactory.sol";
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
    //IN_PROGRESS - data migration TO this community is in progress;
    //MIGRATED - community is migrated to new version (ownerships are transfered and data can be migrated to new version)
    uint256 public creditsToTransfer;

    uint256 public version;

    STATUS public status;
    address public migratedFrom;
    address public migratedTo;

    string public metadataUri;

    uint16 public activeMembersCount;
    uint256 public scarcityScore;
    uint256[] public skillWalletIds;
    uint256 public tokenId;
    address[] public memberAddresses;

    address public distributedTownAddr;
    address public ditoCreditsAddr;
    address public treasuryAddr;
    address public gigsAddr;
    address public ditoCreditsHolder;
    uint256[] public projectIds;
    uint256 public totalMembersAllowed;
    uint256 public rolesCount;
    mapping (RoleUtils.Roles => uint256) public roleMembershipsLeft;
    bool public claimableSkillWallets;

    // add JSON Schema base URL
    constructor(
        address _distributedTownAddr,
        bool _isDitoNative,
        string memory _url,
        address _addrProvider,
        uint256 _totalMembersAllowed,
        uint256 _rolesCount,
        bool _claimableSkillWallets,
        address _migrateFrom,
        uint256 _version
    ) public {
        if (_migrateFrom == address(0)) {
            require(
                _rolesCount == 2 || _rolesCount == 3,
                "Only 2 or 3 roles accepted"
            );
            require(_totalMembersAllowed >= _rolesCount, "Total members are less than roles"); 

            metadataUri = _url;
            distributedTownAddr = _distributedTownAddr;

            AddressProvider provider = AddressProvider(_addrProvider);
            ditoCreditsHolder = address(new DiToCreditCommunityHolder());
            DiToCreditsFactory creditsFactory = DiToCreditsFactory(
                provider.ditoTokenFactory()
            );
            ditoCreditsAddr = creditsFactory.deploy(ditoCreditsHolder);
            treasuryAddr = TreasuryFactory(provider.treasuryFactory()).deploy(
                ditoCreditsAddr
            );
            gigsAddr = GigsFactory(provider.gigsFactory()).deploy();
            
            totalMembersAllowed = _totalMembersAllowed;
            rolesCount = _rolesCount;
            uint256 totalroleMemberships = 0;
            uint256[3] memory roleCoefs = RoleUtils.getRolesCoefs(_rolesCount);
            for (uint256 i = 0; i < _rolesCount; i++) {
                //probably use math lib here or have limit for max totalMembersAllowed
                uint256 roleMemberships = _totalMembersAllowed * roleCoefs[i] / 100;
                if (roleMemberships == 0) roleMemberships = 1;
                roleMembershipsLeft[RoleUtils.Roles(i + 1)] = roleMemberships;
                totalroleMemberships += roleMemberships;
            }

            uint256 leftoverMemberships = _totalMembersAllowed - totalroleMemberships;
            if (leftoverMemberships > 0) {
                roleMembershipsLeft[RoleUtils.Roles.ROLE1]++;
                if (leftoverMemberships == 2) roleMembershipsLeft[RoleUtils.Roles.ROLE2]++;
            }
            
            claimableSkillWallets = _claimableSkillWallets;

            if (_isDitoNative) {
                creditsToTransfer = 2000 * 1e18;
            } else {
                creditsToTransfer = 0;
            }
            _joinNewMember(_distributedTownAddr, _url, 1, creditsToTransfer);

            status = STATUS.ACTIVE;
        } else {
            Community currentCommunity = Community(_migrateFrom);
            require(
                currentCommunity.status() == STATUS.ACTIVE,
                "Community not active"
            );

            metadataUri = currentCommunity.metadataUri();
            distributedTownAddr = currentCommunity.distributedTownAddr();
            ditoCreditsHolder = currentCommunity.ditoCreditsHolder();
            ditoCreditsAddr = currentCommunity.ditoCreditsAddr();
            treasuryAddr = currentCommunity.treasuryAddr();
            gigsAddr = currentCommunity.gigsAddr();
            totalMembersAllowed = currentCommunity.totalMembersAllowed();
            claimableSkillWallets = currentCommunity.claimableSkillWallets();
            creditsToTransfer = currentCommunity.creditsToTransfer();

            rolesCount = currentCommunity.rolesCount();
            roleMembershipsLeft[RoleUtils.Roles(1)] = currentCommunity.roleMembershipsLeft(RoleUtils.Roles(1));
            roleMembershipsLeft[RoleUtils.Roles(2)] = currentCommunity.roleMembershipsLeft(RoleUtils.Roles(2));
            if (rolesCount == 3) roleMembershipsLeft[RoleUtils.Roles(3)] = currentCommunity.roleMembershipsLeft(RoleUtils.Roles(3));

            status = STATUS.IN_PROGRESS;
            migratedFrom = _migrateFrom;
        }

        version = _version;
    }

    function migrateData() public {
        require(status == STATUS.IN_PROGRESS, "Migration is not in progress");

        Community currentCommunity = Community(migratedFrom);
        require(
            currentCommunity.status() == STATUS.MIGRATED,
            "Community not migrated"
        );

        memberAddresses = currentCommunity.getMemberAddresses();
        skillWalletIds = currentCommunity.getMembers();
        projectIds = currentCommunity.getProjects();

        activeMembersCount = currentCommunity.activeMembersCount();
        scarcityScore = currentCommunity.scarcityScore();
        tokenId = currentCommunity.tokenId();

        status = STATUS.ACTIVE;
    }

    //for original community (that is being migrated) to finalize migration
    function markAsMigrated(address _migratedTo) public {
        require(msg.sender == distributedTownAddr, "Caller not dito");
        require(status == STATUS.ACTIVE, "Community not active");
        require(
            Community(_migratedTo).status() == STATUS.IN_PROGRESS,
            "Migration is not in progress"
        );

        DITOCredit(ditoCreditsAddr).transferOwnership(_migratedTo);
        Treasury(treasuryAddr).setCommunityAddress(_migratedTo);
        Gigs(gigsAddr).setCommunityAddress(_migratedTo);

        migratedTo = _migratedTo;
        status = STATUS.MIGRATED;
    }

    function joinNewMember(
        string memory uri,
        uint256 role,
        uint256 credits
    ) public override {
        if (creditsToTransfer == 0) {
            credits = 0;
        }
        _joinNewMember(msg.sender, uri, role, credits);
    }

    // check if it's called only from deployer.
    function _joinNewMember(
        address _member,
        string memory uri,
        uint256 role,
        uint256 credits
    ) private {
        require(
            activeMembersCount <= totalMembersAllowed,
            "No free spots left!"
        );

        require(roleMembershipsLeft[RoleUtils.Roles(role)] > 0, "All role positions are taken");

        require(!isMember(_member), "Already a member");

        // the DiTo contract can only join the treasury as a member of the community
        address newMemberAddress = _member == distributedTownAddr
            ? treasuryAddr
            : _member;

        ISkillWallet skillWallet = ISkillWallet(
            DistributedTown(distributedTownAddr).skillWalletAddress()
        );

        bool claimableSW = address(this) == _member
            ? false
            : claimableSkillWallets;
        skillWallet.create(
            newMemberAddress,
            uri,
            RoleUtils.Roles(role),
            claimableSW
        );

        uint256 token = 0;
        if (claimableSkillWallets)
            token = skillWallet.getClaimableSkillWalletId(newMemberAddress);
        else token = skillWallet.getSkillWalletIdByOwner(newMemberAddress);

        DITOCredit(ditoCreditsAddr).addToWhitelist(newMemberAddress);

        if (credits > 0) {
            DITOCredit(ditoCreditsAddr).operatorSend(
                ditoCreditsHolder,
                newMemberAddress,
                credits,
                "",
                ""
            );
        }

        skillWalletIds.push(token);
        memberAddresses.push(newMemberAddress);
        activeMembersCount++;
        roleMembershipsLeft[RoleUtils.Roles(role)]--;

        emit MemberAdded(newMemberAddress, token, credits);
    }

    function getMembers() public view override returns (uint256[] memory) {
        return skillWalletIds;
    }

    function getMemberAddresses()
        public
        view
        override
        returns (address[] memory)
    {
        return memberAddresses;
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
        uint256 token = DistributedTown(distributedTownAddr)
            .communityAddressToTokenID(address(this));
        return token;
    }

    function getTemplate() public view override returns (uint256) {
        uint256 token = DistributedTown(distributedTownAddr)
            .communityAddressToTokenID(address(this));
        uint256 templateId = DistributedTown(distributedTownAddr)
            .communityToTemplate(token);
        return templateId;
    }

    function getTreasuryBalance() public view override returns (uint256) {
        return DITOCredit(ditoCreditsAddr).balanceOf(treasuryAddr);
    }

    function balanceOf(address member) public view override returns (uint256) {
        require(
            isMember(member) || ditoCreditsHolder == member,
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

    function getSkillWalletAddress() public override returns (address) {
        return DistributedTown(distributedTownAddr).skillWalletAddress();
    }

    //TODO check if the user has the permissions
    function setMetadataUri(string calldata uri) public override {
        metadataUri = uri;
    }

    function isMember(address member) public view override returns (bool) {
        ISkillWallet skillWallet = ISkillWallet(
            DistributedTown(distributedTownAddr).skillWalletAddress()
        );

        uint256 balance = skillWallet.balanceOf(member);
        if (balance == 0) return false;
        uint256 skillWalletID = skillWallet.getSkillWalletIdByOwner(member);
        if (skillWalletID > 0) {
            return
                skillWallet.getActiveCommunity(skillWalletID) == address(this);
        } else {
            return false;
        }
    }
}
