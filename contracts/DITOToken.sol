pragma solidity ^0.5.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";

/**
 * @title DiTo ERC20 AToken
 *
 * @dev Implementation of the SkillWallet token for the DistributedTown project.
 * @author DistributedTown
 */
contract DITOToken is ERC20, ERC20Detailed {
    constructor(uint256 initialSupply)
        public
        ERC20Detailed("DiTo", "DITO", 18)
    {
        _mint(msg.sender, initialSupply);
    }
}
