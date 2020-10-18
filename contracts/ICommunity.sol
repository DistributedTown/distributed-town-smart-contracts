//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

/**
 * @title DistributedTown Community
 *
 * @dev Interface of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */
abstract contract ICommunity {
    mapping(address => bool) public enabledMembers;
}
