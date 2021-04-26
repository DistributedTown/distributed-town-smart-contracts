//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Community.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract DistributedTown is ERC1155, ERC1155Holder {
    event CommunityCreated(
        address indexed creator,
        uint256 template,
        address communityContract,
        uint256 communityId
    );
    using Counters for Counters.Counter;

    Counters.Counter private communityTokenIds; // to keep track of the number of NFTs we have minted

    mapping(uint256 => address) public nftToCommunityContract;
    mapping(uint256 => uint256) public templateCommunities;
    mapping(uint256 => Types.LatestSkills[]) public templateSkills;

    // TODO Add JSON Schema base URL
    constructor(string memory _url) ERC1155(_url) {
        // initialize pos values of the 3 templates;
    }

    function createCommunity(string calldata communityMetadata, uint256 template)
        public
    {
        _mint(address(this), template, 1, "");

        communityTokenIds.increment();
        uint256 newItemId = communityTokenIds.current();

        // check if skill wallet is active
        templateCommunities[template] = newItemId;
        // TODO: add skill wallet address
        Community community = new Community(communityMetadata, address(0));
        nftToCommunityContract[newItemId] = address(community);

        emit CommunityCreated(
            msg.sender,
            template,
            address(community),
            newItemId
        );
    }

    function transferToMember(address _to, uint256 _value) public {
        
    }

    function transferToCommunity(address _from, uint256 _value) public {
        
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) public override {
        
    }

    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) public override {
        
    }

    function balanceOf(address _owner, uint256 _id)
        public
        view
        override
        returns (uint256)
    {
    }

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids)
        public
        view
        override
        returns (uint256[] memory)
    {
    }

    function setApprovalForAll(address _operator, bool _approved)
        public
        override
    {
        
    }

    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool)
    {
        
    }
}
