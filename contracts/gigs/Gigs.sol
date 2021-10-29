//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "skill-wallet/contracts/main/ISWActionExecutor.sol";

import "./IGigs.sol";
import "./GigStatuses.sol";
import "../community/Community.sol";

contract Gigs is IGigs, IERC721Metadata, ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter gigId;

    mapping(uint256 => Gig) public gigs;
    Community community;

    constructor(address communityAddress) public ERC721("Gigs", "GIG") {
        community = Community(communityAddress);
    }

    function setCommunityAddress(address _newCommunityAddress) public {
        require(msg.sender == address(community), "Caller not community");

        community = Community(_newCommunityAddress);
    }

    // in the metadata uri - skills, title, description
    function createGig(
        uint256 _ditoCredits,
        string memory _metadataUrl
    ) public override {
        require(
            community.isMember(msg.sender),
            "The creator of the gig should be a member of the community."
        );
        // TODO: Calculate credits with chainlink
        require(
            _ditoCredits >= 6 * 1e18 && _ditoCredits <= 720 * 1e18,
            "Invalid credits amount."
        );

        uint256 creatorsBalance = community.balanceOf(msg.sender);
        require(creatorsBalance >= _ditoCredits, "Insufficient dito balance");

        uint256 newGigId = gigId.current();
        _mint(msg.sender, newGigId);
        _setTokenURI(newGigId, _metadataUrl);

        community.transferToCommunity(msg.sender, _ditoCredits);

        gigs[newGigId] = Gig(
            msg.sender,
            address(0),
            _ditoCredits,
            GigStatuses.GigStatus.Open
        );

        gigId.increment();

        emit GigCreated(msg.sender, newGigId);
    }

    function takeGig(uint256 _gigId) public override {
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(gigs[_gigId].taker == address(0), 'The gig is already taken.');
        require(ownerOf(_gigId) != msg.sender, "The creator can't take the gig");
        require(
            community.isMember(msg.sender),
            "The taker should be a community member."
        );
        _changeStatus(_gigId, GigStatuses.GigStatus.Taken);

        gigs[_gigId].taker = msg.sender;

        emit GigTaken(_gigId);
    }

    function submitGig(uint256 _gigId) public override {
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(gigs[_gigId].status == GigStatuses.GigStatus.Taken, "Gig should be with status taken.");
        require(
            gigs[_gigId].taker == msg.sender,
            "Only the taker can submit the gig"
        );

        _changeStatus(_gigId, GigStatuses.GigStatus.Submitted);

        emit GigSubmitted(_gigId);
    }

    function completeGig(uint256 _gigId) public override {
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(
            gigs[_gigId].creator == msg.sender,
            "Can be completed only by the creator."
        );
        require(gigs[_gigId].status == GigStatuses.GigStatus.Submitted, "Gig status should be Submitted.");

        _changeStatus(_gigId, GigStatuses.GigStatus.Completed);

        community.transferCredits(gigs[_gigId].taker, gigs[_gigId].ditoCredits);

        emit GigCompleted(_gigId);
    }


    function gigsCount() public view returns(uint256) {
        return gigId.current();
    }

    function _changeStatus(uint256 _gigId, GigStatuses.GigStatus _to) private {
        require(
            GigStatuses.isTransitionAllowed(gigs[_gigId].status, _to),
            "Status change not allowed"
        );
        gigs[_gigId].status = _to;
    }
}