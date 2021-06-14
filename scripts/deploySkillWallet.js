/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();

    // const oracle = '0xc8D925525CA8759812d0c299B90247917d4d4b7C';
    // const jobId = ethers.utils.toUtf8Bytes('f4b6aa4bec634966ac35f0550937f7ba')
    const skillWallet = await deploy("SkillWallet");


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
