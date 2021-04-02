//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";

import "./Membership.sol";
import "./SkillsStruct.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract Community is ERC1155, ERC1155Holder {
    using SafeMath for uint256;
    address SKILL_WALLET_ADDRESS = address(0);

    enum TokenType {DiToCredit, Community}

    Membership membership;
    IERC721 skillWallet;

    address communityCreator;
    uint16 activeMembersCount;
    mapping(uint256 => bool) activeSkillWallets;

    /**
     * @dev emitted when a member is added
     * @param _member the user which just joined the community
     * @param _transferredTokens the amount of transferred dito tokens on join
     **/
    event MemberAdded(
        address _member,
        uint256 _skillWalletTokenId,
        uint256 _transferredTokens
    );
    event MemberLeft(address _member);

    // add JSON Schema base URL
    constructor(string memory _url) public ERC1155(_url) {
        skillWallet = IERC721(SKILL_WALLET_ADDRESS);

        // Fungible DiToCredits ERC-20 token
        _mint(address(this), uint256(TokenType.DiToCredit), 96000 * 1e18, "");
        // Non-Fungible Community template NFT token
        _mint(address(this), uint256(TokenType.Community), 1, "");
    }

    function joinNewMember(Types.SkillSet skillSet, uint64 credits) public {
        require(
            activeMembersCount <= 24,
            "There are already 24 members, sorry!"
        );

        address tokenId = skillWallet.create(msg.sender, skillSet);

        activeSkillWallets[tokenId] = true;
        activeMembersCount++;

        // get the skills from chainlink
        transferToMember(msg.sender, credits);
        emit MemberAdded(skillWalletAddress, skillWalletTokenId, credits);
    }

    function join(uint256 skillWalletTokenId, uint64 credits) public {
        require(
            activeMembersCount <= 24,
            "There are already 24 members, sorry!"
        );
        require(
            !activeSkillWallets[skillWalletTokenId],
            "You have already joined!"
        );

        address skillWalletAddress = skillWallet.ownerOf(skillWalletTokenId);

        require(
            msg.sender == skillWalletAddress,
            "Only the skill wallet owner can call this function"
        );

        activeSkillWallets[skillWalletTokenId] = true;
        activeMembersCount++;

        transferToMember(skillWalletAddress, credits);
        emit MemberAdded(skillWalletAddress, skillWalletTokenId, credits);
    }

    function leave(address memberAddress) public {
        emit MemberLeft(memberAddress);
    }

    function transferToMember(address _to, uint256 _value) public {
        super.safeTransferFrom(address(this), _to, 0, _value, "");
    }

    function transferToCommunity(address _from, uint256 _value) public {
        super.safeTransferFrom(_from, address(this), 0, _value, "");
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) public override {
        require(
            _id == uint256(TokenType.DiToCredit),
            "Community NFT can't be trasfered"
        );

        super.safeTransferFrom(_from, _to, _id, _value, _data);
    }

    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) public override {
        require(
            !contains(_ids, uint256(TokenType.Community)),
            "Community NFT can't be trasfered"
        );

        super.safeBatchTransferFrom(_from, _to, _ids, _values, _data);
    }

    function balanceOf(address _owner, uint256 _id)
        public
        view
        override
        returns (uint256)
    {
        require(
            _id == uint256(TokenType.DiToCredit),
            "Community NFT doesn't have a balance."
        );
        super.balanceOf(_owner, _id);
    }

    function diToCreditsBalance(address _owner) public view returns (uint256) {
        super.balanceOf(_owner, uint256(TokenType.DiToCredit));
    }

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids)
        public
        view
        override
        returns (uint256[] memory)
    {
        require(
            !contains(_ids, uint256(TokenType.Community)),
            "Community NFT can't be trasfered"
        );

        super.balanceOfBatch(_owners, _ids);
    }

    function setApprovalForAll(address _operator, bool _approved)
        public
        override
    {
        super.setApprovalForAll(_operator, _approved);
    }

    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool)
    {
        super.isApprovedForAll(_owner, _operator);
    }

    function contains(uint256[] memory arr, uint256 element)
        internal
        view
        returns (bool)
    {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == element) return true;
        }
        return false;
    }
}
