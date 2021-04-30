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
import "./ISkillWallet.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract DistributedTown is ERC1155, ERC1155Holder {
    event CommunityCreated(
        address communityContract,
        uint256 communityId,
        uint256 template,
        address indexed creator
    );
    using Counters for Counters.Counter;

    Counters.Counter private communityTokenIds; 

    mapping(address => uint256) public communityAddressToTokenID;
    mapping(uint256 => uint256) public communityToTemplate;
    address[] public communities;

    address private skillWalletAddress;
    ISkillWallet skillWallet;

    // TODO Add JSON Schema base URL
    constructor(string memory _url, address _skillWalletAddress) ERC1155(_url) {
        // initialize pos values of the 3 templates;
        skillWalletAddress = _skillWalletAddress;
        skillWallet = ISkillWallet(_skillWalletAddress);
    }

    function createCommunity(string calldata communityMetadata, uint256 template)
        public
    {
        _mint(address(this), template, 1, "");

        bool isRegistered = skillWallet.isSkillWalletRegistered(msg.sender);
        require(isRegistered, 'Only a registered skill wallet can create a community.');

        uint256 skillWalletId = skillWallet.getSkillWalletIdByOwner(msg.sender);
        bool isActive = skillWallet.isSkillWalletActivated(skillWalletId);
        require(isActive, 'Only an active skill wallet can create a community.');

        // TODO: add check for validated skills;

        communityTokenIds.increment();
        uint256 newItemId = communityTokenIds.current();

        // check if skill wallet is active
        // TODO: add skill wallet address
        Community community = new Community(communityMetadata, skillWalletAddress);
        communityAddressToTokenID[address(community)] = newItemId;
        communityToTemplate[newItemId] = template;
        communities.push(address(community));

        emit CommunityCreated(
            address(community),
            newItemId,
            template,
            msg.sender
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

    function getCommunities() public view returns(address[] memory) {
        return communities;
    }
}
