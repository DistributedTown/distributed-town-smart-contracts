//SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";

import "./ProjectTreasury.sol";
import "../community/Community.sol";

contract Projects is IERC721Metadata, ERC721 {
    event ProjectCreated(
        uint256 projectId,
        uint256 template,
        address communityAddress
    );

    using Counters for Counters.Counter;

    Counters.Counter private projectId;

    mapping(address => uint256[]) public communityToTokenId;
    mapping(uint256 => uint256[]) public templateProjects;
    mapping(uint256 => address) public projectToTreasury;
    ISkillWallet skillWallet;
    

    constructor(address _skillWalletAddress)
        public ERC721("DiToProject", 'DITOPRJ')
    {
        skillWallet = ISkillWallet(_skillWalletAddress);
    }

    function createProject(string memory _props, address _communityAddress) public {

        Community community = Community(_communityAddress);
        bool isRegistered = skillWallet.isSkillWalletRegistered(msg.sender);
        require(isRegistered, 'Only a registered skill wallet can create a project.');

        uint256 skillWalletId = skillWallet.getSkillWalletIdByOwner(msg.sender);
        bool isActive = skillWallet.isSkillWalletActivated(skillWalletId);
        require(isActive, 'Only an active skill wallet can create a project.');

        bool isMember = community.isMember(msg.sender);
        require(isMember, 'Only a member of the community can create a project.');

        // TODO: import membership ID here.

        uint256 template = community.getTemplate();

        uint256 newProjectId = projectId.current();
        projectId.increment();

        _mint(msg.sender, newProjectId);
        _setTokenURI(newProjectId, _props);

        projectToTreasury[newProjectId] = address(new ProjectTreasury());

        communityToTokenId[_communityAddress].push(newProjectId);
        templateProjects[template].push(newProjectId);

        emit ProjectCreated(newProjectId, template, _communityAddress);
    }

    function getProjectTreasuryAddress(uint256 project) public view returns(address treasury) {
        return projectToTreasury[project];
    }

    function getCommunityProjects(address communityAddress) public view returns(uint256[] memory projectIds) {
        return communityToTokenId[communityAddress];
    }
}
