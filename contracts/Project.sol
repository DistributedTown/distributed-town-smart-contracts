//SPDX-License-Identifier: MIT

pragma solidity ^0.7.4;

pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ProjectTreasury.sol";

contract Project is IERC721Metadata, ERC721 {
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

    ProjectTreasury projectTreasury;

    constructor()
        ERC721("DiToProject", 'DITOPRJ')
    {
        projectTreasury = new ProjectTreasury();
    }

    function createProject(string memory _props, uint256 template, address communityAddress) public {
        uint256 newProjectId = projectId.current();
        projectId.increment();

        _mint(communityAddress, newProjectId);
        _setTokenURI(newProjectId, _props);

        communityToTokenId[communityAddress].push(newProjectId);
        templateProjects[template].push(newProjectId);

        emit ProjectCreated(newProjectId, template, communityAddress);
    }

    // function joinProject() public {
    //     // TODO: verify skill wallet
    //     members.push(msg.sender);
    // }

    function getProjectTreasuryAddress() public view returns(address) {
        return address(projectTreasury);
    }

    function getCommunityProjects(address communityAddress) public view returns(uint256[] memory projectIds) {
        return communityToTokenId[communityAddress];
    }
}
