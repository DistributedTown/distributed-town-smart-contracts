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
        Community newCommunity = new Community(address(this));
        address newCommunityAddress = address(newCommunity);
        addCommunity(newCommunityAddress);

        numOfCommunities = numOfCommunities + 1;

        emit CommunityCreated(newCommunityAddress);

        return newCommunityAddress;
    }

    /**
     * @dev Adds a community to the registry
     * @param _communityAddress the address of the community to add
     **/
    function addCommunity(address _communityAddress) public {
        communities.push(_communityAddress);
    }

    /**
     * @dev Gets the current community of a user
     * @param _user the address of user to check
     * @return communityAddress the address of the community of the user if existent, else 0 address
     **/
    function currentCommunityOfUser(address _user)
        public
        view
        returns (address communityAddress)
    {
        uint256 i = 0;
        bool userFound = false;

        while (!userFound && i < communities.length) {
            Community community = Community(payable(communities[i]));
            userFound = community.enabledMembers(_user);

            i++;
        }

        if (!userFound) return address(0);

        return address(communities[i - 1]);
    }
}
