//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "@opengsn/gsn/contracts/interfaces/IKnowForwarderAddress.sol";

import "./ILendingPoolAddressesProvider.sol";
import "./ILendingPool.sol";
import "./IAtoken.sol";

import "./DITOToken.sol";

import "./WadRayMath.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */
contract Community is Ownable, BaseRelayRecipient, IKnowForwarderAddress {
    string public override versionRecipient = "2.0.0";

    using SafeMath for uint256;
    using WadRayMath for uint256;

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
    mapping(string => address) public depositableCurrenciesContracts;
    mapping(string => address) public depositableACurrenciesContracts;
    string[] public depositableCurrencies;

    modifier onlyEnabledCurrency(string memory _currency) {
        require(
            depositableCurrenciesContracts[_currency] != address(0),
            "The currency passed as an argument is not enabled, sorry!"
        );
        _;
    }

    // Get the forwarder address for the network
    // you are using from
    // https://docs.opengsn.org/gsn-provider/networks.html
    // 0x25CEd1955423BA34332Ec1B60154967750a0297D is ropsten's one
    constructor(address _forwarder) public {
        trustedForwarder = _forwarder;

        tokens = new DITOToken(96000 * 1e18);

        depositableCurrencies.push("DAI");
        depositableCurrencies.push("USDC");

        depositableCurrenciesContracts["DAI"] = address(
            0xf80A32A835F79D7787E8a8ee5721D0fEaFd78108
        );
        depositableCurrenciesContracts["USDC"] = address(
            0x851dEf71f0e6A903375C1e536Bd9ff1684BAD802
        );

        depositableACurrenciesContracts["DAI"] = address(
            0xcB1Fe6F440c49E9290c3eb7f158534c2dC374201
        );
        depositableACurrenciesContracts["USDC"] = address(
            0x2dB6a31f973Ec26F5e17895f0741BB5965d5Ae15
        );
    }

    // Needed by GSN
    function getTrustedForwarder() public override view returns (address) {
        return trustedForwarder;
    }

    /**
     * @dev makes the calling user join the community if required conditions are met
     * @param _amountOfDITOToRedeem the amount of dito tokens for which this user is eligible
     **/
    function join(uint256 _amountOfDITOToRedeem) public {
        require(numberOfMembers < 24, "There are already 24 members, sorry!");
        require(enabledMembers[_msgSender()] == false, "You already joined!");

        enabledMembers[_msgSender()] = true;
        numberOfMembers = numberOfMembers + 1;

        tokens.transfer(_msgSender(), _amountOfDITOToRedeem * 1e18);

        emit MemberAdded(_msgSender(), _amountOfDITOToRedeem);
    }

    /**
     * @dev makes the calling user leave the community if required conditions are met
     **/
    function leave() public {
        require(enabledMembers[_msgSender()] == true, "You didn't even join!");

        enabledMembers[_msgSender()] = false;
        numberOfMembers = numberOfMembers - 1;

        // leaving user must first give allowance
        // then can call this
        tokens.transferFrom(
            _msgSender(),
            address(this),
            tokens.balanceOf(_msgSender())
        );

        emit MemberRemoved(_msgSender());
    }

    /**
     * @dev makes the calling user deposit funds in the community if required conditions are met
     * @param _amount number of DAI which the user wants to deposit
     **/
    function deposit(uint256 _amount, string memory _currency)
        public
        onlyEnabledCurrency(_currency)
    {
        require(
            enabledMembers[_msgSender()] == true,
            "You can't deposit if you're not part of the community!"
        );

        address currencyAddress = address(
            depositableCurrenciesContracts[_currency]
        );
        IERC20 currency = IERC20(currencyAddress);

        // Transfer DAI
        require(
            currency.balanceOf(_msgSender()) <= _amount * 1e18,
            "You don't have enough funds to invest."
        );

        uint256 amount = _amount * 1e18;

        // Transfer currency
        currency.transferFrom(_msgSender(), address(this), amount);
    }

    /**
     * @dev makes the calling user lend funds that are in the community contract into Aave if required conditions are met
     * @param _amount number of DAI which the user wants to lend
     **/
    function invest(uint256 _amount, string memory _currency)
        public
        onlyEnabledCurrency(_currency)
    {
        require(
            enabledMembers[_msgSender()] == true,
            "You can't invest if you're not part of the community!"
        );

        address currencyAddress = address(
            depositableCurrenciesContracts[_currency]
        );
        IERC20 currency = IERC20(currencyAddress);

        // Transfer currency
        require(
            currency.balanceOf(address(this)) <= _amount * 1e18,
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
        currency.approve(provider.getLendingPoolCore(), amount);

        // Deposit _amount DAI
        lendingPool.deposit(currencyAddress, _amount * 1e18, referral);
    }

    /**
     * @dev makes the calling user withdraw funds that are in Aave back into the community contract if required conditions are met
     * @param _amount amount of currency which the user wants to withdraw
     **/
    function withdrawFromInvestment(uint256 _amount, string memory _currency)
        public
        onlyEnabledCurrency(_currency)
    {
        require(
            enabledMembers[_msgSender()] == true,
            "You can't withdraw investment if you're not part of the community!"
        );

        // Retrieve aCurrencyAddress
        address aCurrencyAddress = address(
            depositableACurrenciesContracts[_currency]
        ); //
        IAtoken aCurrency = IAtoken(aCurrencyAddress);

        if (aCurrency.isTransferAllowed(address(this), _amount * 1e18) == false)
            revert(
                "Can't withdraw from investment, probably not enough liquidity on Aave."
            );

        // Redeems _amount aCurrency
        aCurrency.redeem(_amount * 1e18);
    }

    /**
     * @dev Returns the balance invested by the contract in Aave  (invested + interest) and the APY
     * @return investedBalance the aDai balance of the contract
     * @return investedTokenAPY the median APY of invested balance
     **/
    function getInvestedBalanceInfo()
        public
        view
        returns (uint256 investedBalance, uint256 investedTokenAPY)
    {
        address aDaiAddress = address(depositableACurrenciesContracts["DAI"]); // Ropsten aDAI
        address aUsdcAddress = address(depositableACurrenciesContracts["USDC"]); // Ropsten aUSDC

        // Client has to convert to balanceOf / 1e18
        uint256 _investedBalance = IAtoken(aDaiAddress).balanceOf(
            address(this)
        );
        _investedBalance += IAtoken(aUsdcAddress).balanceOf(address(this));

        address daiAddress = address(depositableCurrenciesContracts["DAI"]);
        address usdcAddress = address(depositableCurrenciesContracts["USDC"]);

        // Retrieve LendingPool address
        ILendingPoolAddressesProvider provider = ILendingPoolAddressesProvider(
            address(0x1c8756FD2B28e9426CDBDcC7E3c4d64fa9A54728)
        ); // Ropsten address, for other addresses: https://docs.aave.com/developers/developing-on-aave/deployed-contract-instances
        ILendingPool lendingPool = ILendingPool(provider.getLendingPool());

        // Client has to convert to balanceOf / 1e27
        (, , , , uint256 daiLiquidityRate, , , , , , , , ) = lendingPool
            .getReserveData(daiAddress);
        (, , , , uint256 usdcLiquidityRate, , , , , , , , ) = lendingPool
            .getReserveData(usdcAddress);

        uint256 liquidityRate = daiLiquidityRate.add(usdcLiquidityRate).rayDiv(
            2
        );

        return (_investedBalance, liquidityRate);
    }

    fallback() external payable {}
}
