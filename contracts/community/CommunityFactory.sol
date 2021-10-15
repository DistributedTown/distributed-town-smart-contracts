//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "./Community.sol";

contract CommunityFactory {
    //TODO: Change to constant before prod
    uint256 public version;

    constructor(uint256 _version) public {
        version = _version;
    }

    function createCommunity(
        string memory communityMetadata, 
        address addressProvider, 
        uint256 membersCount,
        bool _claimableSkillWallets,
        address _migrateFrom
    ) public returns (address) {
        address comAddr = address(
            new Community(msg.sender, communityMetadata, addressProvider, membersCount, _claimableSkillWallets, _migrateFrom, version)
        );

        return comAddr;
    }
}