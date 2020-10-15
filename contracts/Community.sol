pragma solidity ^0.5.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

import "./ILendingPoolAddressesProvider.sol";
import "./ILendingPool.sol";
import "./IAtoken.sol";

import "./DITOToken.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */
contract Community is Ownable {
    /**
     * @dev emitted when a member is added
     * @param _member the user which just joined the community
     * @param _transferredTokens the amount of transferred dito tokens on join
     **/
    event MemberAdded(address _member, uint256 _transferredTokens);
    /**
     * @dev emitted when a member leaves the community
     * @param _member the user which just left the community
     **/
    event MemberRemoved(address _member);

    // The address of the DITOToken ERC20 contract instantiated on Community creation
    DITOToken public tokens;

    mapping(address => bool) public enabledMembers;
    uint256 public numberOfMembers;

    constructor() public {
        tokens = new DITOToken(96000 * 1e18);
    }

    /**
     * @dev makes the calling user join the community if required conditions are met
     * @param _amountOfDITOToRedeem the amount of dito tokens for which this user is eligible
     **/
    function join(uint256 _amountOfDITOToRedeem) public {
        require(numberOfMembers < 24, "There are already 24 members, sorry!");
        require(enabledMembers[msg.sender] == false, "You already joined!");

        enabledMembers[msg.sender] = true;
        numberOfMembers = numberOfMembers + 1;

        tokens.transfer(msg.sender, _amountOfDITOToRedeem * 1e18);

        emit MemberAdded(msg.sender, _amountOfDITOToRedeem);
    }

    /**
     * @dev makes the calling user leave the community if required conditions are met
     **/
    function leave() public {
        require(enabledMembers[msg.sender] == true, "You didn't even join!");

        enabledMembers[msg.sender] = false;
        numberOfMembers = numberOfMembers - 1;

        // leaving user must first give allowance
        // then can call this
        tokens.transferFrom(
            msg.sender,
            address(this),
            tokens.balanceOf(msg.sender)
        );

        emit MemberRemoved(msg.sender);
    }

    /**
     * @dev makes the calling user deposit funds (DAI) in the community if required conditions are met
     * @param _amount number of DAI which the user wants to deposit
     **/
    function deposit(uint256 _amount) public {
        require(
            enabledMembers[msg.sender] == true,
            "You can't deposit if you're not part of the community!"
        );

        address daiAddress = address(
            0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108
        ); // Ropsten DAI
        IERC20 dai = IERC20(daiAddress);

        // Transfer DAI
        require(
            dai.balanceOf(msg.sender) <= _amount * 1e18,
            "You don't have enough funds to invest."
        );

        uint256 amount = _amount * 1e18;

        // Transfer DAI
        dai.transferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev makes the calling user lend funds (DAI) that are in the community contract into Aave if required conditions are met
     * @param _amount number of DAI which the user wants to lend
     **/
    function invest(uint256 _amount) public {
        require(
            enabledMembers[msg.sender] == true,
            "You can't invest if you're not part of the community!"
        );

        address daiAddress = address(
            0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108
        ); // Ropsten DAI
        IERC20 dai = IERC20(daiAddress);

        // Transfer DAI
        require(
            dai.balanceOf(address(this)) <= _amount * 1e18,
            "Amount to invest cannot be higher than deposited amount."
        );

        // Retrieve LendingPool address
        ILendingPoolAddressesProvider provider = ILendingPoolAddressesProvider(
            address(0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728)
        ); // Ropsten address, for other addresses: https://docs.aave.com/developers/developing-on-aave/deployed-contract-instances
        ILendingPool lendingPool = ILendingPool(provider.getLendingPool());

        uint256 amount = 10000000 * 1e18;
        uint16 referral = 0;

        // Approve LendingPool contract to move your DAI
        dai.approve(provider.getLendingPoolCore(), amount);

        // Deposit _amount DAI
        lendingPool.deposit(daiAddress, _amount * 1e18, referral);
    }

    /**
     * @dev makes the calling user withdraw funds (aDAI) that are in Aave back into the community contract if required conditions are met
     * @param _amount number of DAI which the user wants to withdraw
     **/
    function withdrawFromInvestment(uint256 _amount) public {
        require(
            enabledMembers[msg.sender] == true,
            "You can't withdraw investment if you're not part of the community!"
        );

        // Retrieve aDAIAddress
        address aDaiAddress = address(
            0xcB1Fe6F440c49E9290c3eb7f158534c2dC374201
        ); // Ropsten aDAI
        IAtoken aDai = IAtoken(aDaiAddress);

        if (aDai.isTransferAllowed(address(this), _amount * 1e18) == false)
            revert(
                "Can't withdraw from investment, probably not enough liquidity on Aave."
            );

        // Redeems _amount aDAI
        aDai.redeem(_amount * 1e18);
    }

    /**
     * @dev Returns the amount of aDAI held by the contract (invested + interest)
     * @return the aDai balance of the contract
     **/
    function getInvestedBalanceInfo()
        public
        view
        returns (uint256 investedBalance, uint256 investedTokenAPY)
    {
        address aDaiAddress = address(
            0xcB1Fe6F440c49E9290c3eb7f158534c2dC374201
        ); // Ropsten aDAI

        // Client has to convert to balanceOf / 1e18
        uint256 _investedBalance = IAtoken(aDaiAddress).balanceOf(
            address(this)
        );

        address daiAddress = address(
            0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108
        ); // Ropsten DAI

        // Retrieve LendingPool address
        ILendingPoolAddressesProvider provider = ILendingPoolAddressesProvider(
            address(0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728)
        ); // Ropsten address, for other addresses: https://docs.aave.com/developers/developing-on-aave/deployed-contract-instances
        ILendingPool lendingPool = ILendingPool(provider.getLendingPool());

        // Client has to convert to balanceOf / 1e27
        (, , , , uint256 liquidityRate, , , , , , , , ) = lendingPool
            .getReserveData(daiAddress);

        return (_investedBalance, liquidityRate);
    }

    function() external payable {}
}
