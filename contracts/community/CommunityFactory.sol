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
        bool _isDitoNative,
        string memory communityMetadata, 
        address addressProvider, 
        uint256 membersCount,
        uint256 rolesCount,
        bool _claimableSkillWallets,
        address _migrateFrom
    ) public returns (address) {
        address comAddr = address(
            new Community(msg.sender, _isDitoNative, communityMetadata, addressProvider, membersCount, rolesCount, _claimableSkillWallets, _migrateFrom, version)
        );

        return comAddr;
    }
}