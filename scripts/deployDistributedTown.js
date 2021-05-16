/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0x8ac6E742375a61C8F1cAa829E7d2B07aDD123C9C";

    console.log("\n\n 📡 Deploying...\n");

    // const distributedTown = await deploy("DistributedTown", ['http://someurl.io', skillWalletAddress]);
    // await distributedTown.deployed();
    // await distributedTown.deployGenesisCommunities();

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
