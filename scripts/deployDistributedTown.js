/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0x42c2d3EBaAE166BA90D4baB27cD91621Ff77dAA5";

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
