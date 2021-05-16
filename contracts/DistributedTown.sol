//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Community.sol";
import "./ISkillWallet.sol";
import "./Projects.sol";

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
    address public projectsAddress;

    address public skillWalletAddress;
    ISkillWallet skillWallet;

    // TODO Add JSON Schema base URL
    constructor(string memory _url, address _skillWalletAddress)
        public
        ERC1155(_url)
    {
        // initialize pos values of the 3 templates;
        skillWalletAddress = _skillWalletAddress;
        skillWallet = ISkillWallet(_skillWalletAddress);
        Projects proj = new Projects(_skillWalletAddress);
        projectsAddress = address(proj);
    }

    function createCommunity(
        string calldata communityMetadata,
        uint256 template
    ) public {
        bool isRegistered = skillWallet.isSkillWalletRegistered(msg.sender);
        require(
            isRegistered,
            "Only a registered skill wallet can create a community."
        );

        uint256 skillWalletId = skillWallet.getSkillWalletIdByOwner(msg.sender);
        bool isActive = skillWallet.isSkillWalletActivated(skillWalletId);
        require(
            isActive,
            "Only an active skill wallet can create a community."
        );

        // TODO: add check for validated skills;
        _mint(address(this), template, 1, "");

        uint256 newItemId = communityTokenIds.current();
        communityTokenIds.increment();

        // check if skill wallet is active
        // TODO: add skill wallet address
        Community community = new Community(communityMetadata);
        communityAddressToTokenID[address(community)] = newItemId;
        communityToTemplate[newItemId] = template;
        communities.push(address(community));

        //TODO: add the creator as a community member
        emit CommunityCreated(
            address(community),
            newItemId,
            template,
            msg.sender
        );
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) public override {}

    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) public override {}

    function setApprovalForAll(address _operator, bool _approved)
        public
        override
    {}

    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool)
    {}

    function getCommunities() public view returns (address[] memory) {
        return communities;
    }

    function deployGenesisCommunities() public {
        require(
            communityTokenIds.current() < 3,
            "Genesis communities can be created only once"
        );
        string[3] memory metadata =
            [
                "https://hub.textile.io/ipfs/bafkreick7p4yms7cmwnmfizmcl5e6cdpij4jsl2pkhk5cejn744uwnziny",
                "https://hub.textile.io/ipfs/bafkreid7jtzhuedeggn5welup7iyxchpqodbyam3yfnt4ey4xwnusr3vbe",
                "https://hub.textile.io/ipfs/bafkreibglk3i7c24b2zprsd3jlkzfhxti6rubv3tkif6hu36lz42uwrfki"
            ];
        for (uint256 i = 0; i < 3; i++) {
            uint256 newItemId = communityTokenIds.current();
            communityTokenIds.increment();
            _mint(address(this), i, 1, "");
            Community community = new Community(metadata[i]);
            communityAddressToTokenID[address(community)] = newItemId;
            communityToTemplate[newItemId] = 0;
            communities.push(address(community));
            emit CommunityCreated(
                address(community),
                newItemId,
                i,
                msg.sender
            );
        }
    }
}
