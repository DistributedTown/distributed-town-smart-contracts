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

    mapping(address => uint256) communityToTokenId;
    mapping(uint256 => uint256[]) templateProjects;
    address[] members;
    ProjectTreasury projectTreasury;

    constructor()
        ERC721("DiToProject", 'DITOPRJ')
    {
        projectTreasury = new ProjectTreasury();
    }

    function createProject(string memory _props, uint256 template) public {
        uint256 newProjectId = projectId.current();
        projectId.increment();

        // msg.sender -> Community.sol
        _mint(msg.sender, newProjectId);
        _setTokenURI(newProjectId, _props);

        communityToTokenId[msg.sender] = newProjectId;
        templateProjects[template].push(newProjectId);

        emit ProjectCreated(newProjectId, template, msg.sender);
    }

    function joinProject() public {
        // TODO: verify skill wallet
        members.push(msg.sender);
    }

    function getProjectTreasuryAddress() public view returns(address) {
        return address(projectTreasury);
    }
}
