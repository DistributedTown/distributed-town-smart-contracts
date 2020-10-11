pragma solidity ^0.5.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";

import "./ILendingPoolAddressesProvider.sol";
import "./ILendingPool.sol";
import "./IAtoken.sol";

import "./DITOToken.sol";

contract Community is Ownable {
    event MemberAdded(address _member, uint256 _transferedTokens);
    event MemberRemoved(address _member);

    DITOToken public tokens;

    mapping(address => bool) public enabledMembers;
    uint256 public numberOfMembers;

    constructor() public {
        tokens = new DITOToken(96000 * 1e18);
    }

    function join(uint256 _amountOfDITOToRedeem) public {
        require(numberOfMembers < 24, "There are already 24 members, sorry!");
        require(enabledMembers[msg.sender] == false, "You already joined!");

        enabledMembers[msg.sender] = true;
        numberOfMembers = numberOfMembers + 1;

        tokens.transfer(msg.sender, _amountOfDITOToRedeem * 1e18);

        emit MemberAdded(msg.sender, _amountOfDITOToRedeem);
    }

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

    function getInvestedBalance()
        public
        view
        returns (uint256 investedBalance)
    {
        address aDaiAddress = address(
            0xcB1Fe6F440c49E9290c3eb7f158534c2dC374201
        ); // Ropsten aDAI

        // Client has to convert to balanceOf / 1e18
        return IAtoken(aDaiAddress).balanceOf(address(this));
    }

    function() external payable {}
}
