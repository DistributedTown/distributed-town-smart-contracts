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

    mapping(address => address) partnersContracts;
    mapping(address => bool) isPartnersAgreement;

    event PartnersAggreementCreated(
        address communityAddress,
        uint256 skillWalletId
    );

    // add JSON Schema base URL
    constructor(address _distributedTownAddress, address _skillWalletAddress)
        public
    {
        distributedTown = DistributedTown(_distributedTownAddress);
        skillWallet = ISkillWallet(_skillWalletAddress);
    }

    // roles are in the uri of the community
    // partnersContracts ownership should be checked before calling the function
    function create(
        string memory swUri,
        string memory uri,
        address partnersContract,
        string memory tokenName,
        string memory tokenSymbol,
        uint64 skillId
    ) public {
        Types.SkillSet memory skillSet =
            Types.SkillSet(
                Types.Skill(skillId, 10),
                Types.Skill(0, 0),
                Types.Skill(0, 0)
            );

        skillWallet.create(msg.sender, skillSet, swUri);
        distributedTown.createPartnersCommunity(
            uri,
            msg.sender,
            tokenName,
            tokenSymbol
        );

        uint256 skillWalletId = skillWallet.getSkillWalletIdByOwner(msg.sender);
        address community = skillWallet.getActiveCommunity(skillWalletId);

        isPartnersAgreement[community] = true;
        partnersContracts[community] = partnersContract;

        emit PartnersAggreementCreated(community, skillWalletId);
    }
}
