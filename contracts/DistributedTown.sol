//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155MetadataURI.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./Community.sol";
import "./ISkillWallet.sol";
import "./Projects.sol";
import "./CommonTypes.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract DistributedTown is ERC1155, ERC1155Holder, Ownable {
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
    Projects projects;
    address partnersAgreementContract;

    // TODO Add JSON Schema base URL
    constructor(string memory _url, address _skillWalletAddress)
        public
        ERC1155(_url)
    {
        // initialize pos values of the 3 templates;
        skillWalletAddress = _skillWalletAddress;
        skillWallet = ISkillWallet(_skillWalletAddress);
        projects = new Projects(_skillWalletAddress);
        projectsAddress = address(projects);
    }

    function setPartnersAgreementAddress(address _partnersAgreementContract)
        public
        onlyOwner
    {
        partnersAgreementContract = _partnersAgreementContract;
    }

    function createPartnersCommunity(
        string calldata communityMetadata,
        address owner,
        string memory tokenName,
        string memory tokenSymbol
    ) public {
        require(
            partnersAgreementContract != address(0),
            "Partners agreement contract not set!"
        );
        bool isRegistered = skillWallet.isSkillWalletRegistered(owner);
        require(
            isRegistered,
            "Only a registered skill wallet can create a community."
        );

        uint256 skillWalletId = skillWallet.getSkillWalletIdByOwner(owner);

        _mint(address(this), Types.Template.Other, 1, "");

        communityTokenIds.increment();
        uint256 newItemId = communityTokenIds.current();

        // check if skill wallet is active
        // TODO: add skill wallet address
        Community community =
            new Community(communityMetadata, tokenName, tokenSymbol);
        communityAddressToTokenID[address(community)] = newItemId;
        communityToTemplate[newItemId] = 3;
        communities.push(address(community));

        //TODO: add the creator as a community member
        emit CommunityCreated(address(community), newItemId, 3, owner);
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

        communityTokenIds.increment();
        uint256 newItemId = communityTokenIds.current();

        // check if skill wallet is active
        // TODO: add skill wallet address
        Community community = new Community(communityMetadata, "DiTo", "DITO");
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

    function transferToMember(address _to, uint256 _value) public {}

    function transferToCommunity(address _from, uint256 _value) public {}

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

    function balanceOf(address _owner, uint256 _id)
        public
        view
        override
        returns (uint256)
    {}

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids)
        public
        view
        override
        returns (uint256[] memory)
    {}

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

    function deployGenesisCommunities(uint256 template) public {
        require(
            communityTokenIds.current() < 3,
            "Only 3 genesis communities can be created!"
        );
        require(template >= 0 && template <= 2, 'The genesis communities template must be one of the default ones.');
        string[3] memory metadata =
            [
                "https://hub.textile.io/ipfs/bafkreick7p4yms7cmwnmfizmcl5e6cdpij4jsl2pkhk5cejn744uwnziny",
                "https://hub.textile.io/ipfs/bafkreid7jtzhuedeggn5welup7iyxchpqodbyam3yfnt4ey4xwnusr3vbe",
                "https://hub.textile.io/ipfs/bafkreibglk3i7c24b2zprsd3jlkzfhxti6rubv3tkif6hu36lz42uwrfki"
            ];
        uint256 newItemId = communityTokenIds.current();
        _mint(address(this), template, 1, "");
        Community community = new Community(metadata[template]);
        communityAddressToTokenID[address(community)] = newItemId;
        communityToTemplate[newItemId] = 0;
        communities.push(address(community));
        communityTokenIds.increment();

        emit CommunityCreated(address(community), newItemId, 2, msg.sender);
    }
}
