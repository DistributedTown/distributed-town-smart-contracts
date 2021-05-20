/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0xFB3F02c6CA4dFef1b6B5Ef74591ac47a7B5C85d3";

    console.log("\n\n 📡 Deploying...\n");

    const distributedTown = await deploy("DistributedTown", ['http://someurl.io', skillWalletAddress]);
    await distributedTown.deployed();
    await distributedTown.deployGenesisCommunities();
    
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
