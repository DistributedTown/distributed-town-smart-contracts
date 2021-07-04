/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    // const skillWalletAddress = "0x301214E981aAE83163A70266832748fB2D030156";
    const skillWalletAddress = '0x698f51C10fa47bE854E974C2b526D5288e0Bd5A7';
    console.log("\n\n 📡 Deploying...\n");
    const gigStatuses = await deploy('GigStatuses');
    await gigStatuses.deployed();

    const addressProvider = await deploy('AddressProvider', [], {},
        {
            GigStatuses: gigStatuses.address
        });
    await addressProvider.deployed();
    const distributedTown = await deploy("DistributedTown", ['http://someurl.io', skillWalletAddress, addressProvider.address]);
    await distributedTown.deployed();
    const a = await distributedTown.deployGenesisCommunities(0, {
        // The maximum units of gas for the transaction to use
        gasLimit: 2300000
    });
    console.log(a);
    // await distributedTown.deployGenesisCommunities(1);
    // await distributedTown.deployGenesisCommunities(2);

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
