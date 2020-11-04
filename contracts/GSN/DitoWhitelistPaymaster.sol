//SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import "./AcceptEverythingPaymaster.sol";

import "../CommunitiesRegistry.sol";

///a sample paymaster that has whitelists for senders and targets.
/// - if at least one sender is whitelisted, then ONLY whitelisted senders are allowed.
/// - if at least one target is whitelisted, then ONLY whitelisted targets are allowed.
contract DitoWhitelistPaymaster is AcceptEverythingPaymaster {
    function preRelayedCall(
        GsnTypes.RelayRequest calldata relayRequest,
        bytes calldata signature,
        bytes calldata approvalData,
        uint256 maxPossibleGas
    )
        external
        virtual
        override
        returns (bytes memory context, bool revertOnRecipientRevert)
    {
        (relayRequest, signature, approvalData, maxPossibleGas);

        CommunitiesRegistry communitiesRegistry = CommunitiesRegistry(
            0x07AeD66583F1E0F78a70584Bb84C856a6940f714
        );

        address senderCommunity = communitiesRegistry.currentCommunityOfUser(
            relayRequest.request.from
        );
        address receiverCommunity = communitiesRegistry.currentCommunityOfUser(
            relayRequest.request.to
        );

        require(
            senderCommunity != address(0),
            "Sender isn't part of any community"
        );
        require(
            receiverCommunity != address(0),
            "Receiver isn't part of any community"
        );
        require(
            senderCommunity != receiverCommunity,
            "Sender and receiver are not part of the same community"
        );

        return ("", false);
    }
}
