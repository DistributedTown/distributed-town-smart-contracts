//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./IGigs.sol";
import "./GigStatuses.sol";
import "../community/Community.sol";
import "../CommonTypes.sol";


contract Gigs is IGigs, IERC721Metadata, ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter gigId;

    mapping(uint256 => Gig) public gigs;
    mapping(uint256 => bool) public isValidated;
    Community community;

    constructor(address communityAddress) public ERC721("Gigs", "GIG") {
        community = Community(communityAddress);
    }

    function execute(
        Types.Action action,
        address caller,
        uint[] memory intParams,
        string[] memory stringParams,
        address[] memory addressParams
    ) public override {
        // Called only by SW
        if (action == Types.Action.CreateGig) {
            createGig(
                caller,
                intParams[0],
                stringParams[0]
            );
        } else if (action == Types.Action.TakeGig) {
            takeGig(intParams[0], caller);
        } else if (action == Types.Action.SubmitGig) {
            submitGig(intParams[0], caller);
        } else if (action == Types.Action.CompleteGig) {
            completeGig(intParams[0], caller);
        }
    }

    // in the metadata uri - skills, title, description
    function createGig(
        address _creator,
        uint256 _ditoCredits,
        string memory _metadataUrl
    ) public override {
        // TODO: verify identity chainlink!
        require(msg.sender == address(this));
        require(
            community.isMember(_creator),
            "The creator of the gig should be a member of the community."
        );
        // TODO: Calculate credits with chainlink
        require(
            _ditoCredits >= 6 * 1e18 && _ditoCredits <= 720 * 1e18,
            "Invalid credits amount."
        );

        uint256 creatorsBalance = community.balanceOf(_creator);
        require(creatorsBalance >= _ditoCredits, "Insufficient dito balance");

        uint256 newGigId = gigId.current();
        _mint(_creator, newGigId);
        _setTokenURI(newGigId, _metadataUrl);

        community.transferToCommunity(_creator, _ditoCredits);

        gigs[newGigId] = Gig(
            _creator,
            address(0),
            _ditoCredits,
            GigStatuses.GigStatus.Open
        );

        isValidated[newGigId] = false;
        gigId.increment();

        emit GigCreated(_creator, newGigId);
    }

    function takeGig(uint256 _gigId, address taker) public override {
        require(msg.sender == address(this));
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(gigs[_gigId].taker == address(0), "The gig is already taken.");
        require(ownerOf(_gigId) != taker, "The creator can't take the gig");
        require(
            community.isMember(taker),
            "The taker should be a community member."
        );
        require(
            isValidated[_gigId],
            "The gig should be validated by the creator."
        );
        _changeStatus(_gigId, GigStatuses.GigStatus.Taken);

        gigs[_gigId].taker = taker;

        emit GigTaken(_gigId);
    }

    function submitGig(uint256 _gigId, address submitter) public override {
        require(msg.sender == address(this));
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(
            gigs[_gigId].status == GigStatuses.GigStatus.Taken,
            "Gig not taken yet."
        );
        require(
            gigs[_gigId].taker == submitter,
            "Only the taker can submit the gig"
        );
        require(
            isValidated[_gigId],
            "The gig should be validated by the creator."
        );
        _changeStatus(_gigId, GigStatuses.GigStatus.Submitted);

        emit GigSubmitted(_gigId);
    }

    function completeGig(uint256 _gigId, address completor) public override {
        require(msg.sender == address(this));
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(
            gigs[_gigId].creator == completor,
            "Can be completed only by the creator."
        );
        require(
            isValidated[_gigId],
            "The gig should be validated by the creator."
        );
        require(
            gigs[_gigId].status == GigStatuses.GigStatus.Submitted,
            "Gig not submitted yet."
        );

        _changeStatus(_gigId, GigStatuses.GigStatus.Completed);

        emit GigCompleted(_gigId);
    }

    // callback of SW validate should call this.
    function markAsValid(uint256 _gigId) public override {
        // Chainlink validate hash
        isValidated[_gigId] = true;
        Gig memory gig = gigs[_gigId];

        if (gig.status == GigStatuses.GigStatus.Completed) {
            community.transferCredits(gig.taker, gig.ditoCredits);
            emit GigValidated(_gigId, true, gig.ditoCredits);
        } else {
            emit GigValidated(_gigId, false, 0);
        }
    }

    function _changeStatus(uint256 _gigId, GigStatuses.GigStatus _to) private {
        require(
            GigStatuses.isTransitionAllowed(gigs[_gigId].status, _to),
            "Status change not allowed"
        );

        require(isValidated[_gigId], "Gig creation not yet validated.");

        gigs[_gigId].status = _to;
        isValidated[_gigId] = false;
    }
}
