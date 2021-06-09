//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DiTo ERC777 Token
 *
 * @dev Implementation of the DiTo token for the DistributedTown project.
 * @author DistributedTown
 */
contract DITOCredit is ERC777, Ownable {
    event AddedToWhitelist(address _communityMember);
    event RemovedFromWhitelist(address _communityMember);

    mapping(address => bool) public whitelist;

    modifier onlyInWhitelist() {
        require(whitelist[msg.sender], "Transfer only in whitelist!");
        _;
    }

    /**
     * DiToCredits implements ERC777
     * The default operator for all token holders is the community contract
     * There will be no other operators allowed.
     */
    constructor(address communityTokenHolder, address[] memory _defaultOperators) public ERC777("DiTo", "DITO", _defaultOperators) {
        require(_defaultOperators.length > 0, "No default operators passed!");
        whitelist[communityTokenHolder] = true;
        _mint(communityTokenHolder, 96000 * 1e18, "", "");
    }

    /**
     * @dev Adds a community member to the whitelist, called by the join function of the Community contract
     * @param _communityMember the address of the new member of a Community to add to the whitelist
     **/
    function addToWhitelist(address _communityMember) public onlyOwner {
        whitelist[_communityMember] = true;

        emit AddedToWhitelist(_communityMember);
    }

    /**
     * @dev Removes a community member to the whitelist, called by the leave function of the Community contract
     * @param _communityMember the address of the leaving member of a Community
     **/
    function removeFromWhitelist(address _communityMember) public onlyOwner {
        whitelist[_communityMember] = false;
        emit RemovedFromWhitelist(_communityMember);
    }

    /**
     * @dev The operator (community.sol) sends tokens from one account to another (only if whitelisted)
     * @param sender the address of the sender
     * @param recipient the address of the recipient
     * @param amount the amount of tokens
     * @param data the transfer data
     * @param operatorData the transfer operatorData
     **/
    function operatorSend(
        address sender,
        address recipient,
        uint256 amount,
        bytes calldata data,
        bytes calldata operatorData
    ) public override onlyOwner {
        require(whitelist[recipient], "Recipient should be whitelisted");
        super.operatorSend(sender, recipient, amount, data, operatorData);
    }

    /**
     * @dev Only the Community.sol can be an operator for this token.
     **/
    function authorizeOperator(address operator) public virtual override {
        require(false, "Only Community.sol can be an operator.");
    }

    /**
     * @dev The operator can't be revoked. The only operator is the community contract.
     **/
    function revokeOperator(address operator) public virtual override {
        require(false, "Community.sol cannot be removed from the operators.");
    }
}
