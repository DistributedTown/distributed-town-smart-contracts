/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const {  ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0x5c7670C72A16022a737E480c675BF1A3a0892245";

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
