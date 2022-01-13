//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "skill-wallet/contracts/main/utils/RoleUtils.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

interface ICommunity {
    event MemberAdded(
        address indexed _member,
        uint256 _skillWalletTokenId,
        uint256 _transferredTokens
    );
    event MemberLeft(address indexed _member);

    enum STATUS {
        ACTIVE,
        IN_PROGRESS,
        MIGRATED
    }

    // check if it's called only from deployer.
    function joinNewMember(
        string memory uri,
        uint256 role,
        uint256 credits
    ) external;

    //function rolesCount() external view returns (uint256);
    //function roleMembershiftsLeft(RoleUtils.Roles) external view returns (uint256);

    function getMembers() external view returns (uint256[] memory);
    
    function getMemberAddresses() external view returns (address[] memory);

    // TODO: check called only by milestones!
    function transferToCommunity(address from, uint256 amount) external;

    function getTokenId() external view returns (uint256);

    function getTemplate() external view returns (uint256);

    function getTreasuryBalance() external view returns (uint256);

    function getProjects() external view returns (uint256[] memory);

    // Called only by project (or create project from Community.sol (better))
    function addProjectId(uint256 projectId) external;

    function balanceOf(address member) external view returns (uint256);

    function transferCredits(address to, uint256 amount) external;

    function getSkillWalletAddress() external returns(address);

    function setMetadataUri(string calldata uri) external;
    
    function isMember(address member) external view returns(bool);
}
