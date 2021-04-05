/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const {  ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0x89AB41fceb97324BEf2Aa5d5048F13b71b8fbca2";

    console.log("\n\n 📡 Deploying...\n");

    const communityRegistry = await deploy("CommunitiesRegistry", [skillWalletAddress]);

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
