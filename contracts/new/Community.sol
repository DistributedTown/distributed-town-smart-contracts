//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import "./WadRayMath.sol";
import "./Membership.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract Community is ERC1155 {
    using SafeMath for uint256;

    uint256 public constant DITO_CREDITS_ID = 0;
    uint256 public constant COMMUNITY_TEMPLATE_ID = 1;
    mapping(address => bool) public whitelist;

    // add JSON Schema
    constructor() public ERC1155("") {
        // Fungible DiToCredits ERC-20 token
        _mint(msg.sender, DITO_CREDITS_ID, 96000 * 1e18, "");
        // Non-Fungible Community template NFT token
        _mint(msg.sender, COMMUNITY_TEMPLATE_ID, 1, "");
        // _operatorApprovals[msg.sender][msg.sender] = approved;
    }

    modifier onlyInWhitelist() {
        require(whitelist[msg.sender], "");
        _;
    }
    
    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    ) public override onlyInWhitelist {
        require(
            _id != COMMUNITY_TEMPLATE_ID,
            "Community NFT can't be trasfered"
        );

        // check if they're both members

        super.safeTransferFrom(_from, _to, _id, _value, _data);
    }

    function safeBatchTransferFrom(
        address _from,
        address _to,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    ) public override onlyInWhitelist {
        require(
            !contains(_ids, COMMUNITY_TEMPLATE_ID),
            "Community NFT can't be trasfered"
        );

        super.safeBatchTransferFrom(_from, _to, _ids, _values, _data);
    }

    function balanceOf(address _owner, uint256 _id)
        public
        override
        onlyInWhitelist
        returns (uint256)
    {
        require(
            _id != COMMUNITY_TEMPLATE_ID,
            "Community NFT doesn't have a balance."
        );
        super.balanceOf(_owner, _id);
    }

    function balanceOfBatch(address[] calldata _owners, uint256[] calldata _ids)
        public
        override
        onlyInWhitelist
        returns (uint256[] memory)
    {
        require(
            !contains(_ids, COMMUNITY_TEMPLATE_ID),
            "Community NFT can't be trasfered"
        );

        super.balanceOfBatch(_owners, _ids);
    }

    function setApprovalForAll(address _operator, bool _approved)
        public
        override
        onlyInWhitelist
    {
        super.setApprovalForAll(_operator, _approved);
    }

    function isApprovedForAll(address _owner, address _operator)
        public
        override
        onlyInWhitelist
        returns (bool)
    {
        super.isApprovedForAll(_owner, _operator);
    }

    function contains(uint256[] arr, uint256 element) internal returns (bool) {
        for (int256 i = 0; i < arr.length; i++) {
            if (arr[i] == element) return true;
        }
        return false;
    }
}
