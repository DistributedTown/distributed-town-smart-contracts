pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

/**
 * @title DiTo ERC20 AToken
 *
 * @dev Implementation of the SkillWallet token for the DistributedTown project.
 * @author DistributedTown
 */
contract DITOToken is ERC20, ERC20Detailed, Ownable {
    event AddedToWhitelist(address _communityMember);

    mapping(address => bool) public whitelist;

    modifier onlyInWhitelist() {
        require(whitelist[msg.sender], "");
        _;
    }

    constructor(uint256 initialSupply)
        public
        ERC20Detailed("DiTo", "DITO", 18)
    {
        whitelist[msg.sender] = true;
        _mint(msg.sender, initialSupply);
    }

    function addToWhitelist(address _communityMember) public onlyOwner {
        whitelist[_communityMember] = true;

        emit AddedToWhitelist(_communityMember);
    }

    function transfer(address recipient, uint256 amount)
        public
        onlyInWhitelist
        returns (bool)
    {
        return super.transfer(recipient, amount);
    }

    function approve(address spender, uint256 amount)
        public
        onlyInWhitelist
        returns (bool)
    {
        return super.approve(spender, amount);
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public onlyInWhitelist returns (bool) {
        return super.transferFrom(sender, recipient, amount);
    }

    function increaseAllowance(address spender, uint256 addedValue)
        public
        onlyInWhitelist
        returns (bool)
    {
        return super.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        onlyInWhitelist
        returns (bool)
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }
}
