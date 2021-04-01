//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "./Community.sol";
import "./Membership.sol";

/**
 * @title DistributedTown CommunitiesRegistry
 *
 * @dev Implementation of the CommunitiesRegistry contract, which is a Factory and Registry of Communities
 * @author DistributedTown
 */
contract CommunitiesRegistry {
    event CommunityCreated(address _newCommunityAddress);

    address[] public communities;
    uint256 public numOfCommunities;

    /**
     * @dev Creates a community
     * @return _communityAddress the newly created Community address
     **/
    function createCommunity(uint template) public returns (address _communityAddress) {
        Community community = new Community('');
        address newCommunityAddress = address(community);

        numOfCommunities = numOfCommunities + 1;

        emit CommunityCreated(newCommunityAddress);

        return newCommunityAddress;
    }

}
