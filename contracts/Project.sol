//SPDX-License-Identifier: MIT

pragma solidity ^0.7.4;

pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Project is IERC721Metadata, ERC721 {
    event ProjectCreated(
        uint256 projectId,
        uint256 template,
        address communityAddress
    );

    using Counters for Counters.Counter;

    Counters.Counter private projectId;
    mapping(address => uint256) communityToTokenId;
    mapping(uint256 => address) tokenIdToCommunity;
    mapping(uint256 => uint256) tokenIdToTemplate;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {}

    function createProject(string memory _props, uint256 template) public {
        uint256 newProjectId = projectId.current();

        // msg.sender -> Community.sol
        _mint(msg.sender, newProjectId);
        _setTokenURI(newProjectId, _props);

        communityToTokenId[msg.sender] = newProjectId;
        tokenIdToCommunity[newProjectId] = msg.sender;
        tokenIdToTemplate[newProjectId] = template;

        emit ProjectCreated(newProjectId, template, msg.sender);
    }
}
