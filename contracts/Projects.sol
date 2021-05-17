//SPDX-License-Identifier: MIT

pragma solidity ^0.6.10;

pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ProjectTreasury.sol";
import "./Community.sol";
import "./ISkillWallet.sol";

contract Projects is IERC721Metadata, ERC721 {
    event ProjectCreated(
        uint256 projectId,
        uint256 template,
        address communityAddress
    );

    using Counters for Counters.Counter;

    Counters.Counter private projectId;

    mapping(address => uint256[]) communityToTokenId;
    mapping(uint256 => uint256[]) templateProjects;
    mapping(uint256 => uint256[]) members;
    mapping(uint256 => address) public projectToTreasury;
    ISkillWallet skillWallet;
    

    constructor(address _skillWalletAddress)
        public ERC721("DiToProject", 'DITOPRJ')
    {
        skillWallet = ISkillWallet(_skillWalletAddress);
    }

    function createProject(string memory _props, address _communityAddress, address creator) public {

        Community community = Community(_communityAddress);
        bool isRegistered = skillWallet.isSkillWalletRegistered(creator);
        require(isRegistered, 'Only a registered skill wallet can create a project.');

        uint256 skillWalletId = skillWallet.getSkillWalletIdByOwner(creator);
        bool isActive = skillWallet.isSkillWalletActivated(skillWalletId);
        require(isActive, 'Only an active skill wallet can create a project.');

        bool isMember = community.isMember(creator);
        require(isMember, 'Only a member of the community can create a project.');

        uint256 template = community.getTemplate();

        uint256 newProjectId = projectId.current();
        projectId.increment();

        _mint(creator, newProjectId);
        _setTokenURI(newProjectId, _props);

        community.addProjectId(newProjectId);
        projectToTreasury[newProjectId] = address(new ProjectTreasury());

        communityToTokenId[_communityAddress].push(newProjectId);
        templateProjects[template].push(newProjectId);

        emit ProjectCreated(newProjectId, template, _communityAddress);
    }

    // TODO: check if the community is calling this function
    function getProjectTreasuryAddress(uint256 projectId) public view returns(address) {
        return projectToTreasury[projectId];
    }

    function getCommunityProjects(address communityAddress) public view returns(uint256[] memory projectIds) {
        return communityToTokenId[communityAddress];
    }
}
