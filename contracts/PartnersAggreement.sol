//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "./DistributedTown.sol";
import "./ISkillWallet.sol";

/**
 * @title Partners Aggreement
 *
 * @dev Allows external projects and protocols integrate with DiTo and SW
 * @author PartnersAggreement
 */

contract PartnersAggreement {
    DistributedTown distributedTown;
    ISkillWallet skillWallet;

    mapping(uint256 => address) partnersContracts;
    mapping(uint256 => bool) isPartnersAgreement;

    event PartnersAggreementCreated(
        uint256 communityId,
        uint256 skillWalletId
    );

    // add JSON Schema base URL
    constructor(address _distributedTownAddress) public {
        distributedTown = DistributedTown(_distributedTownAddress);
        skillWallet = ISkillWallet(DistributedTown.skillWalletAddress());
    }

    // roles are in the uri of the community
    // partnersContracts ownership should be checked before calling the function
    function create(
        string memory swUri,
        string memory displayString,
        string memory level,
        string memory uri,
        address partnersContract,
        string memory tokenName, 
        string memory tokenSymbol
    ) public {
        Types.SkillSet memory skillSet =
            Types.SkillSet(
                Types.Skill(displayString, level)
            );

        skillWallet.create(msg.sender, skillSet, swUri);
        distributedTown.createPartnersCommunity(uri, msg.sender, tokenName, tokenSymbol);

        uint256 skillWalletId = skillWallet.getSkillWalletIdByOwner(msg.sender);
        uint256 communityId = skillWallet.getActiveCommunity(skillWalletId);

        isPartnersAgreement[communityId] = true;
        partnersContracts[communityId] = partnersContract;

        emit PartnersAggreementCreated(communityId, skillWalletId);
    }
}