//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

interface DistributedTown is ERC1155, ERC1155Holder {
    event CommunityCreated(
        address communityContract,
        uint256 communityId,
        uint256 template,
        address indexed creator
    );

    function createCommunity(
        string memory communityMetadata,
        uint256 template
    ) external;

    function getCommunities() external view returns (address[] memory);

    function deployGenesisCommunities(uint256 template) external;
    function getCommunityByOwner(address owner) external view returns(address);
}
