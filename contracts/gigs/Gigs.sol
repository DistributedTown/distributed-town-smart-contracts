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

contract Gigs is IGigs, IERC721Metadata, ISWActionExecutor, ERC721 {
    using Counters for Counters.Counter;

    Counters.Counter gigId;

    mapping(uint256 => Gig) public gigs;
    Community community;

    constructor(address communityAddress) public ERC721("Gigs", "GIG") {
        community = Community(communityAddress);
    }

    // in the metadata uri - skills, title, description
    function createGig(
        address creator,
        uint256 _ditoCredits,
        string memory _metadataUrl
    ) public override {
        require(msg.sender == address(this), "Only SWActionExecutor can call this.");
        require(
            community.isMember(creator),
            "The creator of the gig should be a member of the community."
        );
        // TODO: Calculate credits with chainlink
        require(
            _ditoCredits >= 6 * 1e18 && _ditoCredits <= 720 * 1e18,
            "Invalid credits amount."
        );

        uint256 creatorsBalance = community.balanceOf(creator);
        require(creatorsBalance >= _ditoCredits, "Insufficient dito balance");

        uint256 newGigId = gigId.current();
        _mint(creator, newGigId);
        _setTokenURI(newGigId, _metadataUrl);

        community.transferToCommunity(creator, _ditoCredits);

        gigs[newGigId] = Gig(
            creator,
            address(0),
            _ditoCredits,
            GigStatuses.GigStatus.Open
        );

        gigId.increment();

        emit GigCreated(creator, newGigId);
    }

    function takeGig(uint256 _gigId, address taker) public override {
        require(msg.sender == address(this), "Only SWActionExecutor can call this.");
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(gigs[_gigId].taker == address(0), 'The gig is already taken.');
        require(ownerOf(_gigId) != taker, "The creator can't take the gig");
        require(
            community.isMember(taker),
            "The taker should be a community member."
        );
        _changeStatus(_gigId, GigStatuses.GigStatus.Taken);

        gigs[_gigId].taker = taker;

        emit GigTaken(_gigId);
    }

    function submitGig(uint256 _gigId, address submitter) public override {
        require(msg.sender == address(this), "Only SWActionExecutor can call this.");
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(gigs[_gigId].status == GigStatuses.GigStatus.Taken, "Gig not taken yet.");
        require(
            gigs[_gigId].taker == submitter,
            "Only the taker can submit the gig"
        );
        _changeStatus(_gigId, GigStatuses.GigStatus.Submitted);

        emit GigSubmitted(_gigId);
    }

    function completeGig(uint256 _gigId, address completor) public override {
        require(msg.sender == address(this), "Only SWActionExecutor can call this.");
        require(gigs[_gigId].creator != address(0), "Invalid gigId");
        require(
            gigs[_gigId].creator == completor,
            "Can be completed only by the creator."
        );
        require(gigs[_gigId].status == GigStatuses.GigStatus.Submitted, "Gig not submitted yet.");

        _changeStatus(_gigId, GigStatuses.GigStatus.Completed);

        emit GigCompleted(_gigId);
    }

    function execute(
        Types.Action action,
        address caller,
        uint[] memory intParams,
        string[] memory stringParams,
        address[] memory addressParams
    ) public override {
        require(msg.sender == community.getSkillWalletAddress(), "Only SW can call execute!");
        require(uint(action) > 1 && uint(action) < 6, "Invalid action!");
        require(intParams.length > 0, "Missing parameter!");
        require(
                action == Types.Action.CreateGig && 
                intParams.length >= 1 && 
                stringParams.length >= 1,
                "Missing parameters"
        );
        require(caller != address(0), "Caller can't be the zero address");

        if(action == Types.Action.CreateGig) {
            this.createGig(caller, intParams[0], stringParams[0]);
        } else if(action == Types.Action.TakeGig) {
            this.takeGig(intParams[0], caller);
        } else if(action == Types.Action.SubmitGig) {
            this.submitGig(intParams[0], caller);
        } else if(action == Types.Action.CompleteGig) {
            this.completeGig(intParams[0], caller);
        } else {
            require(false, "Invalid action!");
        }
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
