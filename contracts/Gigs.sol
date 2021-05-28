//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./GigStatuses.sol";
import "./Community.sol";

contract Gigs is IERC721Metadata, ERC721 {
    using Counters for Counters.Counter;

    event GigCreated(address _creator, uint256 _gigId);
    event GigCompleted(uint256 _gigId);
    event GigTaken(uint256 _gigId);
    event GigSubmitted(uint256 _gigId);
    event GigValidated(
        uint256 _gigId,
        bool transferedCredits,
        uint256 creditsTransfered
    );

    Counters.Counter gigId;

    struct Gig {
        address creator;
        address taker;
        uint256 ditoCredits;
        GigStatuses.GigStatus status;
    }

    mapping(uint256 => Gig) public gigs;
    mapping(uint256 => bool) public isValidated;
    Community community;

    constructor()
        public ERC721("Gigs", "GIG")
    {
        community = Community(msg.sender);
    }


    // in the metadata uri - skills, title, description
    function createGig(
        address creator,
        uint256 _ditoCredits,
        string memory _metadataUrl
    ) public {
        // TODO: verify identity chainlink!
        require(
            community.isMember(creator),
            "The creator of the gig should be a member of the community."
        );
        // TODO: Calculate credits with chainlink
        require(
            _ditoCredits >= 6 && _ditoCredits <= 720,
            "Invalid credits amount."
        );

        uint256 newGigId = gigId.current();

        _mint(creator, newGigId);
        _setTokenURI(newGigId, _metadataUrl);
        gigs[newGigId] = Gig(
            creator,
            address(0),
            _ditoCredits,
            GigStatuses.GigStatus.Open
        );

        isValidated[newGigId] = false;
        gigId.increment();

        emit GigCreated(creator, newGigId);
    }

    function takeGig(uint256 _gigId, address taker) public {
        require(
            ownerOf(_gigId) != taker,
            "The creator can't take the gig"
        );
        require(
            community.isMember(taker),
            "The taker should be a community member."
        );

        _changeStatus(_gigId, GigStatuses.GigStatus.Taken);

        gigs[_gigId].taker = taker;

        emit GigTaken(_gigId);
    }

    function submitGig(uint256 _gigId, address submitter) public {
        require(
            gigs[_gigId].taker == submitter,
            "Only the taker can submit the gig!"
        );

        _changeStatus(_gigId, GigStatuses.GigStatus.Submitted);

        emit GigSubmitted(_gigId);
    }

    function completeGig(uint256 _gigId, address completor) public {
        require(
            gigs[_gigId].creator == completor,
            "Can be completed only by the creator."
        );

        _changeStatus(_gigId, GigStatuses.GigStatus.Completed);

        emit GigCompleted(_gigId);
    }

    function validate(uint256 _gigId) public {
        // Chainlink validate hash
        isValidated[_gigId] = true;
        Gig memory gig = gigs[_gigId];

        if (gig.status == GigStatuses.GigStatus.Completed) {
            // how to transfer when the msg.sender isn't the user?
            // approved?
            // community.transfer(Gig.ditoCredits);
            emit GigValidated(
                _gigId,
                true,
                gig.ditoCredits
            );
        } else {
            emit GigValidated(_gigId, false, 0);
        }
    }

    function _changeStatus(
        uint256 _gigId,
        GigStatuses.GigStatus _to
    ) private {
        require (
            GigStatuses.isTransitionAllowed(gigs[_gigId].status, _to), 
            "Status change not allowed"
        );

        require(
            isValidated[_gigId],
            "Gig creation not yet validated."
        );

        gigs[_gigId].status = _to;
        isValidated[_gigId] = false;
    }
}   