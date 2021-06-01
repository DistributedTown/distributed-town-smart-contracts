//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./projects/Projects.sol";
import "./community/Community.sol";
import "./skillWallet/ISkillWallet.sol";

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
    address public communityFactoryAddress;
    address addressProvider;

    // TODO Add JSON Schema base URL
    constructor(string memory _url, address _skillWalletAddress, address _addrProvider)
        public
        ERC1155(_url)
    {
        // initialize pos values of the 3 templates;
        skillWalletAddress = _skillWalletAddress;
        Projects projects = new Projects(_skillWalletAddress);
        projectsAddress = address(projects);
        addressProvider = _addrProvider;
    }

    function createCommunity(
        string calldata communityMetadata,
        uint256 template
    ) public {
        ISkillWallet skillWallet = ISkillWallet(skillWalletAddress);
        bool isRegistered = skillWallet.isSkillWalletRegistered(msg.sender);
        require(
            isRegistered,
            "SW not registered."
        );

        uint256 skillWalletId = skillWallet.getSkillWalletIdByOwner(msg.sender);
        bool isActive = skillWallet.isSkillWalletActivated(skillWalletId);
        require(
            isActive,
            "SW not active."
        );

        // TODO: add check for validated skills;
        _mint(address(this), template, 1, "");

        communityTokenIds.increment();
        uint256 newItemId = communityTokenIds.current();

        // check if skill wallet is active
        // TODO: add skill wallet address
        address comAddr = address(new Community(communityMetadata, addressProvider));
        communityAddressToTokenID[comAddr] = newItemId;
        communityToTemplate[newItemId] = template;
        communities.push(comAddr);

        //TODO: add the creator as a community member
        emit CommunityCreated(
            comAddr,
            newItemId,
            template,
            msg.sender
        );
    }

    function getCommunities() public view returns (address[] memory) {
        return communities;
    }

    function deployGenesisCommunities(uint256 template) public {
        require(
            communityTokenIds.current() < 3,
            ""
        );
        require(template >= 0 && template <= 2, '');
        string[3] memory metadata =
            [
                "https://hub.textile.io/ipfs/bafkreick7p4yms7cmwnmfizmcl5e6cdpij4jsl2pkhk5cejn744uwnziny",
                "https://hub.textile.io/ipfs/bafkreid7jtzhuedeggn5welup7iyxchpqodbyam3yfnt4ey4xwnusr3vbe",
                "https://hub.textile.io/ipfs/bafkreibglk3i7c24b2zprsd3jlkzfhxti6rubv3tkif6hu36lz42uwrfki"
            ];
        uint256 newItemId = communityTokenIds.current();
        _mint(address(this), template, 1, "");
        address comAddr = address(new Community(metadata[template], addressProvider));

        communityAddressToTokenID[comAddr] = newItemId;
        communityToTemplate[newItemId] = 0;
        communities.push(comAddr);
        communityTokenIds.increment();

        emit CommunityCreated(comAddr, newItemId, 2, msg.sender);
    }
}
