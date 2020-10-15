pragma solidity ^0.5.0;

import "./ICommunity.sol";

contract CommunitiesRegistry {
    address[] public communities;

    function addCommunity(address _communityAddress) public {
        communities.push(_communityAddress);
    }

    function currentCommunityOfUser()
        public
        view
        returns (address communityAddress)
    {
        uint256 i = 0;
        bool userFound = false;

        while (!userFound && i < communities.length) {
            ICommunity community = ICommunity(address(communities[i]));
            userFound = community.enabledMembers(msg.sender);

            i++;
        }

        if (!userFound) return address(0);

        return communities[i - 1];
    }
}
