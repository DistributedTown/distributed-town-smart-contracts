//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";

import "./community/Community.sol";
import "./community/CommunityFactory.sol";
import "./IDistributedTown.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract DistributedTown is ERC1155Upgradeable, ERC1155HolderUpgradeable, IDistributedTown, OwnableUpgradeable {
    event CommunityCreated(
        address communityContract,
        uint communityId,
        uint template,
        address indexed creator
    );
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private communityTokenIds;

    mapping(address => uint) public communityAddressToTokenID;
    mapping(uint => uint) public communityToTemplate;
    mapping(address => address) public ownerToCommunity;
    mapping(address => bool) public isDiToNativeCommunity;
    address[] public communities;
    address public skillWalletAddress;
    address public communityFactoryAddress;
    address addressProvider;
    address partnersRegistryAddress;

    // TODO Add JSON Schema base URL
    function initialize(
         string memory _url,
        address _skillWalletAddress,
        address _addrProvider,
        address _communityFactory
    ) public initializer {
        __Ownable_init();
        __ERC1155_init(_url);
        // initialize pos values of the 3 templates;
        skillWalletAddress = _skillWalletAddress;
        addressProvider = _addrProvider;
        communityFactoryAddress = _communityFactory;
        //init slots fro genesis communities
        for (uint256 i = 0; i <=2; i++) {
            communities.push(address(0));
            communityTokenIds.increment();
        }
    }

    function updateCommunityFactory (address _newFactory) public onlyOwner {
        require(CommunityFactory(communityFactoryAddress).version() < CommunityFactory(_newFactory).version(), "Not a new version");

        communityFactoryAddress = _newFactory;
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

        address comAddr = CommunityFactory(communityFactoryAddress).createCommunity(isDiToNative, communityMetadata, addressProvider, membersCount, false, address(0));
        communityAddressToTokenID[comAddr] = newItemId;
        communityToTemplate[newItemId] = template;
        ownerToCommunity[owner] = comAddr;
        isDiToNativeCommunity[comAddr] = isDiToNative;
        communities.push(comAddr);

        //TODO: add the creator as a community member
        emit CommunityCreated(comAddr, newItemId, template, owner);
    }

    function migrateCommunity(address _community) public {
        uint256 comId = communityAddressToTokenID[_community];

        if (comId > 2) {
            require(ownerToCommunity[msg.sender] == _community, "Not community owner");
        } else {
            require(msg.sender == owner(), "Not community owner");
        }

        require(CommunityFactory(communityFactoryAddress).version() > Community(_community).version(), "Already latest version");

        address newComAddr = CommunityFactory(communityFactoryAddress).createCommunity(false, "", address(0), 0, false, _community);

        Community(_community).markAsMigrated(newComAddr);
        Community(newComAddr).migrateData();

        communities[comId] = newComAddr;
        delete communityAddressToTokenID[_community];
        communityAddressToTokenID[newComAddr] = comId;
        if (comId > 2) {
            ownerToCommunity[msg.sender] = newComAddr;
        }
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
        require(template >= 0 && template <= 2, "Invalid templateID.");
        require(communities[template] == address(0), "Genesis community for template already deployed");
        
        string[3] memory metadata = [
            "https://hub.textile.io/ipfs/bafkreick7p4yms7cmwnmfizmcl5e6cdpij4jsl2pkhk5cejn744uwnziny",
            "https://hub.textile.io/ipfs/bafkreid7jtzhuedeggn5welup7iyxchpqodbyam3yfnt4ey4xwnusr3vbe",
            "https://hub.textile.io/ipfs/bafkreibglk3i7c24b2zprsd3jlkzfhxti6rubv3tkif6hu36lz42uwrfki"
        ];

        _mint(address(this), template, 1, "");
        address comAddr =  CommunityFactory(communityFactoryAddress).createCommunity(
            true,
            metadata[template],
            addressProvider,
            24,
            true,
            address(0)
        );

        communityAddressToTokenID[comAddr] = template;
        communityToTemplate[template] = template;
        communities[template] = comAddr;
        isDiToNativeCommunity[comAddr] = true;

        emit CommunityCreated(address(0), template, template, msg.sender);
    }
}
