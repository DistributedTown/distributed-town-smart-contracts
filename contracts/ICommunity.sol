pragma solidity ^0.5.0;

/**
 * @title DistributedTown Community
 *
 * @dev Interface of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */
contract ICommunity {
    mapping(address => bool) public enabledMembers;
}
