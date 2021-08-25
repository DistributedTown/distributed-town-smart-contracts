//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./GigStatuses.sol";

struct Gig {
    address creator;
    address taker;
    uint256 ditoCredits;
    GigStatuses.GigStatus status;
}

interface IGigs is IERC721 {
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
        uint256 _ditoCredits,
        string memory _metadataUrl
    ) external;

    function takeGig(uint256 _gigId) external;

    function submitGig(uint256 _gigId) external;

    function completeGig(uint256 _gigId) external;
}
