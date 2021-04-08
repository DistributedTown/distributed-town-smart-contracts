/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const {  ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0xCdB88A3a0be546e38831fAC5be50a19Bb7ae27ce";

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
