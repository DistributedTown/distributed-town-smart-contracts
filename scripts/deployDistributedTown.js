/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0xabD7A12E094D7b1A545F3757B7fb06834297d2e3";

    console.log("\n\n 📡 Deploying...\n");

    const distributedTown = await deploy("DistributedTown", ['http://someurl.io', skillWalletAddress]);
    await distributedTown.deployed();
    await distributedTown.deployGenesisCommunities(0);
    await distributedTown.deployGenesisCommunities(1);
    await distributedTown.deployGenesisCommunities(2);
    
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
