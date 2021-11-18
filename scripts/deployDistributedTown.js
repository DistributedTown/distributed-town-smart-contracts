/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    // const skillWalletAddress = "0x301214E981aAE83163A70266832748fB2D030156";
    const skillWalletAddress = '0xC048276176B8D6541ac0b39B853067202b571E08';
    console.log("\n\n 📡 Deploying...\n");
    const gigStatuses = await deploy('GigStatuses');
    await gigStatuses.deployed();

    const addressProvider = await deploy('AddressProvider', [], {},
    {
        GigStatuses: gigStatuses.address
    });
    const comFactory = await deploy('CommunityFactory', ['1'], {});
      
    await addressProvider.deployed();
    const distributedTown = await deploy("DistributedTown", ['http://someurl.io', skillWalletAddress, addressProvider.address, comFactory.address]);
    await distributedTown.deployed();
    const a = await distributedTown.deployGenesisCommunities(0);
    await distributedTown.deployGenesisCommunities(1);
    await distributedTown.deployGenesisCommunities(2);
    console.log(a);

    const coms = await distributedTown.getCommunities();
    console.log(coms);

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
