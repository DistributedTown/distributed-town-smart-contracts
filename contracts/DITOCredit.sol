//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DiTo ERC20 AToken
 *
 * @dev Implementation of the SkillWallet token for the DistributedTown project.
 * @author DistributedTown
 */
contract DITOCredit is ERC777, Ownable {
    event AddedToWhitelist(address _communityMember);
    event RemovedFromWhitelist(address _communityMember);

    mapping(address => bool) public whitelist;

    modifier onlyInWhitelist() {
        require(whitelist[msg.sender], "");
        _;
    }

    constructor(address[] memory defaultOperators)
        public
        ERC777("DiTo", "DITO", defaultOperators)
    {
        whitelist[msg.sender] = true;
        _mint(msg.sender, 96000 * 1e18, "", "");
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

    function transfer(address recipient, uint256 amount)
        public
        override
        onlyInWhitelist
        returns (bool)
    {
        require(whitelist[recipient], 'Recipient should be whitelisted');
        return super.transfer(recipient, amount);
    }

    function approve(address spender, uint256 amount)
        public
        override
        onlyInWhitelist
        returns (bool)
    {
        require(whitelist[spender], 'Recipient should be whitelisted');
        return super.approve(spender, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override onlyInWhitelist returns (bool) {
        require(whitelist[recipient], 'Recipient should be whitelisted');
        _send(sender, recipient, amount, "", "", false);
        return true;
    }

    function authorizeOperator(address operator) public virtual override {
        require(false, "Only Community.sol can be an operator.");
    }

    function revokeOperator(address operator) public virtual override {
        require(false, "Community.sol cannot be removed from the operators.");
    }

    function send(
        address recipient,
        uint256 amount,
        bytes memory data
    ) public virtual override onlyInWhitelist {
        require(whitelist[recipient], 'Recipient should be whitelisted');
        _send(_msgSender(), recipient, amount, data, "", false);
    }
}
