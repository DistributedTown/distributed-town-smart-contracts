//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./GigStatuses.sol";
import "../skillWallet/ISWActionExecutor.sol";

struct Gig {
    address creator;
    address taker;
    uint256 ditoCredits;
    GigStatuses.GigStatus status;
}

interface IGigs is IERC721, ISWActionExecutor {
    event GigCreated(address _creator, uint256 _gigId);
    event GigCompleted(uint256 _gigId);
    event GigTaken(uint256 _gigId);
    event GigSubmitted(uint256 _gigId);
    event GigValidated(
        uint256 _gigId,
        bool areCreditsTransfered,
        uint256 creditsTransfered
    );

    // in the metadata uri - skills, title, description
    function createGig(
        address creator,
        uint256 _ditoCredits,
        string memory _metadataUrl
    ) external;

    function takeGig(uint256 _gigId, address taker) external;

    function submitGig(uint256 _gigId, address submitter) external;

    function completeGig(uint256 _gigId, address completor) external;

    // callback of SW validate should call this.
    function markAsValid(uint256 _gigId) external;
}
