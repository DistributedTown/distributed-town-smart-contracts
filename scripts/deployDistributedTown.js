/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers, upgrades } = require("hardhat");
const { deploy } = require("./utils")


const main = async () => {
    console.log("\n\n 📡 Deploying...\n");
    const GigStatuses = await ethers.getContractFactory('GigStatuses');
    const gigStatuses = await GigStatuses.deploy();
    await gigStatuses.deployed();
    console.log('gigStatusesAddress', gigStatuses.address)
    const skillWalletAddress = '0xdC8fDfBdddcce3b8DfFc345Bd426789a7b2534A1';

    const addressProvider = await deploy('AddressProvider', [], {},
    {
        GigStatuses: gigStatuses.address
    });
    const comFactory = await deploy('CommunityFactory', ['1'], {});
      
    await addressProvider.deployed();

    const communityFactory = await deploy('CommunityFactory', [1], {});

    const DistributedTown = await ethers.getContractFactory('DistributedTown');

    const distributedTown = await upgrades.deployProxy(DistributedTown, [
        'http://someurl.io', 
        skillWalletAddress, 
        addressProvider.address,
        communityFactory.address
    ], {
        gasLimit: 9500000
    });
    await distributedTown.deployed();

    const a = await distributedTown.deployGenesisCommunities(0);
    await distributedTown.deployGenesisCommunities(1);
    await distributedTown.deployGenesisCommunities(2);
    console.log(await a.wait());
    console.log(a);

    const coms = await distributedTown.getCommunities();
    console.log(coms);

    console.log('DistributedTown deployed to:', distributedTown.address);
    console.log(
        " 💾  Artifacts (address, abi, and args) saved to: ",
        chalk.blue("packages/hardhat/artifacts/"),
        "\n\n"
    );
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
