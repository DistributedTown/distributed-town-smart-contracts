
//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;
pragma experimental ABIEncoderV2;
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./CommonTypes.sol";

interface IMilestones {

    function create() external;

    function take() external;

    function accept() external;

    function complete() external;

}