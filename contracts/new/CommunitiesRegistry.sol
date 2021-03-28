//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "./Community.sol";

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
    function createCommunity() public returns (address _communityAddress) {
        Membership membership = new Membership();
        address newMembershipAddress = address(membership);
        addCommunity(newCommunityAddress);

        numOfCommunities = numOfCommunities + 1;

        emit CommunityCreated(newCommunityAddress);

        return newCommunityAddress;
    }

}
