//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";

import "./projects/Projects.sol";
import "./community/Community.sol";
import "./IDistributedTown.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract DistributedTown is ERC1155, ERC1155Holder, IDistributedTown, Ownable {
    event CommunityCreated(
        address communityContract,
        uint communityId,
        uint template,
        address indexed creator
    );
    using Counters for Counters.Counter;

    Counters.Counter private communityTokenIds;

    mapping(address => uint) public communityAddressToTokenID;
    mapping(uint => uint) public communityToTemplate;
    mapping(address => address) public ownerToCommunity;
    mapping(address => bool) public isDiToNativeCommunity;
    address[] public communities;
    address public projectsAddress;
    address public skillWalletAddress;
    address public communityFactoryAddress;
    address addressProvider;
    address partnersRegistryAddress;

    // TODO Add JSON Schema base URL
    constructor(
        string memory _url,
        address _skillWalletAddress,
        address _addrProvider
    ) public ERC1155(_url) {
        // initialize pos values of the 3 templates;
        skillWalletAddress = _skillWalletAddress;
        Projects projects = new Projects(_skillWalletAddress);
        projectsAddress = address(projects);
        addressProvider = _addrProvider;
    }

    function createCommunity(
        string memory communityMetadata,
        uint template,
        uint totalMembersAllowed,
        address owner
    ) public override {
        uint membersCount = 24;
        bool isDiToNative = false;
        if (msg.sender != partnersRegistryAddress) {
            ISkillWallet skillWallet = ISkillWallet(skillWalletAddress);
            bool isRegistered = skillWallet.isSkillWalletRegistered(msg.sender);
            require(isRegistered, "SW not registered.");

            uint skillWalletId = skillWallet.getSkillWalletIdByOwner(
                msg.sender
            );
            bool isActive = skillWallet.isSkillWalletActivated(skillWalletId);
            require(isActive, "SW not active.");
            membersCount = totalMembersAllowed;
            owner = msg.sender;
            isDiToNative = true;
        }

        // TODO: add check for validated skills;
        _mint(address(this), template, 1, "");

        communityTokenIds.increment();
        uint newItemId = communityTokenIds.current();

        address comAddr = address(
            new Community(communityMetadata, addressProvider, membersCount, false, address(0))
        );
        communityAddressToTokenID[comAddr] = newItemId;
        communityToTemplate[newItemId] = template;
        ownerToCommunity[owner] = comAddr;
        isDiToNativeCommunity[comAddr] = isDiToNative;
        communities.push(comAddr);

        //TODO: add the creator as a community member
        emit CommunityCreated(comAddr, newItemId, template, owner);
    }

    function migrateCommunity(address _community) public {
        require(ownerToCommunity[msg.sender] == _community, "Not community owner");

        address newComAddr = address(
            new Community("", address(0), 0, false, _community)
        );

        Community(_community).markAsMigrated(newComAddr);
        Community(newComAddr).migrateData();

        uint256 comId = communityAddressToTokenID[_community];
        communities[comId] = newComAddr;
        delete communityAddressToTokenID[_community];
        communityAddressToTokenID[newComAddr] = comId;
        ownerToCommunity[msg.sender] = newComAddr;
        isDiToNativeCommunity[newComAddr] = isDiToNativeCommunity[_community];
        delete isDiToNativeCommunity[_community];
    }

    function setPartnersRegistryAddress(address _partnersRegistryAddress)
        public
        override
        onlyOwner
    {
        partnersRegistryAddress = _partnersRegistryAddress;
    }

    function getCommunities() public view override returns (address[] memory) {
        return communities;
    }

    function getCommunityByOwner(address owner)
        public
        view
        override
        returns (address)
    {
        return ownerToCommunity[owner];
    }

    function deployGenesisCommunities(uint template)
        public
        override
        onlyOwner
    {
        require(communityTokenIds.current() < 3, "Only the first 3 communities can be deployed as Genesis ones.");
        require(template >= 0 && template <= 2, "Invalid templateID.");
        string[3] memory metadata = [
            "https://hub.textile.io/ipfs/bafkreick7p4yms7cmwnmfizmcl5e6cdpij4jsl2pkhk5cejn744uwnziny",
            "https://hub.textile.io/ipfs/bafkreid7jtzhuedeggn5welup7iyxchpqodbyam3yfnt4ey4xwnusr3vbe",
            "https://hub.textile.io/ipfs/bafkreibglk3i7c24b2zprsd3jlkzfhxti6rubv3tkif6hu36lz42uwrfki"
        ];
        uint newItemId = communityTokenIds.current();
        _mint(address(this), template, 1, "");
        Community community = new Community(
            metadata[template],
            addressProvider,
            24,
            true,
            address(0)
        );
        address comAddr = address(community);

        communityAddressToTokenID[comAddr] = newItemId;
        communityToTemplate[newItemId] = 0;
        communities.push(comAddr);
        isDiToNativeCommunity[comAddr] = true;
        communityTokenIds.increment();

        emit CommunityCreated(address(0), newItemId, 2, msg.sender);
    }
}
