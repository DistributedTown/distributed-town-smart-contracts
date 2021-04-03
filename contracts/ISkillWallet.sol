
//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./CommonTypes.sol";

interface ISkillWallet is IERC721 {

    function create(address owner, Types.SkillSet memory skillSet, string memory url) external;

    function updateSkillSet(uint256 skillWalletId, Types.SkillSet memory newSkillSet) external;

    function changeCommunity(uint256 skillWalletId) external;

    function isSkillWalletRegistered(address owner) external view returns (bool status);

    function getCommunityHistory(uint256 skillWalletId) external view returns (address[] memory communities);

    function getActiveCommunity(uint256 skillWalletId) external view returns (address community);

    function getTotalSkillWalletsRegistered() external view returns (uint256);

}