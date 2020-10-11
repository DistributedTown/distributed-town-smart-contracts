pragma solidity ^0.5.0;

/**
@title ILendingPool interface
@notice provides the interface to fetch the LendingPool address
 */

contract ILendingPool {
    function deposit(
        address,
        uint256,
        uint16
    ) external payable;
}
