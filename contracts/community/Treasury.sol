//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";

import "./DITOCredit.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract Treasury is IERC721Receiver, IERC777Recipient {
    DITOCredit private ditoCredits;
    address private communityAddress;
    uint256 private constant THREASHOLD = 3840 * 1e18;
    IERC1820Registry private _erc1820 =
        IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant TOKENS_RECIPIENT_INTERFACE_HASH =
        keccak256("ERC777TokensRecipient");

    constructor(address _ditoCreditsAddress, address _communityAddress) public {
        ditoCredits = DITOCredit(_ditoCreditsAddress);
        communityAddress = _communityAddress;

        _erc1820.setInterfaceImplementer(
            address(this),
            TOKENS_RECIPIENT_INTERFACE_HASH,
            address(this)
        );
    }

    function setCommunityAddress(address _newCommunityAddress) public {
        require(msg.sender == communityAddress, "Caller not community");

        communityAddress = _newCommunityAddress;
    }

    function returnCreditsIfThresholdReached() public {
        uint256 balance = ditoCredits.balanceOf(address(this));
        if (balance >= THREASHOLD) {
            ditoCredits.transfer(communityAddress, balance - 2000 * 1e18);
        }
    }

    /**
     * @dev See {IERC721Receiver-onERC721Received}.
     *
     * Always returns `IERC721Receiver.onERC721Received.selector`.
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData
    ) public override {}
}
